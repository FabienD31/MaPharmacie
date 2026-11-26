/**
 * Génère les visuels demandés par la fiche Google Play.
 *
 * Deux fichiers, aux dimensions imposées par la console :
 *   - icone-512.png     : l'icône de la fiche, 512 × 512
 *   - bandeau-1024x500  : le « visuel de présentation », 1024 × 500
 *
 * Même approche que outils/generer-icones.js : les PNG sont assemblés à la
 * main, sans dépendance d'image. Le bandeau est entièrement opaque, car Play
 * refuse la transparence sur ce visuel.
 *
 * Aucun texte n'y est dessiné, volontairement : Google superpose le nom de
 * l'application par-dessus le bandeau, et un titre gravé dans l'image
 * entrerait en collision avec lui.
 *
 * Usage : node outils/generer-visuels-play.js visuels-play
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FOND = [27, 107, 154];
const FOND_CLAIR = [41, 134, 186];
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
  const somme = Buffer.alloc(4);
  somme.writeUInt32BE(crc32(corps), 0);
  return Buffer.concat([longueur, corps, somme]);
}

/**
 * Encode une image à partir d'un tampon RGBA.
 *
 * `opaque` écrit un PNG 24 bits sans canal alpha, ce que Play exige pour
 * certains visuels. Le canal alpha du tampon est alors simplement écarté.
 *
 * Les lignes sont filtrées en « Up », c'est-à-dire écrites comme leur
 * différence avec la ligne précédente. Sur un dégradé, ces différences sont
 * presque constantes, et l'image compresse dix fois mieux qu'avec des lignes
 * brutes — la limite du mégaoctet en dépend.
 */
