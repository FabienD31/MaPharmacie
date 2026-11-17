# Ma Pharmacie

Application mobile pour inventorier les médicaments qu'on a chez soi : savoir ce
qu'on possède, ce qui périme bientôt, où c'est rangé et sur quoi ça agit.

Tout reste sur le téléphone. Pas de compte, pas de cloud, pas de mesure
d'audience.

---

## Ce que fait l'application

### Inventaire

- Enregistrer un médicament avec son nom, son principe actif, son dosage, sa
  forme, la quantité restante, la date de péremption, le lieu de rangement et
  des notes libres
- Modifier une fiche existante
- Supprimer un médicament, avec confirmation
- Consulter la fiche détaillée de chaque médicament

### Scan d'une boîte

- Lire le Datamatrix des boîtes récentes ou le code-barres EAN-13 des plus
  anciennes
- Récupérer automatiquement le nom, le principe actif, le dosage, la forme et
  le nombre d'unités depuis la base publique des médicaments
- Lire la date de péremption directement dans le code-barres, sans réseau
- Basculer en saisie manuelle à tout moment si la boîte n'est pas reconnue
- Tous les champs préremplis restent modifiables avant l'enregistrement

### Péremption

- Trier la liste par date de péremption, les échéances les plus proches en tête
- Placer les médicaments sans date connue en fin de liste
- Afficher sur chaque médicament le temps restant ou le temps écoulé depuis la
  péremption
- Distinguer visuellement les médicaments périmés, ceux qui approchent de
  l'échéance et les autres
- Saisir la date au format MM/AA, comme imprimé sur la boîte

### Recherche et filtres

- Rechercher sur le nom et sur le principe actif
- Filtrer par lieu de rangement
- Filtrer par forme
- Combiner plusieurs critères, avec un compteur de résultats et une remise à
  zéro en un geste
- Ne proposer comme filtres que des valeurs réellement présentes dans
  l'inventaire

### Effets et symptômes

- Associer à chaque médicament ce sur quoi il agit, en texte libre
  (« mal de tête », « fièvre », « courbature »…)
- Se voir proposer les effets déjà utilisés ailleurs, pour garder un
  vocabulaire cohérent
- Rechercher dans l'inventaire à partir d'un symptôme, pour retrouver les
  médicaments auxquels cet effet a été associé
- Lancer une recherche en touchant directement un effet déjà enregistré

### Alertes

- Recevoir une notification locale à l'approche de la péremption d'un
  médicament
- Choisir le délai d'alerte : 7, 15, 30, 60 ou 90 jours
- Choisir l'heure du rappel
- Activer ou désactiver les alertes
- Le délai choisi pilote aussi le code couleur de la liste

### Recherche web

- Ouvrir une recherche sur le médicament dans le navigateur, en touchant son
  nom depuis sa fiche
- La recherche inclut le principe actif pour affiner les résultats

---

## Ce qui sort du téléphone

La base de données vit dans le stockage privé de l'application. Elle n'est
jamais envoyée nulle part, et le dépôt ne contient aucune donnée personnelle.

Deux fonctionnalités, et deux seulement, communiquent avec l'extérieur :

| Fonctionnalité | Ce qui sort | Où |
| --- | --- | --- |
| Scan d'une boîte | le code CIP13 lu sur l'emballage | [`src/lib/apiMedicaments.ts`](src/lib/apiMedicaments.ts) |
| Recherche web | le nom et le principe actif du médicament | [`src/lib/rechercheWeb.ts`](src/lib/rechercheWeb.ts) |

Rien d'autre ne circule : ni l'inventaire, ni les quantités, ni les notes, ni
les effets, ni aucun identifiant d'appareil. Les deux chemins sont isolés dans
un fichier chacun pour rester vérifiables d'un coup d'œil.

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
  scan.tsx               Lecture du code-barres d'une boîte
  symptomes.tsx          Recherche par symptôme
  parametres.tsx         Réglages des alertes

src/
  db/                    Accès aux données, aucun rendu
    database.ts          Ouverture et migrations
    schema.ts            Modèle et listes de référence
    medicaments.ts       Lecture, écriture, recherche
    parametres.ts        Réglages persistés
  components/            Composants réutilisables, aucun SQL
  lib/                   Dates, thème, notifications, code-barres, réseau
```

La séparation est stricte : aucun écran ne contient de SQL, aucun module de
données ne contient de rendu.

---

## Choix techniques

**Dates de péremption stockées en `AAAA-MM`.** Les boîtes n'impriment qu'un mois
et une année. Ce format se trie correctement en SQL par simple ordre
alphabétique, donc le tri par péremption est fait par SQLite et non en
JavaScript. Un médicament est considéré valable jusqu'au dernier jour du mois
imprimé.

**Décodage GS1 sur l'appareil.** Le Datamatrix d'une boîte encode le code
produit, la date de péremption et le numéro de lot. Le décodage est fait
localement, donc la date de péremption est récupérée même sans connexion : seul
le nom du médicament demande un appel réseau.

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

---

## Limites connues

- Les notifications locales fonctionnent dans Expo Go sur iOS, mais Expo
  considère ce support comme limité et recommande un build natif pour un usage
  durable.
- Un médicament déjà dans la fenêtre d'alerte ne déclenche pas de notification :
  sa date de déclenchement est passée. Il reste signalé dans la liste.
- L'API de médicaments interrogée après un scan est un service tiers qui
  republie les données publiques, pas un service officiel. Elle peut changer ou
  disparaître ; l'application reste utilisable en saisie manuelle.
- La base publique ne recense que les présentations commercialisées ces
  dernières années : une boîte ancienne peut ne pas être reconnue.
- La recherche texte ne neutralise pas les caractères `%` et `_`, interprétés
  par l'opérateur SQL `LIKE`.
- La recherche par symptôme ne parcourt que les effets saisis manuellement.

## Hors périmètre

Récupération automatique de la notice, synchronisation cloud et comptes
utilisateurs ne sont pas implémentés.

---

## Licence

Voir [LICENSE](LICENSE).
