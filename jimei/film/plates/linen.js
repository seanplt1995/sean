// linen.js — P1: the bare linen canvas (underpainting only), where the film begins and ends.
import { Ref } from '../../engine/plate.js';

export function plateLinen() {
  const ref = new Ref(1440, 2560);
  ref.fill({ rect: [0, 0, 1440, 2560] }, { rad: [720, 1250, 100, 720, 1250, 1500], stops: [[0, '#c2b8a6'], [1, '#ada290']] }, { maxR: 60 });
  return { ref, w: 1440, h: 2560, noStrokes: true };
}
