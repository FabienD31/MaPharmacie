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
- Associer une photo au médicament, prise sur le moment ou choisie dans la
  photothèque : vignette dans la liste, image entière sur la fiche

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

### Réglages

- Connaître la provenance du code exécuté : version publiée ou serveur de
  développement, avec le canal et l'identifiant de version
- Les deux sont indiscernables à l'écran sans cette indication

### Suggestions par IA (optionnel)

- Proposer automatiquement, après un scan, sur quoi agit le médicament
- Demander la même proposition à la main depuis le formulaire
- Les symptômes proposés arrivent en puces d'effets, donc exploitables par la
  recherche par symptôme
- Un résumé en une phrase est ajouté aux notes, marqué comme suggestion
- Rien n'est enregistré sans validation : tout reste modifiable
- Nécessite une clé d'API Anthropic personnelle, saisie dans les réglages et
  rangée dans le trousseau du téléphone
- L'application fonctionne entièrement sans cette clé, cette section en moins

---

## Ce qui sort du téléphone

La base de données vit dans le stockage privé de l'application. Elle n'est
jamais envoyée nulle part, et le dépôt ne contient aucune donnée personnelle.

Trois fonctionnalités, et trois seulement, communiquent avec l'extérieur. Les
deux dernières sont déclenchées par une action explicite, la troisième n'existe
que si une clé d'API a été saisie :

| Fonctionnalité | Ce qui sort | Où |
| --- | --- | --- |
| Scan d'une boîte | le code CIP13 lu sur l'emballage | [`src/lib/apiMedicaments.ts`](src/lib/apiMedicaments.ts) |
| Recherche web | le nom et le principe actif du médicament | [`src/lib/rechercheWeb.ts`](src/lib/rechercheWeb.ts) |
| Suggestions par IA | le nom, le principe actif et le dosage | [`src/lib/suggestionsIA.ts`](src/lib/suggestionsIA.ts) |

Rien d'autre ne circule : ni l'inventaire, ni les quantités, ni les notes, ni
les lieux de rangement, ni les effets, ni aucun identifiant d'appareil. Les
trois chemins sont isolés dans un fichier chacun pour rester vérifiables d'un
coup d'œil.

La clé d'API est rangée dans le trousseau du système
([`src/lib/cleApi.ts`](src/lib/cleApi.ts)), jamais dans la base ni dans le
dépôt. Elle est portée par le téléphone et l'application appelle Anthropic
directement : acceptable pour un usage personnel avec sa propre clé, mais ce
schéma demanderait un serveur intermédiaire dans une application distribuée.

Aucune dépendance de suivi ou d'analytics n'est installée.

---

## Compatibilité

| | Minimum requis |
| --- | --- |
| **Android** | 7.0 Nougat (API 24), processeur **64 bits** (`arm64-v8a`) |
| **iOS** | 16.4 |

L'APK ne contient que l'architecture 64 bits. Tous les appareils Android sortis
depuis 2017 environ en sont équipés ; un appareil 32 bits plus ancien ne
pourra pas l'installer. Ce choix divise le poids du fichier par deux, chaque
bibliothèque native étant sinon embarquée en double.

Cette restriction ne concerne que l'APK autonome : une distribution par le
Play Store se fait au format AAB, et Google y fabrique un paquet adapté à
chaque appareil.

## Prérequis

