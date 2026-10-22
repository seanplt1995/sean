// index.js — the plate registry: name → builder, world placement and paint settings.
import { plateLinen } from './linen.js';
import { plateTitle } from './title.js';
import { plateSquare, plateQuay, plateWindow3, plateCafe } from './arles.js';
import { plateField3, plateEdge } from './provence.js';
import { plateVillage, plateHarbour, plateRidge } from './coast.js';
import { plateOver } from './overhead.js';

export const PLATES = {
  linen: { fn: plateLinen },
  title: { fn: plateTitle, seed: 9, x0: 220, y0: 755, paint: { R: [16, 11, 7, 4.5, 3], edgeBand: 2.5 } },
  square: { fn: plateSquare, seed: 21 },          // S03, S06, S08: the cathedral square, sky above for the tilt
  quay: { fn: plateQuay, seed: 22 },              // S04
  window3: { fn: plateWindow3, seed: 23 },        // S05
  cafe: { fn: plateCafe, seed: 24 },              // S07
  field3Dusk: { fn: () => plateField3('dusk'), seed: 25 },        // S09, S11
  field3Harvest: { fn: () => plateField3('harvest'), seed: 25 },  // S11
  field3Sunrise: { fn: () => plateField3('sunrise'), seed: 25 },  // S19, S20
  edge: { fn: plateEdge, seed: 26 },              // S10
  village: { fn: plateVillage, seed: 27 },        // S12, S14
  harbour: { fn: plateHarbour, seed: 28 },        // S13
  overNight: { fn: () => plateOver('night'), seed: 8 },  // S15
  overGold: { fn: () => plateOver('gold'), seed: 8 },    // S21–S23
  ridge: { fn: plateRidge, seed: 29 },            // S16–S18
};
