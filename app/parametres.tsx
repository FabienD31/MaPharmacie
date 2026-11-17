import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProvenanceApp } from '../src/components/ProvenanceApp';
import { SEUIL_MAX, SEUIL_MIN } from '../src/db/parametres';
import {
  cleParaitValide,
  ecrireCleApi,
  effacerCleApi,
  lireCleApi,
  masquerCle,
} from '../src/lib/cleApi';
import { usePreferences } from '../src/lib/ContextePreferences';
import { demanderAutorisation } from '../src/lib/notifications';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/** Valeurs de seuil proposées en un geste, en jours. */
const SEUILS_RAPIDES = [7, 15, 30, 60, 90];

/** Heures de rappel proposées. */
const HEURES = [8, 9, 12, 18, 20];

/** Écran de réglages : notifications et délai d'alerte. */
export default function Parametres() {
  const { preferences, enregistrer } = usePreferences();
  const [occupe, setOccupe] = useState(false);

  /** Clé d'API : saisie en cours, et clé déjà enregistrée (masquée). */
  const [saisieCle, setSaisieCle] = useState('');
  const [cleEnregistree, setCleEnregistree] = useState<string | null>(null);
  const [messageCle, setMessageCle] = useState<string | null>(null);

  useEffect(() => {
    lireCleApi().then(setCleEnregistree);
  }, []);

  /** Enregistre la clé saisie dans le trousseau du système. */
  async function enregistrerCle() {
    const propre = saisieCle.trim();

    if (!cleParaitValide(propre)) {
      setMessageCle("Cette clé n'a pas la forme attendue (sk-ant-…).");
      return;
    }

    await ecrireCleApi(propre);
    setCleEnregistree(propre);
    // On vide le champ : la clé ne doit pas rester affichée à l'écran.
    setSaisieCle('');
    setMessageCle('Clé enregistrée.');
  }

  /** Retire la clé du trousseau. */
  function confirmerSuppressionCle() {
    Alert.alert(
      'Supprimer la clé ?',
      'Les suggestions par IA seront désactivées. Le reste de l’application continue de fonctionner.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await effacerCleApi();
            setCleEnregistree(null);
            setMessageCle(null);
          },
        },
      ]
    );
  }

  /** Active ou désactive les notifications, en demandant l'autorisation. */
  async function basculerNotifications(active: boolean) {
    setOccupe(true);
    try {
      if (!active) {
        await enregistrer({ ...preferences, notificationsActives: false });
        return;
      }

      const autorise = await demanderAutorisation();
      if (!autorise) {
        Alert.alert(
          'Notifications refusées',
          "L'autorisation n'a pas été accordée. Tu peux l'activer depuis les réglages de ton téléphone.",
          [
            { text: 'Fermer', style: 'cancel' },
            {
              text: 'Ouvrir les réglages',
              onPress: () => {
                Linking.openSettings().catch(() => {
                  // Rien à faire de plus si le système refuse d'ouvrir l'écran.
                });
              },
            },
          ]
        );
        return;
      }

      await enregistrer({ ...preferences, notificationsActives: true });
    } finally {
      setOccupe(false);
    }
  }

  async function changerSeuil(jours: number) {
    if (jours < SEUIL_MIN || jours > SEUIL_MAX) return;
    setOccupe(true);
    try {
      await enregistrer({ ...preferences, seuilJours: jours });
    } finally {
      setOccupe(false);
    }
  }

  async function changerHeure(heure: number) {
    setOccupe(true);
    try {
      await enregistrer({ ...preferences, heureRappel: heure });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={[styles.contenu, styles.centre]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.carte}>
        <View style={styles.rangee}>
          <View style={styles.rangeeTexte}>
            <Text style={styles.titre}>Alertes de péremption</Text>
            <Text style={styles.description}>
              Une notification locale avant que chaque médicament n&apos;arrive à
              péremption.
            </Text>
          </View>

          <Switch
            value={preferences.notificationsActives}
            onValueChange={basculerNotifications}
            disabled={occupe}
            trackColor={{ true: couleurs.primaire }}
          />
        </View>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Prévenir combien de jours avant ?</Text>
        <Text style={styles.description}>
          Le délai sert aussi à colorer les badges de la liste.
        </Text>

        <View style={styles.puces}>
          {SEUILS_RAPIDES.map((jours) => {
            const actif = preferences.seuilJours === jours;
            return (
              <Pressable
                key={jours}
                onPress={() => changerSeuil(jours)}
                disabled={occupe}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                style={({ pressed }) => [
                  styles.puce,
                  actif && styles.puceActive,
                  pressed && styles.pucePressee,
                ]}
              >
                <Text style={[styles.textePuce, actif && styles.textePuceActif]}>
                  {jours} j
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Heure du rappel</Text>
        <Text style={styles.description}>
          Heure locale à laquelle la notification est envoyée.
        </Text>

        <View style={styles.puces}>
          {HEURES.map((heure) => {
            const actif = preferences.heureRappel === heure;
            return (
              <Pressable
                key={heure}
                onPress={() => changerHeure(heure)}
                disabled={occupe}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                style={({ pressed }) => [
                  styles.puce,
                  actif && styles.puceActive,
                  pressed && styles.pucePressee,
                ]}
              >
                <Text style={[styles.textePuce, actif && styles.textePuceActif]}>
                  {heure} h
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Suggestions par IA</Text>
        <Text style={styles.description}>
          Permet de proposer sur quoi agit un médicament, au scan ou depuis le
          formulaire. Nécessite ta propre clé d&apos;API Anthropic, facturée sur
          ton compte.
        </Text>

        {cleEnregistree ? (
          <View style={styles.rangeeCle}>
            <Text style={styles.cleMasquee}>{masquerCle(cleEnregistree)}</Text>
            <Pressable
              onPress={confirmerSuppressionCle}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.lienSupprimer}>Supprimer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.champCle}
              value={saisieCle}
              onChangeText={(texte) => {
                setSaisieCle(texte);
                setMessageCle(null);
              }}
              placeholder="sk-ant-…"
              placeholderTextColor={couleurs.texteSecondaire}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              accessibilityLabel="Clé d'API Anthropic"
            />

            <Pressable
              onPress={enregistrerCle}
              disabled={saisieCle.trim().length === 0}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boutonCle,
                saisieCle.trim().length === 0 && styles.boutonDesactive,
                pressed && styles.pucePressee,
              ]}
            >
              <Text style={styles.texteBoutonCle}>Enregistrer la clé</Text>
            </Pressable>
          </>
        )}

        {messageCle && <Text style={styles.messageCle}>{messageCle}</Text>}

        <Text style={styles.description}>
          La clé est rangée dans le trousseau du téléphone, chiffrée par le
          système. Une suggestion envoie à Anthropic le nom du médicament, son
          principe actif et son dosage — rien d&apos;autre.
        </Text>
      </View>

      <ProvenanceApp />

      <View style={styles.note}>
        <Text style={styles.texteNote}>
          Les alertes sont calculées sur ton téléphone. Aucune donnée n&apos;est
          envoyée sur le réseau.
        </Text>
        {Platform.OS === 'ios' && (
          <Text style={styles.texteNote}>
            Un médicament déjà dans le délai d&apos;alerte ne déclenche pas de
            notification : la date est passée. Il reste signalé dans la liste.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Sur tablette, le contenu reste centré et borné : une ligne de texte
  // large de 10 pouces est illisible.
  centre: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  contenu: {
    padding: espacements.l,
    paddingBottom: espacements.xxl,
  },
  carte: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.l,
    padding: espacements.l,
    marginBottom: espacements.m,
  },
  rangee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
  },
  rangeeTexte: {
    flex: 1,
  },
  titre: {
    fontSize: 15,
    fontWeight: '600',
    color: couleurs.texte,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: couleurs.texteSecondaire,
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacements.s,
    marginTop: espacements.m,
  },
  puce: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.l,
    paddingVertical: espacements.s,
    paddingHorizontal: espacements.m,
  },
  puceActive: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
  },
  pucePressee: {
    opacity: 0.6,
  },
  textePuce: {
    fontSize: 13,
    color: couleurs.texteSecondaire,
  },
  textePuceActif: {
    color: couleurs.primaire,
    fontWeight: '600',
  },
  champCle: {
    marginTop: espacements.m,
    backgroundColor: couleurs.fond,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.m,
    fontSize: 15,
    color: couleurs.texte,
  },
  boutonCle: {
    marginTop: espacements.s,
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.m,
    paddingVertical: espacements.m,
    alignItems: 'center',
  },
  boutonDesactive: {
    opacity: 0.4,
  },
  texteBoutonCle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rangeeCle: {
    marginTop: espacements.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.m,
  },
  cleMasquee: {
    fontSize: 15,
    color: couleurs.texte,
    letterSpacing: 1,
  },
  lienSupprimer: {
    fontSize: 13,
    fontWeight: '600',
    color: couleurs.perime,
  },
  messageCle: {
    marginTop: espacements.s,
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
  note: {
    paddingHorizontal: espacements.xs,
    gap: espacements.s,
  },
  texteNote: {
    fontSize: 12,
    lineHeight: 17,
    color: couleurs.texteSecondaire,
  },
});
