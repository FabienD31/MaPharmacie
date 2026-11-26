# Fiche Google Play — Ma Pharmacie

Tout ce qu'il faut recopier dans la Play Console, pour la piste de **test
interne**. Les textes sont prêts à coller tels quels.

---

## 1. Création de l'application

Play Console → **Créer une application**.

| Champ | Valeur |
|---|---|
| Nom de l'application | `Ma Pharmacie` |
| Langue par défaut | Français (France) |
| Type | Application |
| Gratuite ou payante | Gratuite |

Le nom de package `com.fabien.mapharmacie` n'est pas demandé ici : il arrive
avec le premier fichier déposé.

---

## 2. Fiche du magasin

**Description courte** (80 caractères maximum)

```
Inventaire des médicaments de la maison, avec alerte avant péremption.
```

**Description complète**

```
Ma Pharmacie recense les médicaments que vous avez chez vous et vous prévient avant qu'ils ne périment.

Ce que l'application fait

• Enregistrer un médicament : nom, principe actif, dosage, forme, quantité restante, date de péremption, lieu de rangement et notes libres.
• Remplir une fiche automatiquement en scannant le code-barres de la boîte.
• Associer une photo à chaque médicament.
• Trier la liste par date de péremption, du plus urgent au plus lointain, en signalant ce qui est déjà périmé.
• Filtrer par lieu de rangement et par forme, et chercher par nom ou par principe actif.
• Retirer une unité d'un simple geste, et proposer la suppression quand la boîte est vide.
• Recevoir une notification lorsqu'un médicament approche de sa date de péremption, avec un délai d'alerte réglable.
• Chercher dans votre propre inventaire à partir d'un symptôme, pour voir ce que vous avez déjà.
• Ouvrir une recherche web sur le nom d'un médicament pour consulter sa notice.

Ce que l'application ne fait pas

• Aucun compte, aucune inscription, aucune publicité.
• Aucun outil de mesure d'audience ni de suivi.
• Vos données restent sur votre appareil et disparaissent avec l'application.

Cette application ne remplace pas la notice ni l'avis d'un médecin ou d'un pharmacien. Elle informe, elle ne conseille pas : elle ne calcule aucune posologie et ne recommande aucune prise.
```

**Catégorie** : Médical
**Tags** : santé, médicaments, inventaire

**Coordonnées** — l'adresse e-mail est publiée sur la fiche. Utilisez-en une
que vous acceptez de rendre publique.

**URL de la politique de confidentialité**

```
https://github.com/FabienD31/MaPharmacie/blob/main/docs/confidentialite.md
```

---

## 3. Visuels

| Fichier | Dimensions | Où |
|---|---|---|
| `icone-512.png` | 512 × 512 | Icône de l'application |
| `bandeau-1024x500.png` | 1024 × 500 | Visuel de présentation |

Les captures d'écran sont à prendre sur l'appareil : au moins deux en
téléphone, et deux en tablette 7 et 10 pouces si vous déclarez la
compatibilité tablette. Play les exige pour la fiche publique, pas pour un
test interne.

---

## 4. Sécurité des données

Cette déclaration vous engage : les réponses ci-dessous décrivent ce que fait
le code aujourd'hui, à vous de les valider.

**Trois sorties réseau existent, et trois seulement.**

| Déclencheur | Destinataire | Ce qui part |
|---|---|---|
| Scan d'un code-barres | `medicaments-api.giygas.dev` | Le code CIP13 imprimé sur la boîte |
| Bouton « Suggérer les effets » | API d'Anthropic | Nom, principe actif et dosage du médicament |
| Clic sur le nom d'un médicament | Moteur de recherche | Le nom, dans l'URL de recherche |

Rien d'autre ne sort : ni l'inventaire, ni les quantités, ni les notes, ni les
lieux de rangement, ni les photos, ni d'identifiant d'appareil. Les deux
premières fonctions sont optionnelles, et la suggestion par IA ne fonctionne
que si l'utilisateur a saisi sa propre clé d'API.

**Réponses au questionnaire**

| Question | Réponse |
|---|---|
| Collectez-vous ou partagez-vous des données utilisateur ? | Oui |
| Type de données | Informations médicales |
| Collectées ou partagées ? | Partagées — transmises à un service tiers, jamais à un serveur de l'éditeur |
| Obligatoire ou optionnel ? | Optionnel — l'utilisateur déclenche chaque envoi |
| Finalité | Fonctionnalité de l'application |
| Les données sont-elles chiffrées en transit ? | Oui, HTTPS |
| L'utilisateur peut-il demander la suppression ? | Sans objet : aucun compte, aucune donnée conservée par l'éditeur |

Le nom d'un médicament que l'on possède est une information de santé : c'est
pourquoi la case « Informations médicales » est cochée, même si rien n'est
rattaché à une identité. Déclarer plus que le strict nécessaire ne coûte rien ;
l'inverse se paie d'un rejet.

---

## 5. Contenu de l'application

| Section | Réponse |
|---|---|
| Publicités | L'application ne contient pas de publicité |
| Accès à l'application | Toutes les fonctions sont accessibles sans identifiants |
| Classification du contenu | Questionnaire « Utilitaire » — aucune réponse positive |
| Public cible | Adultes, 18 ans et plus |
| Application santé | Oui — inventaire personnel, sans diagnostic ni posologie |
| Données sensibles | Appareil photo : lecture du code-barres et photo d'une boîte |

---

## 6. Permissions déclarées

Une seule : `android.permission.CAMERA`, pour le scan et la photo. Le texte
affiché à l'utilisateur au moment de la demande est déjà dans `app.json`.

---

## 7. Compatibilité

- Android 7.0 (API 24) minimum
- Processeurs 64 bits uniquement (`arm64-v8a`)
- Téléphones et tablettes, toutes orientations

Le choix du 64 bits seul divise le poids de l'application par trois. Il écarte
les appareils 32 bits, globalement ceux d'avant 2017.
