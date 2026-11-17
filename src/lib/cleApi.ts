import * as SecureStore from 'expo-secure-store';

/**
 * Stockage de la clé d'API Anthropic.
 *
 * La clé est rangée dans le trousseau du système (Keychain sur iOS), pas dans
 * la base SQLite ni dans un fichier de l'application : elle est chiffrée par
 * le système et n'apparaît pas dans une sauvegarde en clair.
 *
 * La clé n'est jamais écrite dans les journaux, jamais affichée en entier, et
 * ne quitte le téléphone que vers l'API d'Anthropic au moment d'une requête.
 */
const CLE_TROUSSEAU = 'anthropic_api_key';

/** Lit la clé enregistrée, ou null si aucune. */
export async function lireCleApi(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CLE_TROUSSEAU);
  } catch {
    // Trousseau indisponible : on se comporte comme s'il n'y avait pas de clé.
    return null;
  }
}

/** Enregistre la clé. */
export async function ecrireCleApi(cle: string): Promise<void> {
  await SecureStore.setItemAsync(CLE_TROUSSEAU, cle.trim());
}

/** Efface la clé enregistrée. */
export async function effacerCleApi(): Promise<void> {
  await SecureStore.deleteItemAsync(CLE_TROUSSEAU);
}

/**
 * Masque une clé pour l'affichage : on ne montre jamais le corps.
 * Exemple : « sk-ant-…a1b2 ».
 */
export function masquerCle(cle: string): string {
  const propre = cle.trim();
  if (propre.length <= 8) return '••••';
  return `${propre.slice(0, 7)}…${propre.slice(-4)}`;
}

/** Vérifie la forme attendue d'une clé Anthropic, sans appeler le réseau. */
export function cleParaitValide(cle: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(cle.trim());
}
