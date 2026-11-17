import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ecrirePreferences,
  lirePreferences,
  PREFERENCES_PAR_DEFAUT,
  type Preferences,
} from '../db/parametres';
import { reprogrammerNotifications } from './notifications';

type ValeurContexte = {
  preferences: Preferences;
  /** true tant que les réglages n'ont pas été lus en base. */
  chargement: boolean;
  /** Enregistre les réglages et reprogramme les notifications. */
  enregistrer: (preferences: Preferences) => Promise<void>;
  /** Reprogramme les notifications avec les réglages courants. */
  resynchroniser: () => Promise<void>;
};

const Contexte = createContext<ValeurContexte | null>(null);

/**
 * Met les réglages à disposition de toute l'application.
 *
 * Les notifications sont systématiquement reprogrammées après un changement de
 * réglage : le seuil d'alerte détermine la date de chaque notification, les
 * anciennes deviennent donc caduques dès qu'il bouge.
 */
export function FournisseurPreferences({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [preferences, setPreferences] = useState(PREFERENCES_PAR_DEFAUT);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;

    lirePreferences(db).then((lues) => {
      if (!actif) return;
      setPreferences(lues);
      setChargement(false);
      // Les notifications sont recalculées au lancement : le temps a passé
      // depuis la dernière ouverture, et la base a pu changer entre-temps.
      reprogrammerNotifications(db, lues).catch(() => {
        // Un échec de programmation ne doit pas empêcher l'app de démarrer.
      });
    });

    return () => {
      actif = false;
    };
  }, [db]);

  const enregistrer = useCallback(
    async (nouvelles: Preferences) => {
      await ecrirePreferences(db, nouvelles);
      setPreferences(nouvelles);
      await reprogrammerNotifications(db, nouvelles);
    },
    [db]
  );

  const resynchroniser = useCallback(async () => {
    await reprogrammerNotifications(db, preferences);
  }, [db, preferences]);

  const valeur = useMemo(
    () => ({ preferences, chargement, enregistrer, resynchroniser }),
    [preferences, chargement, enregistrer, resynchroniser]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/** Accès aux réglages depuis un écran. */
export function usePreferences(): ValeurContexte {
  const valeur = useContext(Contexte);
  if (!valeur) {
    throw new Error(
      'usePreferences doit être utilisé dans un FournisseurPreferences.'
    );
  }
  return valeur;
}
