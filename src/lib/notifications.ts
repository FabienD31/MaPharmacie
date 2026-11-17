import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';

import { listerMedicaments } from '../db/medicaments';
import type { Preferences } from '../db/parametres';
import { isoVersAffichage, joursRestants } from './dates';

/**
 * Notifications locales de péremption.
 *
 * Tout est calculé et programmé sur l'appareil : aucune donnée ne part sur le
 * réseau, et l'application n'utilise pas les notifications distantes.
 *
 * iOS limite à 64 le nombre de notifications locales en attente par app.
 * On programme donc les échéances les plus proches en priorité.
 */
const LIMITE_IOS = 64;

/** Affichage des notifications même quand l'app est au premier plan. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Demande l'autorisation d'envoyer des notifications.
 * Renvoie true si elle est accordée. iOS ne repose la question qu'une fois :
 * si l'utilisateur a refusé, il faut passer par les réglages du système.
 */
export async function demanderAutorisation(): Promise<boolean> {
  const actuelle = await Notifications.getPermissionsAsync();
  if (actuelle.granted) return true;

  if (!actuelle.canAskAgain) return false;

  const demande = await Notifications.requestPermissionsAsync();
  return demande.granted;
}

/** Annule toutes les notifications programmées par l'application. */
export async function annulerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Date et heure d'alerte pour une péremption donnée.
 *
 * L'alerte tombe `seuilJours` avant la fin du mois de péremption, à l'heure
 * choisie. Renvoie null si ce moment est déjà passé : on ne programme rien
 * dans le passé, et ces médicaments sont de toute façon signalés dans la liste.
 */
function dateAlerte(
  datePeremption: string,
  preferences: Preferences
): Date | null {
  const restants = joursRestants(datePeremption);
  if (restants === null) return null;

  const joursAvantAlerte = restants - preferences.seuilJours;

  const alerte = new Date();
  alerte.setDate(alerte.getDate() + joursAvantAlerte);
  alerte.setHours(preferences.heureRappel, 0, 0, 0);

  return alerte.getTime() > Date.now() ? alerte : null;
}

/**
 * Reprogramme l'ensemble des notifications à partir du contenu de la base.
 *
 * On annule tout avant de reprogrammer : c'est la façon la plus simple de
 * rester cohérent après un ajout, une modification, une suppression ou un
 * changement de seuil, sans avoir à suivre chaque notification individuellement.
 *
 * Renvoie le nombre de notifications programmées.
 */
export async function reprogrammerNotifications(
  db: SQLiteDatabase,
  preferences: Preferences
): Promise<number> {
  await annulerNotifications();

  if (!preferences.notificationsActives) return 0;

  const medicaments = await listerMedicaments(db);

  // La liste est déjà triée par péremption croissante : prendre les premiers
  // revient à garder les échéances les plus proches sous la limite iOS.
  const aProgrammer = medicaments
    .filter((medicament) => medicament.datePeremption !== null)
    .slice(0, LIMITE_IOS);

  let programmees = 0;

  for (const medicament of aProgrammer) {
    const quand = dateAlerte(medicament.datePeremption as string, preferences);
    if (!quand) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Péremption proche',
        // Informatif uniquement : aucun conseil de prise ni de posologie.
        body: `${medicament.nom} expire en ${isoVersAffichage(
          medicament.datePeremption
        )}.`,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: quand,
      },
    });

    programmees += 1;
  }

  return programmees;
}
