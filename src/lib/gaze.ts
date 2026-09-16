import {FRAME_COUNT} from './frames';

/**
 * This clip simply turns: a held left profile, one continuous sweep, a held
 * right profile. So the cursor maps straight onto the sequence.
 *
 * That is worth stating because it is the opposite of what the first hero
 * needed. There the character never swept — it cut between two poses behind a
 * blink — which forced a hysteresis band and a speed limit to keep the cut
 * hidden. None of that applies here, and reaching for it would only add lag.
 */

/** Cursor x across the viewport (0..1) -> fractional frame index. */
export function frameForPointer(nx: number): number {
  const t = Math.min(1, Math.max(0, nx));
  return t * (FRAME_COUNT - 1);
}

/** Frame-rate independent exponential approach: 63% of the gap per `tau`. */
export const approach = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);

/**
 * Deliberately slack. A tight chase is correct for a character that snaps
 * between poses; this one is a sloth, and a quarter-second of lag is the
 * whole personality. Lower it and he starts to look anxious.
 */
export const TAU_FRAME = 0.24;

/** The drift of the image inside its panel — slower still, so it trails. */
export const TAU_DRIFT = 0.4;

/** Seconds for one full glance cycle when there is no cursor to follow. */
export const AUTOPILOT_PERIOD = 9;