- [Node.js](https://nodejs.org/) 22 ou plus récent
- [Expo Go](https://expo.dev/go) sur le téléphone, dans la version correspondant
  au SDK 58
- Un compte Expo — depuis Expo Go 57, iOS exige d'être connecté au **même
  compte** côté application et côté terminal
- Facultatif, pour les suggestions par IA : une clé d'API créée sur
  [console.anthropic.com](https://console.anthropic.com/settings/keys), sur un
  compte crédité. La clé se saisit dans l'application, jamais dans le code.

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

## Utiliser l'app sans serveur de développement

Par défaut, Expo Go charge le code depuis le serveur Metro : il faut donc
l'ordinateur allumé, `npx expo start` en cours, et le téléphone sur le même
réseau. Peu pratique pour une app qu'on consulte au quotidien.

La publication EAS Update lève cette contrainte sans aucun build natif :

```bash
npx eas-cli update --branch preview --message "..." --environment preview
```

Expo Go ouvre ensuite la version publiée depuis les serveurs d'Expo, sans
serveur local. Deux liens équivalents, à saisir dans `Enter URL manually` :

```
# Dernière version publiée sur le canal
exp://u.expo.dev/da64de9c-b864-49c8-a27d-fe8d75f52da4?runtime-version=exposdk%3A58.0.0&channel-name=preview

# Une publication précise, plus court et sans paramètres
exp://u.expo.dev/da64de9c-b864-49c8-a27d-fe8d75f52da4/group/<id-du-groupe>
```

Les deux-points de la version de runtime doivent être encodés en `%3A` :
non encodés, Expo Go n'ouvre rien. Le service officiel
[qr.expo.dev](https://docs.expo.dev/more/qr-codes/) génère le lien et son QR
code sans risque d'erreur :

```bash
curl "https://qr.expo.dev/eas-update?projectId=<id>&runtimeVersion=exposdk%3A58.0.0&channel=preview&format=url"
```

En retirant `&format=url`, la même adresse renvoie directement le QR code.

La version de runtime est fixée à `exposdk:58.0.0` dans `app.json` : Expo Go
n'accepte une mise à jour que si elle correspond exactement à la version du SDK
qu'il embarque. Une `policy` calculée ne conviendrait pas ici.

Le code publié est figé : toute modification demande une nouvelle publication.
Les réserves sur les notifications dans Expo Go restent valables.

L'écran de réglages indique laquelle des deux provenances est en cours
d'exécution, ce qui évite de se demander si une modification a bien été prise
en compte.

### Ce dont l'application a besoin au lancement

Une fois publiée, l'application ne dépend plus d'aucun ordinateur, ni d'un
réseau particulier. Expo Go télécharge le code depuis les serveurs d'Expo : il
faut donc une connexion, mais n'importe laquelle. Le code est ensuite mis en
cache.

Une fois l'application ouverte, la quasi-totalité fonctionne hors ligne :

| Hors ligne | Connexion requise |
| --- | --- |
| Inventaire, tri, filtres, recherche | Nom du médicament après un scan |
| Recherche par symptôme | Suggestions par IA |
| Photos, notes, effets | Ouverture d'une recherche web |
| Alertes de péremption | |
| Date de péremption lue dans le code-barres | |

Scanner reste donc utile sans réseau : la date de péremption est dans le
code-barres, seul le nom demande un appel distant.

### Deux conditions à garder en tête

- **Rester connecté au compte Expo propriétaire du projet.** Depuis 2026, Expo
  Go n'ouvre une version publiée que pour ce compte.
- **La version de runtime suit le SDK.** La publication cible
  `exposdk:58.0.0` ; le jour où Expo Go passera au SDK suivant, il faudra
  republier avec la nouvelle valeur.

Un build natif ne dépend d'aucune de ces deux conditions.

## Build natif (EAS)

Le projet est configuré pour EAS Build ([`eas.json`](eas.json)), ce qui permet
de construire dans le cloud, sans Mac.

### Android — gratuit

```bash
npx eas-cli build --platform android --profile apk
```

Produit un APK installable directement. **Aucun compte payant n'est
nécessaire** : la clé de signature est générée et conservée par EAS à la
première construction.

L'APK ne vise que les appareils 64 bits (voir [Compatibilité](#compatibilité)).

### iOS — compte Apple requis

| Profil | Installable sur | Compte Apple |
| --- | --- | --- |
| `simulateur` | simulateur iOS uniquement | non |
| `appareil` | iPhone, distribution interne | **oui, 99 $/an** |
| `production` | App Store | **oui, 99 $/an** |

Apple impose la signature pour toute application installée sur un appareil
physique, et EAS n'y change rien. Chaque iPhone doit être enregistré
(`eas device:create`), 100 au maximum par an.

Le profil `simulateur` est la seule voie gratuite, mais un simulateur ne teste
ni la caméra ni les notifications — c'est-à-dire ni le scan ni les alertes de
péremption.

Tant qu'aucun build natif n'est fait, l'application s'utilise via Expo Go, avec
la réserve sur les notifications mentionnée plus bas.

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
  parametres.tsx         Réglages des alertes et clé d'API

src/
  db/                    Accès aux données, aucun rendu
    database.ts          Ouverture et migrations
    schema.ts            Modèle et listes de référence
    medicaments.ts       Lecture, écriture, recherche
    parametres.ts        Réglages persistés
  components/            Composants réutilisables, aucun SQL
  lib/                   Dates, thème, mise en page, notifications,
                         code-barres, réseau, IA, photos
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

**Poids de l'APK : une seule architecture.** Mesuré sur un APK universel de
51,4 Mo, le poids se répartissait en 79 % de bibliothèques natives — dont la
moitié n'était que la copie 32 bits des mêmes fichiers — contre 7 % pour le
code de l'application. Les plus gros postes sont le moteur React Native
(11,5 Mo), la bibliothèque de lecture de codes-barres de Google (7,8 Mo) et le
moteur JavaScript (4,4 Mo) : aucun n'est réductible sans renoncer à une
fonctionnalité. Ne conserver que `arm64-v8a`, avec la minification R8 et la
suppression des ressources inutilisées, est donc le seul levier qui agisse
vraiment.

**Résolution CommonJS imposée à Metro.** Le SDK Anthropic contient un cycle
d'imports ESM que Metro n'évalue pas correctement : `BetaToolRunner` arrive à
`undefined` et l'application plante dès l'import. La configuration du bundler
([`metro.config.js`](metro.config.js)) demande la condition `require`, donc les
fichiers CommonJS, dont les exports tolèrent le cycle. À retenir si une
dépendance se met à échouer au chargement sans erreur de compilation.

**Mise en page adaptative à partir de 600 points.** Le seuil est exprimé en
points indépendants de la densité, pas en pouces : c'est ce que mesure React
Native. 600 points correspond à une tablette 7 pouces en portrait, et c'est le
seuil retenu par Android pour distinguer une tablette d'un téléphone. Au-delà,
la liste passe en deux colonnes (trois à partir de 1000 points) et le contenu
des autres écrans est centré et borné à 760 points, une ligne de texte étirée
sur dix pouces étant illisible.

**Photos stockées hors base.** Seul le chemin du fichier est en base. Le
sélecteur renvoie un fichier temporaire que le système peut effacer : la photo
est donc recopiée dans le stockage privé de l'application avant d'être
référencée. Elle est effacée avec la fiche, et une photo remplacée ne disparaît
qu'à la validation du formulaire — annuler ne détruit rien.

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
- La recherche par symptôme ne parcourt que les effets saisis manuellement ou
  acceptés depuis une suggestion.
- Passer un jour à un build natif signifie repartir d'une base vide : chaque
  installation a son propre stockage, l'inventaire ne suit pas tout seul.
- Le lien d'ouverture dans Expo Go doit encoder les deux-points de la version
  de runtime en `%3A`. Non encodé, rien ne se charge et aucune erreur
  explicite ne le signale.
- Les suggestions par IA sont des propositions à vérifier, pas une source
  faisant autorité. Chaque suggestion est une requête facturée sur le compte
  Anthropic de l'utilisateur, et le scan en déclenche une par boîte.

## Hors périmètre

Récupération automatique de la notice, synchronisation cloud et comptes
utilisateurs ne sont pas implémentés.

---

## Licence

Voir [LICENSE](LICENSE).
