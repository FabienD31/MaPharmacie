import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

/**
 * D'où vient le code que l'application exécute ?
 *
 * Trois provenances possibles, indiscernables à l'œil nu :
 * le serveur de développement, le code embarqué dans l'application au moment
 * de sa construction, ou une mise à jour téléchargée depuis les serveurs
 * d'Expo.
 *
 * La distinction entre les deux dernières est la plus trompeuse : un
 * identifiant de version existe dans les deux cas, car le code embarqué en
 * possède un lui aussi. Seul `isEmbeddedLaunch` tranche — s'en remettre à la
 * présence d'un identifiant fait croire à tort qu'une mise à jour est active.
 */

type Etat =
  | { phase: 'repos' }
  | { phase: 'verification' }
  | { phase: 'resultat'; message: string }
  | { phase: 'erreur'; message: string };

export function ProvenanceApp() {
  const [etat, setEtat] = useState<Etat>({ phase: 'repos' });

  const identifiant = Updates.updateId;
  const embarque = Updates.isEmbeddedLaunch;
  const actif = Updates.isEnabled;

  const provenance = !actif
    ? 'Serveur de développement'
    : embarque
      ? 'Code embarqué'
      : 'Mise à jour téléchargée';

  const explication = !actif
    ? "Le code vient d'un serveur local. L'ordinateur doit rester allumé et sur le même réseau."
    : embarque
      ? "Le code est celui compilé dans l'application. Aucune mise à jour publiée n'a encore été appliquée."
      : "Le code a été téléchargé depuis les serveurs d'Expo, après la construction de l'application.";

  /**
   * Interroge le serveur de mises à jour et, s'il y en a une, la télécharge
   * puis redémarre. Les erreurs sont affichées telles quelles : c'est le seul
   * moyen de savoir pourquoi une mise à jour n'arrive pas sur un appareil
   * auquel on n'a pas accès.
   */
  async function verifier() {
    setEtat({ phase: 'verification' });

    try {
      const resultat = await Updates.checkForUpdateAsync();

      if (!resultat.isAvailable) {
        setEtat({
          phase: 'resultat',
          message: 'Aucune mise à jour disponible : tu as déjà la dernière version.',
        });
        return;
      }

      await Updates.fetchUpdateAsync();
      setEtat({
        phase: 'resultat',
        message: 'Mise à jour téléchargée. Redémarrage…',
      });
      await Updates.reloadAsync();
    } catch (erreur) {
      setEtat({
        phase: 'erreur',
        message: erreur instanceof Error ? erreur.message : 'Erreur inconnue.',
      });
    }
  }

  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>Provenance</Text>

      <View
        style={[
          styles.pastille,
          !actif ? styles.dev : embarque ? styles.embarquee : styles.telechargee,
        ]}
      >
        <Text
          style={[
            styles.texteP,
            !actif ? styles.texteDev : embarque ? styles.texteEmb : styles.textePub,
          ]}
        >
          {provenance}
        </Text>
      </View>

      <Text style={styles.description}>{explication}</Text>

      {Updates.channel && (
        <Text style={styles.detail}>Canal : {Updates.channel}</Text>
      )}
      {Updates.runtimeVersion && (
        <Text style={styles.detail}>Runtime : {Updates.runtimeVersion}</Text>
      )}
      {identifiant && (
        <Text style={styles.detail}>Version : {identifiant.slice(0, 8)}</Text>
      )}
      <Text style={styles.detail}>
        SDK {Constants.expoConfig?.sdkVersion ?? '—'}
      </Text>

      {actif && (
        <Pressable
          onPress={verifier}
          disabled={etat.phase === 'verification'}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.bouton,
            etat.phase === 'verification' && styles.boutonOccupe,
            pressed && styles.boutonPresse,
          ]}
        >
          {etat.phase === 'verification' ? (
            <ActivityIndicator color={couleurs.primaire} />
          ) : (
            <Text style={styles.texteBouton}>Vérifier les mises à jour</Text>
          )}
        </Pressable>
      )}

      {etat.phase === 'resultat' && (
        <Text style={styles.message}>{etat.message}</Text>
      )}
      {etat.phase === 'erreur' && (
        <Text style={styles.messageErreur}>{etat.message}</Text>
      )}
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
  telechargee: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
  },
  embarquee: {
    backgroundColor: couleurs.fond,
    borderColor: couleurs.bordure,
  },
  dev: {
    backgroundColor: couleurs.avertissementFond,
    borderColor: couleurs.avertissementBordure,
  },
  texteP: {
    fontSize: 13,
    fontWeight: '600',
  },
  textePub: { color: couleurs.primaire },
  texteEmb: { color: couleurs.texteSecondaire },
  texteDev: { color: couleurs.bientotPerime },
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
  bouton: {
    marginTop: espacements.m,
    borderColor: couleurs.primaire,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingVertical: espacements.m,
    alignItems: 'center',
  },
  boutonOccupe: { opacity: 0.6 },
  boutonPresse: { opacity: 0.6 },
  texteBouton: {
    color: couleurs.primaire,
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    marginTop: espacements.s,
    fontSize: 12,
    lineHeight: 17,
    color: couleurs.texteSecondaire,
  },
  messageErreur: {
    marginTop: espacements.s,
    fontSize: 12,
    lineHeight: 17,
    color: couleurs.perime,
  },
});
