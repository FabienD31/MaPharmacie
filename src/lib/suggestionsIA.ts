import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { lireCleApi } from './cleApi';

/**
 * Suggestions d'effets par IA.
 *
 * ⚠️ SORTIE RÉSEAU — ce module envoie à l'API d'Anthropic le nom du
 * médicament, son principe actif et son dosage. Rien d'autre : pas
 * l'inventaire, pas les quantités, pas les notes, pas les lieux de rangement,
 * pas d'identifiant d'appareil.
 *
 * ⚠️ La clé d'API est portée par le téléphone. C'est acceptable pour une
 * application personnelle utilisant sa propre clé, mais c'est aussi la raison
 * pour laquelle ce schéma ne conviendrait pas à une application distribuée :
 * là, l'appel devrait passer par un serveur intermédiaire.
 *
 * L'IA propose, elle ne décide pas : les suggestions arrivent sous forme de
 * propositions à valider, jamais enregistrées automatiquement.
 */

/** Modèle utilisé. */
const MODELE = 'claude-opus-5-5';

/** Au-delà, on rend la main plutôt que de bloquer l'utilisateur. */
const DELAI_MAX_MS = 30000;

/**
 * Forme attendue de la réponse.
 * Un schéma strict évite d'avoir à interpréter du texte libre.
 */
const SchemaSuggestions = z.object({
  effets: z
    .array(z.string())
    .describe(
      'Symptômes ou situations sur lesquels ce médicament agit, en français, ' +
        'au singulier, en minuscules, 1 à 3 mots chacun. Liste vide si inconnu.'
    ),
  resume: z
    .string()
    .describe(
      'Une phrase courte décrivant à quoi sert ce médicament, sans posologie ' +
        'ni conseil de prise. Chaîne vide si inconnu.'
    ),
});

export type Suggestions = {
  effets: string[];
  resume: string;
};

export type ResultatSuggestions =
  | { statut: 'ok'; suggestions: Suggestions }
  | { statut: 'sans_cle' }
  | { statut: 'erreur'; message: string };

/**
 * Consigne donnée au modèle.
 *
 * Elle borne volontairement la réponse : décrire ce que traite le médicament,
 * sans jamais glisser vers le conseil de prise, qui n'est pas le rôle de
 * l'application.
 */
const CONSIGNE_SYSTEME = [
  "Tu aides à ranger une pharmacie familiale. Pour un médicament donné, tu listes les symptômes ou situations sur lesquels il agit, d'après sa notice.",
  'Règles strictes :',
  "- Ne donne jamais de posologie, de dose, de fréquence ni de conseil de prise.",
  "- Ne dis jamais si quelqu'un doit prendre ce médicament.",
  '- Emploie des termes courants et courts : « mal de tête », « fièvre », « toux sèche ».',
  "- Si tu n'es pas sûr du médicament, renvoie une liste vide plutôt que d'inventer.",
  '- Six effets au maximum.',
].join('\n');

/**
 * Demande des suggestions pour un médicament.
 * Ne lève jamais : toute panne se traduit par un statut que l'écran affiche.
 */
export async function suggererEffets(
  nom: string,
  principeActif: string | null,
  dosage: string | null
): Promise<ResultatSuggestions> {
  const cle = await lireCleApi();
  if (!cle) return { statut: 'sans_cle' };

  // `dangerouslyAllowBrowser` : React Native expose un environnement que le SDK
  // assimile à un navigateur. Le risque que ce garde-fou signale — exposer une
  // clé partagée à des visiteurs — ne s'applique pas ici : la clé appartient à
  // l'utilisateur et ne quitte pas son téléphone.
  const client = new Anthropic({
    apiKey: cle,
    dangerouslyAllowBrowser: true,
    timeout: DELAI_MAX_MS,
    maxRetries: 1,
  });

  const description = [nom, principeActif, dosage].filter(Boolean).join(', ');

  try {
    const reponse = await client.messages.parse({
      model: MODELE,
      max_tokens: 2000,
      system: CONSIGNE_SYSTEME,
      // Tâche courte et bornée : l'effort le plus bas suffit et limite le coût.
      output_config: {
        effort: 'low',
        format: zodOutputFormat(SchemaSuggestions),
      },
      messages: [
        {
          role: 'user',
          content: `Médicament : ${description}. Sur quoi agit-il ?`,
        },
      ],
    });

    // Un refus de sécurité renvoie un statut, pas du contenu exploitable.
    if (reponse.stop_reason === 'refusal') {
      return {
        statut: 'erreur',
        message: "Le modèle n'a pas souhaité répondre pour ce médicament.",
      };
    }

    const analyse = reponse.parsed_output;
    if (!analyse) {
      return {
        statut: 'erreur',
        message: 'Réponse illisible du modèle.',
      };
    }

    // Nettoyage : on borne la liste et on écarte les entrées vides.
    const effets = analyse.effets
      .map((effet) => effet.trim())
      .filter((effet) => effet.length > 0 && effet.length <= 40)
      .slice(0, 6);

    return { statut: 'ok', suggestions: { effets, resume: analyse.resume.trim() } };
  } catch (erreur) {
    if (erreur instanceof Anthropic.AuthenticationError) {
      return { statut: 'erreur', message: "La clé d'API est refusée." };
    }
    if (erreur instanceof Anthropic.RateLimitError) {
      return { statut: 'erreur', message: 'Trop de requêtes, réessaie plus tard.' };
    }
    if (erreur instanceof Anthropic.APIConnectionError) {
      return {
        statut: 'erreur',
        message: "Impossible de joindre l'API. Vérifie ta connexion.",
      };
    }
    if (erreur instanceof Anthropic.APIError) {
      return { statut: 'erreur', message: `Erreur ${erreur.status}.` };
    }
    return { statut: 'erreur', message: 'Erreur inattendue.' };
  }
}
