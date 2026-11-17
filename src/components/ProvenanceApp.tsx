import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

/**
 * D'où vient le code que l'application exécute ?
 *
 * Deux provenances possibles, impossibles à distinguer à l'œil nu :
 * le serveur de développement lancé sur un ordinateur, ou une version
 * publiée téléchargée depuis les serveurs d'Expo.
 *
 * Savoir laquelle tourne évite de se demander si une modification a bien
 * été prise en compte, ou si l'application dépend encore d'un ordinateur
 * allumé.
 */
export function ProvenanceApp() {
  // `isEmbeddedLaunch` et `updateId` ne sont renseignés que lorsqu'une
  // version publiée est en cours d'exécution. Dans Expo Go relié à un
  // serveur, l'API reste muette.
  const identifiant = Updates.updateId;
  const canal = Updates.channel;
  const publiee = Boolean(identifiant);

  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>Provenance</Text>

      <View style={[styles.pastille, publiee ? styles.publiee : styles.dev]}>
        <Text style={[styles.texteP, publiee ? styles.textePub : styles.texteDev]}>
          {publiee ? 'Version publiée' : 'Serveur de développement'}
        </Text>
      </View>

      <Text style={styles.description}>
        {publiee
          ? "Le code vient des serveurs d'Expo. L'application fonctionne sans ordinateur allumé."
          : "Le code vient d'un serveur local. L'ordinateur doit rester allumé et sur le même réseau."}
      </Text>

      {canal && <Text style={styles.detail}>Canal : {canal}</Text>}

      {identifiant && (
        <Text style={styles.detail}>
          Version : {identifiant.slice(0, 8)}
        </Text>
      )}

      <Text style={styles.detail}>
        SDK {Constants.expoConfig?.sdkVersion ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.l,
    padding: espacements.l,
    marginBottom: espacements.m,
  },
  titre: {
    fontSize: 15,
    fontWeight: '600',
    color: couleurs.texte,
    marginBottom: espacements.s,
  },
  pastille: {
    alignSelf: 'flex-start',
    borderRadius: rayons.s,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: espacements.s,
    marginBottom: espacements.s,
  },
  publiee: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
  },
  dev: {
    backgroundColor: couleurs.avertissementFond,
    borderColor: couleurs.avertissementBordure,
  },
  texteP: {
    fontSize: 13,
    fontWeight: '600',
  },
  textePub: {
    color: couleurs.primaire,
  },
  texteDev: {
    color: couleurs.bientotPerime,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: couleurs.texteSecondaire,
  },
  detail: {
    marginTop: espacements.xs,
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
});