function encoderPng(rgba, largeur, hauteur, { opaque = false } = {}) {
  const canaux = opaque ? 3 : 4;

  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = opaque ? 2 : 6; // RVB, ou RVBA

  const pasLigne = largeur * canaux;
  const ligne = Buffer.alloc(pasLigne);
  const precedente = Buffer.alloc(pasLigne);
  const brut = Buffer.alloc(hauteur * (pasLigne + 1));

  for (let y = 0; y < hauteur; y += 1) {
    // Extraction de la ligne, alpha écarté si l'image est opaque.
    for (let x = 0; x < largeur; x += 1) {
      const src = (y * largeur + x) * 4;
      const dst = x * canaux;
      ligne[dst] = rgba[src];
      ligne[dst + 1] = rgba[src + 1];
      ligne[dst + 2] = rgba[src + 2];
      if (!opaque) ligne[dst + 3] = rgba[src + 3];
    }

    const base = y * (pasLigne + 1);
    brut[base] = y === 0 ? 0 : 2; // « aucun » pour la première ligne, « Up » ensuite
    for (let i = 0; i < pasLigne; i += 1) {
      brut[base + 1 + i] = y === 0 ? ligne[i] : (ligne[i] - precedente[i]) & 0xff;
    }

    ligne.copy(precedente);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', entete),
    chunk('IDAT', zlib.deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- formes

/** Distance signée d'un point à un segment épaissi (capsule). */
function distanceCapsule(px, py, ax, ay, bx, by, rayon) {
  const abx = bx - ax;
  const aby = by - ay;
  const longueur2 = abx * abx + aby * aby;
  let t = longueur2 === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / longueur2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return Math.sqrt(dx * dx + dy * dy) - rayon;
}

/** Distance signée à la croix centrée en (cx, cy). */
function distanceCroix(px, py, cx, cy, demiLongueur, rayon) {
  return Math.min(
    distanceCapsule(px, py, cx, cy - demiLongueur, cx, cy + demiLongueur, rayon),
    distanceCapsule(px, py, cx - demiLongueur, cy, cx + demiLongueur, cy, rayon)
  );
}

/**
 * Peint une image à partir d'une fonction qui renvoie une couleur par point.
 * Trois sous-échantillons par axe suffisent à lisser les bords.
 */
function rendre(largeur, hauteur, couleurEn, { sous = 3, opaque = false } = {}) {
  const rgba = Buffer.alloc(largeur * hauteur * 4);
  const SOUS = sous;

  for (let y = 0; y < hauteur; y += 1) {
    for (let x = 0; x < largeur; x += 1) {
      let r = 0;
      let v = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SOUS; sy += 1) {
        for (let sx = 0; sx < SOUS; sx += 1) {
          const c = couleurEn(x + (sx + 0.5) / SOUS, y + (sy + 0.5) / SOUS);
          r += c[0];
          v += c[1];
          b += c[2];
          a += c[3];
        }
      }

      const n = SOUS * SOUS;
      const i = (y * largeur + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(v / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = Math.round(a / n);
    }
  }

  return encoderPng(rgba, largeur, hauteur, { opaque });
}

function melanger(a, b, t) {
  const u = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];
}

// ---------------------------------------------------------------- visuels

/** L'icône de la fiche : la même croix que l'icône de l'application. */
function icone(cote) {
  const centre = cote / 2;
  const demiLongueur = (cote * 0.62) / 2;
  const rayon = cote * 0.62 * 0.18;

  return rendre(cote, cote, (px, py) => {
    const d = distanceCroix(px, py, centre, centre, demiLongueur, rayon);
    return d <= 0 ? [...BLANC, 255] : [...FOND, 255];
  });
}

/**
 * Le bandeau. Un dégradé diagonal, la croix posée à gauche là où Play
 * n'écrit rien, et deux croix fantômes à droite pour occuper le vide sans
 * attirer l'œil.
 */
function bandeau(largeur, hauteur, options = {}) {
  const cx = largeur * 0.26;
  const cy = hauteur / 2;
  const demiLongueur = hauteur * 0.29;
  const rayon = hauteur * 0.105;

  const fantomes = [
    { x: largeur * 0.68, y: hauteur * 0.26, echelle: 0.42 },
    { x: largeur * 0.86, y: hauteur * 0.72, echelle: 0.58 },
  ];

  return rendre(largeur, hauteur, (px, py) => {
    // Dégradé diagonal, plus clair en haut à gauche.
    const t = (px / largeur) * 0.6 + (py / hauteur) * 0.4;
    let couleur = melanger(FOND_CLAIR, FOND, t);

    // Les croix fantômes, à peine détachées du fond.
    for (const f of fantomes) {
      const d = distanceCroix(
        px, py,
        f.x, f.y,
        demiLongueur * f.echelle,
        rayon * f.echelle
      );
      if (d <= 0) couleur = melanger(couleur, BLANC, 0.1);
    }

    // La croix principale, pleine.
    const d = distanceCroix(px, py, cx, cy, demiLongueur, rayon);
    if (d <= 0) couleur = BLANC;

    return [...couleur, 255];
  }, options);
}

// ---------------------------------------------------------------- écriture

const dossier = process.argv[2];
if (!dossier) {
  console.error('Usage : node outils/generer-visuels-play.js <dossier>');
  process.exit(1);
}
fs.mkdirSync(dossier, { recursive: true });

const fichiers = [
  ['icone-512.png', icone(512)],
  // Play refuse la transparence sur les visuels de présentation.
  ['bandeau-1024x500.png', bandeau(1024, 500, { opaque: true })],
  // Grand visuel 16/9 : PNG 24 bits sans alpha, sous le mégaoctet.
  // Deux sous-échantillons suffisent à cette définition, et divisent par deux
  // le temps de rendu des neuf millions de pixels.
  ['grand-visuel-4096x2304.png', bandeau(4096, 2304, { sous: 2, opaque: true })],
];

for (const [nom, donnees] of fichiers) {
  fs.writeFileSync(path.join(dossier, nom), donnees);
  console.log(nom.padEnd(26), (donnees.length / 1024).toFixed(1) + ' Ko');
}
