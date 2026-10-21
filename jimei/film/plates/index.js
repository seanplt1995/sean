// index.js — the plate registry: name → builder, world placement and paint settings.
import { plateLinen, plateStreet, plateSky, plateBench } from './street.js';
import { plateTitle } from './title.js';
import { plateWindow } from './window.js';
import { plateField, plateClose, plateOver } from './field.js';
import { plateHill } from './hill.js';

export const PLATES = {
  linen: { fn: plateLinen },
  street: { fn: plateStreet, seed: 2 },
  sky: { fn: plateSky, seed: 5 },           // sits above the street: world y −1900…0
  bench: { fn: plateBench, seed: 3 },
  window: { fn: plateWindow, seed: 4 },
  fieldDusk: { fn: () => plateField('dusk'), seed: 6 },
  fieldHarvest: { fn: () => plateField('harvest'), seed: 6 },
  fieldSunrise: { fn: () => plateField('sunrise'), seed: 6 },
  close: { fn: plateClose, seed: 7 },
  overNight: { fn: () => plateOver('night'), seed: 8 },
  overGold: { fn: () => plateOver('gold'), seed: 8 },
  hill: { fn: plateHill, seed: 10 },
  title: { fn: plateTitle, seed: 9, x0: 220, y0: 755, paint: { R: [16, 11, 7, 4.5, 3], edgeBand: 2.5 } },
};
