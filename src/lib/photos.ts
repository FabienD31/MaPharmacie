import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Photos des médicaments.
 *
 * Les photos restent sur le téléphone, comme le reste : elles sont copiées
 * dans le dossier privé de l'application, jamais envoyées nulle part.
 *
 * Le sélecteur renvoie un fichier temporaire, que le système peut effacer à
 * tout moment. On en fait donc une copie durable avant d'enregistrer son
 * chemin en base, sans quoi la fiche pointerait un jour vers le vide.
 */

/** Sous-dossier des photos, dans le stockage privé de l'application. */
const DOSSIER = 'photos';

/** Compromis taille / lisibilité : une boîte de médicament n'a pas besoin de plus. */
const QUALITE = 0.6;

export type ResultatPhoto =
  | { statut: 'ok'; uri: string }
  | { statut: 'annule' }
  | { statut: 'refus' }
  | { statut: 'erreur'; message: string };

/** Crée le dossier des photos s'il n'existe pas encore. */
function dossierPhotos(): Directory {
  const dossier = new Directory(Paths.document, DOSSIER);
  if (!dossier.exists) {
    dossier.create({ intermediates: true });
  }
  return dossier;
}

/**
 * Copie un fichier temporaire dans le stockage durable de l'application.
 * Renvoie l'URI de la copie.
 */
async function conserver(uriTemporaire: string): Promise<string> {
  const dossier = dossierPhotos();

  // Nom unique : l'horodatage suffit, une photo est prise à la fois.
  const extension = uriTemporaire.split('.').pop()?.toLowerCase() ?? 'jpg';
  const nom = `${Date.now()}.${extension.length <= 4 ? extension : 'jpg'}`;

  const source = new File(uriTemporaire);
  const destination = new File(dossier, nom);

  await source.copy(destination);
  return destination.uri;
}

/** Traite le résultat du sélecteur, quelle que soit sa provenance. */
async function traiter(
  resultat: ImagePicker.ImagePickerResult
): Promise<ResultatPhoto> {
  if (resultat.canceled) return { statut: 'annule' };

  const premiere = resultat.assets[0];
  if (!premiere) return { statut: 'annule' };

  try {
    return { statut: 'ok', uri: await conserver(premiere.uri) };
  } catch {
    return {
      statut: 'erreur',
      message: "La photo n'a pas pu être enregistrée.",
    };
  }
}

/** Ouvre l'appareil photo et conserve le cliché. */
export async function prendrePhoto(): Promise<ResultatPhoto> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { statut: 'refus' };

  const resultat = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: QUALITE,
    allowsEditing: true,
  });

  return traiter(resultat);
}

/** Ouvre la photothèque et conserve l'image choisie. */
export async function choisirPhoto(): Promise<ResultatPhoto> {
  const resultat = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: QUALITE,
    allowsEditing: true,
  });

  return traiter(resultat);
}

/**
 * Efface une photo du stockage.
 *
 * Silencieux si le fichier a déjà disparu : la suppression d'un médicament ne
 * doit pas échouer parce que sa photo n'est plus là.
 */
export function supprimerPhoto(uri: string | null): void {
  if (!uri) return;
  try {
    const fichier = new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    // Rien à faire : l'objectif était que le fichier n'existe plus.
  }
}
