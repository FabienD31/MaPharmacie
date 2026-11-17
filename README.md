# Ma Pharmacie

Application mobile pour inventorier les médicaments qu'on a chez soi : savoir ce
qu'on possède, ce qui périme bientôt, où c'est rangé et sur quoi ça agit.

Tout reste sur le téléphone. Pas de compte, pas de cloud, pas de mesure
d'audience.

> **Cette app ne remplace pas la notice ni l'avis d'un médecin ou d'un
> pharmacien.** Elle informe, elle ne conseille pas : aucun calcul de posologie,
> aucune recommandation de prise.

---

## Fonctionnalités

- **Inventaire** — nom, principe actif, dosage, forme, quantité restante, date
  de péremption, lieu de rangement, notes libres.
- **Tri par péremption** — les échéances les plus proches en premier. Les
  médicaments périmés restent visibles et sont signalés.
- **Filtres et recherche** — par lieu de rangement, par forme, et recherche
  texte sur le nom et le principe actif.
- **Effets** — ce sur quoi agit chaque médicament, noté librement
  (« mal de tête », « fièvre »…), avec suggestions à partir de ce qui existe déjà.
- **Recherche par symptôme** — retrouver, parmi ses propres médicaments, ceux
  auxquels on a associé un effet donné.
- **Alertes de péremption** — notification locale avant l'échéance, délai et
  heure configurables.
- **Recherche web** — un appui sur le nom d'un médicament ouvre une recherche
  dans le navigateur.

---

## Confidentialité

La base de données vit dans le stockage privé de l'application, sur le
téléphone. Elle n'est jamais envoyée nulle part, et le dépôt ne contient aucune
donnée de santé.

Une seule fonctionnalité fait sortir une information du téléphone : la
**recherche web**, qui transmet le nom du médicament à DuckDuckGo. Elle est
toujours déclenchée par un appui volontaire, et un avertissement l'explique la
première fois. Tout est regroupé dans [`src/lib/rechercheWeb.ts`](src/lib/rechercheWeb.ts)
pour rester vérifiable d'un coup d'œil.

Aucune dépendance de suivi ou d'analytics n'est installée.

---

## Prérequis

- [Node.js](https://nodejs.org/) 22 ou plus récent
- [Expo Go](https://expo.dev/go) sur le téléphone, dans la version correspondant
  au SDK 58
- Un compte Expo — depuis Expo Go 57, iOS exige d'être connecté au **même
  compte** côté application et côté terminal

## Installation

```bash
npm install --legacy-peer-deps
```

L'option est nécessaire : certaines dépendances du SDK Expo déclarent des pairs
incompatibles entre elles, et c'est le contournement qu'utilise `expo install`
lui-même.

## Lancer en développement

```bash
npx expo start
```

Puis scanner le QR code avec Expo Go, le téléphone et l'ordinateur étant sur le
même réseau. L'adresse peut aussi être saisie à la main dans Expo Go
(`Enter URL manually`).

### Sous Windows

Si PowerShell refuse d'exécuter `npx.ps1` (`l'exécution de scripts est
désactivée sur ce système`), utiliser la variante `.cmd`, qui contourne
l'enveloppe PowerShell :

```bash
npx.cmd expo start
```

### Connexion à Expo

```bash
npx.cmd expo login --no-browser
```

La connexion par navigateur peut ne jamais rendre la main si la redirection
locale n'aboutit pas ; `--no-browser` demande directement les identifiants dans
le terminal.

## Vérifier les types

```bash
npx tsc --noEmit
```

---

## Structure

```
app/                     Écrans (routage par fichiers, expo-router)
  _layout.tsx            Layout racine : base de données, préférences, navigation
  index.tsx              Liste triée, filtres et recherche
  formulaire.tsx         Ajout et modification
  medicament/[id].tsx    Fiche détaillée
  symptomes.tsx          Recherche par symptôme
  parametres.tsx         Réglages des alertes

src/
  db/                    Accès aux données, aucun rendu
    database.ts          Ouverture et migrations
    schema.ts            Modèle et listes de référence
    medicaments.ts       Lecture, écriture, recherche
    parametres.ts        Réglages persistés
  components/            Composants réutilisables, aucun SQL
  lib/                   Dates, thème, notifications, recherche web
```

La séparation est stricte : aucun écran ne contient de SQL, aucun module de
données ne contient de rendu.

---

## Choix techniques

**Dates de péremption stockées en `AAAA-MM`.** Les boîtes n'impriment qu'un mois
et une année. Ce format se trie correctement en SQL par simple ordre
alphabétique, donc le tri par péremption est fait par SQLite et non en
JavaScript. Un médicament est considéré valable jusqu'au **dernier jour du mois
imprimé** — la lecture habituelle, et la plus prudente.

**Migrations versionnées.** Le schéma évolue via `PRAGMA user_version`, un entier
stocké dans le fichier SQLite lui-même. Chaque migration s'applique une fois par
appareil, et le schéma peut évoluer sans perdre les données existantes.

**Effets dans une table séparée.** Un médicament a plusieurs effets, et la
recherche par symptôme interroge directement cette table plutôt que de découper
une colonne texte.

**Notifications reprogrammées intégralement.** Plutôt que suivre chaque
notification, tout est annulé puis reprogrammé depuis la base au lancement et à
chaque retour sur la liste. C'est ce qui garantit qu'un médicament supprimé ne
notifie plus et qu'un changement de délai recalcule toutes les échéances. iOS
limitant à 64 les notifications locales en attente, seules les 64 échéances les
plus proches sont programmées.

**Le délai d'alerte pilote aussi l'affichage.** Une seule notion de « bientôt
périmé » : changer le délai change les notifications *et* la couleur des badges.

---

## Limites connues

- Les notifications locales fonctionnent dans Expo Go sur iOS, mais Expo
  considère ce support comme limité et recommande un build natif pour un usage
  durable.
- Un médicament déjà dans la fenêtre d'alerte ne déclenche pas de notification :
  sa date de déclenchement est passée. Il reste signalé dans la liste.
- La recherche texte ne neutralise pas les caractères `%` et `_`, interprétés
  par l'opérateur SQL `LIKE`.
- La recherche par symptôme ne parcourt que les effets saisis manuellement.
  Aucun résultat ne signifie « rien de noté », pas « rien dans l'armoire ».

## Hors périmètre

Scan de code-barres, récupération automatique de la notice, synchronisation
cloud et comptes utilisateurs ne sont pas implémentés.

---

## Licence

Voir [LICENSE](LICENSE).
