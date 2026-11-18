/**
 * Générateur d'icônes pour Ma Pharmacie.
 *
 * Écrit des PNG sans aucune dépendance : les chunks du format sont assemblés
 * à la main et compressés avec le zlib de Node. Cela évite d'ajouter un outil
 * d'image au projet pour quelques fichiers générés une fois.
 *
 * Motif : une croix formée de deux capsules aux extrémités arrondies.
 * Lisible à 48 pixels, et moins banale qu'une croix à angles droits.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Bleu primaire de l'application.
const FOND = [27, 107, 154];
const BLANC = [255, 255, 255];

// ---------------------------------------------------------------- PNG

const TABLE_CRC = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = TABLE_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(data.length, 0);
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps), 0);
  return Buffer.concat([longueur, corps, crc]);
}

/** Encode un buffer RGBA (taille × taille × 4) en PNG. */
function encoderPng(rgba, taille) {
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(taille, 0);
  entete.writeUInt32BE(taille, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 6; // RGBA
  entete[10] = 0; // deflate
  entete[11] = 0; // filtre adaptatif
  entete[12] = 0; // pas d'entrelacement

  // Chaque ligne est préfixée par son type de filtre, ici 0 (aucun).
  const brut = Buffer.alloc(taille * (taille * 4 + 1));
  for (let y = 0; y < taille; y += 1) {
    brut[y * (taille * 4 + 1)] = 0;
    rgba.copy(brut, y * (taille * 4 + 1) + 1, y * taille * 4, (y + 1) * taille * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', entete),
    chunk('IDAT', zlib.deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- dessin

/** Distance signée d'un point à un segment épaissi (capsule). */
function distanceCapsule(px, py, ax, ay, bx, by, rayon) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const longueur2 = abx * abx + aby * aby;
  let t = longueur2 === 0 ? 0 : (apx * abx + apy * aby) / longueur2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return Math.sqrt(dx * dx + dy * dy) - rayon;
}

/**
 * Dessine la croix.
 *
 * `avecFond` remplit le carré en bleu ; sinon le fond reste transparent,
 * ce qu'attend la couche avant d'une icône adaptative Android.
 * `proportion` règle la taille de la croix par rapport au côté.
 */
function dessiner(taille, { avecFond, proportion, couleurCroix }) {
  const rgba = Buffer.alloc(taille * taille * 4);
  const centre = taille / 2;
  const demiLongueur = (taille * proportion) / 2;
  const rayon = taille * proportion * 0.18;

  // Trois sous-échantillons par axe : assez pour des bords nets sans crénelage.
  const SOUS = 3;

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      let couverture = 0;

      for (let sy = 0; sy < SOUS; sy += 1) {
        for (let sx = 0; sx < SOUS; sx += 1) {
          const px = x + (sx + 0.5) / SOUS;
          const py = y + (sy + 0.5) / SOUS;

          const verticale = distanceCapsule(
            px, py,
            centre, centre - demiLongueur,
            centre, centre + demiLongueur,
            rayon
          );
          const horizontale = distanceCapsule(
            px, py,
            centre - demiLongueur, centre,
            centre + demiLongueur, centre,
            rayon
          );

          if (Math.min(verticale, horizontale) <= 0) couverture += 1;
        }
      }

      couverture /= SOUS * SOUS;

      const i = (y * taille + x) * 4;
      if (avecFond) {
        rgba[i] = Math.round(FOND[0] + (couleurCroix[0] - FOND[0]) * couverture);
        rgba[i + 1] = Math.round(FOND[1] + (couleurCroix[1] - FOND[1]) * couverture);
        rgba[i + 2] = Math.round(FOND[2] + (couleurCroix[2] - FOND[2]) * couverture);
        rgba[i + 3] = 255;
      } else {
        rgba[i] = couleurCroix[0];
        rgba[i + 1] = couleurCroix[1];
        rgba[i + 2] = couleurCroix[2];
        rgba[i + 3] = Math.round(255 * couverture);
      }
    }
  }

  return encoderPng(rgba, taille);
}

// ---------------------------------------------------------------- sortie

const dossier = process.argv[2];
if (!dossier) {
  console.error('Usage : node gen-icone.js <dossier assets>');
  process.exit(1);
}

const fichiers = [
  // Icône principale : carré plein, le système applique son propre masque.
  ['icon.png', dessiner(1024, { avecFond: true, proportion: 0.62, couleurCroix: BLANC })],
  // Couche avant adaptative : plus petite, pour tenir dans la zone sûre.
  ['android-icon-foreground.png', dessiner(1024, { avecFond: false, proportion: 0.46, couleurCroix: BLANC })],
  // Version monochrome, utilisée par les thèmes d'Android.
  ['android-icon-monochrome.png', dessiner(1024, { avecFond: false, proportion: 0.46, couleurCroix: BLANC })],
  // Visuel de l'écran de démarrage, sur fond transparent.
  ['splash-icon.png', dessiner(512, { avecFond: false, proportion: 0.5, couleurCroix: FOND })],
  ['favicon.png', dessiner(64, { avecFond: true, proportion: 0.62, couleurCroix: BLANC })],
];

for (const [nom, donnees] of fichiers) {
  const cible = path.join(dossier, nom);
  fs.writeFileSync(cible, donnees);
  console.log(nom.padEnd(32), (donnees.length / 1024).toFixed(1) + ' Ko');
}
