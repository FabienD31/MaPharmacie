import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { chercherParCip13 } from '../src/lib/apiMedicaments';
import { decoderCodeBarre } from '../src/lib/codeBarres';
import { useMargeBasse } from '../src/lib/miseEnPage';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/**
 * Types de codes lus. Le Datamatrix est celui des boîtes récentes, l'EAN-13
 * celui des boîtes plus anciennes.
 */
const TYPES_CODES = ['datamatrix', 'ean13', 'code128'] as const;

type Etat =
  | { phase: 'scan' }
  | { phase: 'recherche' }
  | { phase: 'echec'; message: string; cip13: string | null; date: string | null };

/**
 * Écran de scan d'une boîte de médicament.
 *
 * Le code-barres est décodé sur le téléphone. Si un CIP13 en est tiré, il est
 * envoyé à l'API publique pour récupérer le nom, le principe actif et la forme
 * (voir `apiMedicaments.ts` pour ce qui sort du téléphone). La date de
 * péremption, elle, est lue directement dans le code et n'exige aucun réseau.
 *
 * En cas d'échec, on bascule quand même vers le formulaire avec ce qui a pu
 * être lu : mieux vaut un préremplissage partiel qu'un écran bloqué.
 */
export default function Scan() {
  const [permission, demanderPermission] = useCameraPermissions();
  const margeBasse = useMargeBasse(espacements.xl);
  const [etat, setEtat] = useState<Etat>({ phase: 'scan' });

  // La caméra émet plusieurs fois le même code : ce verrou évite de lancer
  // autant de recherches réseau que d'images analysées.
  const verrou = useRef(false);

  /** Ouvre le formulaire en lui passant ce qui a été trouvé. */
  function versFormulaire(parametres: Record<string, string>) {
    router.replace({ pathname: '/formulaire', params: parametres });
  }

  async function traiterCode(donnees: string) {
    if (verrou.current) return;
    verrou.current = true;

    const decode = decoderCodeBarre(donnees);

    if (!decode) {
      setEtat({
        phase: 'echec',
        message: "Ce code-barres n'a pas été reconnu comme celui d'une boîte de médicament.",
        cip13: null,
        date: null,
      });
      return;
    }

    // Sans CIP13, on a au moins la date de péremption : on la transmet.
    if (!decode.cip13) {
      versFormulaire(
        decode.datePeremption ? { datePeremption: decode.datePeremption } : {}
      );
      return;
    }

    setEtat({ phase: 'recherche' });
    const resultat = await chercherParCip13(decode.cip13);

    if (resultat.statut === 'trouve') {
      const { fiche } = resultat;
      versFormulaire({
        nom: fiche.nom,
        ...(fiche.principeActif ? { principeActif: fiche.principeActif } : {}),
        ...(fiche.dosage ? { dosage: fiche.dosage } : {}),
        ...(fiche.forme ? { forme: fiche.forme } : {}),
        ...(fiche.quantite !== null
          ? { quantite: String(fiche.quantite) }
          : {}),
        ...(decode.datePeremption
          ? { datePeremption: decode.datePeremption }
          : {}),
      });
      return;
    }

    setEtat({
      phase: 'echec',
      message:
        resultat.statut === 'inconnu'
          ? "Ce code n'a pas été trouvé dans la base publique des médicaments."
          : resultat.message,
      cip13: decode.cip13,
      date: decode.datePeremption,
    });
  }

  /** Relance un scan après un échec. */
  function reessayer() {
    verrou.current = false;
    setEtat({ phase: 'scan' });
  }

  if (!permission) {
    return <View style={styles.ecran} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centre}>
        <Text style={styles.titre}>Accès à l&apos;appareil photo</Text>
        <Text style={styles.explication}>
          La caméra sert uniquement à lire le code-barres d&apos;une boîte.
          Aucune photo n&apos;est enregistrée ni envoyée.
        </Text>
        <Pressable
          onPress={demanderPermission}
          accessibilityRole="button"
          style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
        >
          <Text style={styles.texteBouton}>Autoriser</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.lienSecondaire}>Saisir à la main</Text>
        </Pressable>
      </View>
    );
  }

  if (etat.phase === 'recherche') {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.primaire} />
        <Text style={styles.explication}>Recherche du médicament…</Text>
      </View>
    );
  }

  if (etat.phase === 'echec') {
    return (
      <View style={styles.centre}>
        <Text style={styles.titre}>Scan incomplet</Text>
        <Text style={styles.explication}>{etat.message}</Text>

        {etat.date && (
          <Text style={styles.explication}>
            La date de péremption a tout de même été lue sur la boîte.
          </Text>
        )}

        <Pressable
          onPress={reessayer}
          accessibilityRole="button"
          style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
        >
          <Text style={styles.texteBouton}>Réessayer</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            versFormulaire(etat.date ? { datePeremption: etat.date } : {})
          }
          accessibilityRole="button"
        >
          <Text style={styles.lienSecondaire}>
            Continuer en saisie manuelle
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...TYPES_CODES] }}
        onBarcodeScanned={({ data }) => {
          traiterCode(data);
        }}
      />

      <View style={styles.consigne} pointerEvents="none">
        <Text style={styles.texteConsigne}>
          Vise le code-barres de la boîte
        </Text>
        <Text style={styles.sousConsigne}>
          Le carré de points, ou le code à barres classique
        </Text>
      </View>

      <View style={styles.viseur} pointerEvents="none" />

      <Pressable
        onPress={() => router.replace('/formulaire')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.boutonBas,
          { bottom: margeBasse },
          pressed && styles.presse,
        ]}
      >
        <Text style={styles.texteBouton}>Saisir à la main</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.fond,
    padding: espacements.xl,
    gap: espacements.m,
  },
  titre: {
    fontSize: 18,
    fontWeight: '600',
    color: couleurs.texte,
    textAlign: 'center',
  },
  explication: {
    fontSize: 14,
    lineHeight: 20,
    color: couleurs.texteSecondaire,
    textAlign: 'center',
  },
  bouton: {
    marginTop: espacements.s,
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.l,
    paddingVertical: espacements.l,
    paddingHorizontal: espacements.xl,
    alignItems: 'center',
  },
  boutonBas: {
    position: 'absolute',
    left: espacements.l,
    right: espacements.l,
    bottom: espacements.xl,
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.l,
    paddingVertical: espacements.l,
    alignItems: 'center',
  },
  presse: {
    opacity: 0.7,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  lienSecondaire: {
    color: couleurs.primaire,
    fontSize: 14,
    fontWeight: '600',
  },
  consigne: {
    position: 'absolute',
    top: espacements.xl,
    left: espacements.l,
    right: espacements.l,
    alignItems: 'center',
    gap: espacements.xs,
  },
  texteConsigne: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sousConsigne: {
    color: '#FFFFFFCC',
    fontSize: 13,
    textAlign: 'center',
  },
  viseur: {
    position: 'absolute',
    top: '32%',
    left: '15%',
    right: '15%',
    height: 220,
    borderWidth: 2,
    borderColor: '#FFFFFFAA',
    borderRadius: rayons.l,
  },
});
