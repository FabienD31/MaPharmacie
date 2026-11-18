# Politique de confidentialité — Ma Pharmacie

*Dernière mise à jour : 18 novembre 2026*

Ma Pharmacie est une application d'inventaire des médicaments que l'on détient
chez soi. Ce document décrit précisément quelles données elle traite et ce qui
quitte, ou non, l'appareil.

## Aucun compte, aucun serveur

L'application ne demande ni inscription, ni compte, ni adresse e-mail. Aucune
donnée n'est hébergée sur un serveur appartenant à l'éditeur, qui n'en possède
d'ailleurs aucun.

## Données enregistrées sur l'appareil

Tout ce que vous saisissez reste dans le stockage privé de l'application, sur
votre téléphone ou votre tablette :

- nom, principe actif, dosage, forme et quantité des médicaments ;
- date de péremption et lieu de rangement ;
- notes libres et effets associés ;
- photos prises ou choisies pour illustrer une fiche ;
- réglages d'alerte.

Ces informations ne sont transmises à personne. Elles disparaissent avec
l'application si vous la désinstallez.

## Ce qui sort de l'appareil

Trois fonctionnalités, et trois seulement, communiquent avec l'extérieur. Elles
sont toutes déclenchées par une action explicite de votre part.

| Fonctionnalité | Donnée transmise | Destinataire |
| --- | --- | --- |
| Scan d'une boîte | le code produit lu sur l'emballage | une base publique des médicaments |
| Recherche web | le nom et le principe actif du médicament | le moteur de recherche DuckDuckGo |
| Suggestions par IA *(facultatif)* | le nom, le principe actif et le dosage | Anthropic |

Les suggestions par IA n'existent que si vous avez vous-même enregistré une clé
d'API personnelle dans les réglages. Sans cette clé, aucun appel n'est fait.

Dans aucun de ces cas ne sont transmis : votre inventaire, vos quantités, vos
notes, vos lieux de rangement, vos photos, ni un identifiant d'appareil.

## Notifications

Les alertes de péremption sont calculées et programmées sur l'appareil. Elles
n'utilisent pas de notifications distantes, et aucune information ne transite
par un service de notification.

## Mesure d'audience et publicité

L'application ne contient aucun outil de mesure d'audience, aucun traceur,
aucune publicité. Aucune bibliothèque de ce type n'est installée.

## Permissions demandées

- **Appareil photo** : lire le code-barres d'une boîte et photographier un
  médicament. Aucune image n'est envoyée.
- **Photothèque** : choisir une photo existante pour une fiche.
- **Notifications** : afficher les alertes de péremption.

Chacune est demandée au moment où la fonctionnalité correspondante est
utilisée, et refuser n'empêche pas le reste de fonctionner.

## Vos données vous appartiennent

Il n'y a rien à supprimer chez l'éditeur, puisque rien n'y est stocké.
Désinstaller l'application efface l'intégralité des données, base et photos
comprises.

## Code source

L'application est publiée en source ouverte. Chacune des affirmations
ci-dessus est vérifiable dans le code :
<https://github.com/FabienD31/MaPharmacie>

## Avertissement

Cette application informe, elle ne conseille pas. Elle ne remplace ni la notice
d'un médicament, ni l'avis d'un médecin ou d'un pharmacien.
