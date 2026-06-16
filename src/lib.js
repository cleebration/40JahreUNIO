import { MOTIFS, WORKS } from "./data.js";

export const motifByKey = Object.fromEntries(MOTIFS.map((m) => [m.key, m]));

export function worksOfMotif(key) {
  return WORKS.filter((w) => w.motif === key);
}

export function countByMotif() {
  const c = {};
  for (const w of WORKS) c[w.motif] = (c[w.motif] || 0) + 1;
  return c;
}

export const STATS = {
  works: WORKS.length,
  motifs: MOTIFS.length,
  people: new Set(WORKS.map((w) => `${w.vorname}|${w.nachname}`)).size,
};
