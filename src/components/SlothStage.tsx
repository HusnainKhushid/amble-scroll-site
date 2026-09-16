import {useEffect, useRef, useState, type RefObject} from 'react';
import {FRAME_COUNT, loadFrames} from '../lib/frames';
import {
  approach,
  AUTOPILOT_PERIOD,
  frameForPointer,
  TAU_DRIFT,
  TAU_FRAME,
} from '../lib/gaze';
import {useReducedMotion} from '../hooks/useReducedMotion';

const IMG_W = 1400;
const IMG_H = 925;

/**
 * Where he stands inside the frame, measured across the sequence rather than
 * guessed: the union of his silhouette over the first, middle and last poses.
 */
const FIG_X0 = 298;
const FIG_X1 = 823;
const FIG_CX = (FIG_X0 + FIG_X1) / 2;
const FIG_W = FIG_X1 - FIG_X0;
/** Top of his head and the soles of his feet. */
const FIG_Y0 = 60;
const FIG_Y1 = 869;
const FIG_H = FIG_Y1 - FIG_Y0;

/**
 * Height kept clear at the bottom for the ticker, which is laid over the
 * footage. Without it he is sized to stand on the very bottom edge and his
 * feet end up behind the band.
 */
const TICKER_RESERVE = 32;

/**
 * The backdrop is a soft diagonal gradient, not a flat colour, so the area
 * beyond the frame cannot be filled with one swatch — and stretching the
 * frame's own 1px edge column would smear its compression noise into
 * horizontal streaks. These are smoothed vertical profiles taken from the
 * outermost columns of each side. Sampling wider averages across the
 * backdrop's own horizontal slope and lands several levels off the column the
 * seam actually meets.
 *
 * They still cannot match every frame — the clip's grain moves them a few
 * levels either way — so the bands are also feathered in over FEATHER pixels.
 */
const FEATHER = 220;

/**
 * The frame's top row, sampled across its width. This one has to be a
 * *horizontal* ramp: the backdrop shifts about 14 levels from left to right
 * up there, so filling above the frame with the side profiles' flat top stop
 * puts a visible step along the whole seam — the line under the nav.
 */
const TOP_EDGE = [
  '#86a2ac', '#89a5b0', '#8eaab5', '#91aeb9', '#93b0bb', '#94b0bc', '#93afbb',
  '#91adb8', '#8eabb6', '#8ca9b4', '#8ca8b4',
];

const LEFT_EDGE = [
  '#85a1ac', '#86a3af', '#89a6b3', '#8aa8b5', '#8ba9b6', '#8dabb7', '#8dabb6',
  '#8dacb6', '#8dadb7', '#91b0ba', '#98b6c0', '#9ebbc4', '#a0bcc5', '#a3bec7',
  '#aac2cc',
];
const RIGHT_EDGE = [
  '#8ca9b5', '#8caab7', '#8eacb9', '#8fadba', '#91afbc', '#91b1bd', '#91b1bd',
  '#91b0bc', '#91b0bc', '#93b3bf', '#98b7c3', '#a4c1cb', '#b3ced5', '#b9d3da',
  '#b8d1db',
];

/**
 * Width at which he moves beside the type instead of under it. Matches the
 * layout's own breakpoint. A wide-but-short window — a half-height browser on
 * a laptop — has plenty of room beside the type and none beneath it, so this
 * sits low rather than at the usual desktop breakpoint.
 */
const SIDE_BY_SIDE = 768;

/**
 * Gap left above his head, measured from the top of the page rather than the
 * nav's baseline. The frame then runs off the top edge instead of ending
 * beneath the bar, which both removes that seam and lets him stand taller.
 */
const HEAD_TOP_GAP = 26;
/** Where he sits in the channel the type leaves him. */
const FOCUS_BIAS = 0.47;
/** Share of the width he takes when the type is stacked above him. */
const STACK_WIDTH = 0.62;

/**
 * How far the frame drifts with the gaze, in CSS pixels. Horizontal only — a
 * vertical shift would pull the backdrop out of step with its bands.
 */
const DRIFT_X = 13;

export interface StageBounds {
  /** Carries `--gaze` for anything that wants to read the pose. */
  root: RefObject<HTMLElement | null>;
  nav: RefObject<HTMLElement | null>;
  /** The block of type he has to stay clear of. */
  lockup: RefObject<HTMLElement | null>;
}

interface Fit {
  s: number;
  dx: number;
  dy: number;
}

export function SlothStage({bounds}: {bounds: StageBounds}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext('2d', {alpha: false});
    if (!ctx) return;

    let alive = true;
    let frames: HTMLImageElement[] = [];
    let hasPainted = false;

    // Without a hover-capable pointer there is no cursor to follow, so he
    // glances back and forth on his own instead of standing frozen.
    const autopilot = !window.matchMedia('(hover: hover)').matches && !reduced;
    let autopilotOn = autopilot;
    let onScreen = true;
    let clock = 0;

    let cur = 0;
    let target = 0;
    let drift = 0;
    let tDrift = 0;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let fit: Fit = {s: 1, dx: 0, dy: 0};
    let leftFill: CanvasGradient | string = LEFT_EDGE[0];
    let rightFill: CanvasGradient | string = RIGHT_EDGE[0];

    let lastDrawn = -1;
    let lastDrift = Number.NaN;
    let running = false;
    let rafId = 0;
    let last = 0;

    /**
     * Sizes him to stand from just under the nav down to the floor, then caps
     * that by the channel the type leaves him. Measured off the live boxes,
     * because the headline's width depends on font metrics we cannot predict
     * and shifts again when the webfont swaps in.
     */
    const computeFit = (): Fit => {
      const r = host.getBoundingClientRect();
      const lockEl = bounds.lockup.current;
      const lockR = lockEl?.offsetParent ? lockEl.getBoundingClientRect() : null;
      const gutter = Math.max(24, Math.min(60, W * 0.032));

      if (W >= SIDE_BY_SIDE && lockR) {
        // Side by side: he owns everything left of the type.
        const channel = Math.max(160, lockR.left - r.left - gutter);
        const s = Math.min(
          (H - TICKER_RESERVE - HEAD_TOP_GAP) / FIG_H,
          channel / FIG_W,
        );
        // Keep him whole and clear of the type: never cropped at the left
        // edge, never past the channel's right. The width cap above
        // guarantees this range is not empty.
        const lo = -FIG_X0 * s;
        const hi = channel - FIG_X1 * s;
        // Anchored on his feet so he stands above the ticker, then pinned so
        // the frame always covers the top of the page and always reaches the
        // bottom. At this size the first clamp is what bites, and the frame
        // runs off the top with nothing to seam against.
        let dy = H - TICKER_RESERVE - FIG_Y1 * s;
        dy = Math.min(dy, 0);
        dy = Math.max(dy, H - IMG_H * s);
        return {
          s,
          dx: Math.min(Math.max(channel * FOCUS_BIAS - FIG_CX * s, lo), hi),
          dy,
        };
      }

      // Stacked: the type sits above him, so he is centred and only has to
      // keep his head clear of it.
      const below = (lockR ? lockR.bottom - r.top : 0) + gutter;
      const s = Math.min(
        (STACK_WIDTH * W) / FIG_W,
        Math.max(0.05, (H - TICKER_RESERVE - below) / FIG_H),
      );
      return {
        s,
        dx: W / 2 - FIG_CX * s,
        dy: Math.max(H - TICKER_RESERVE - FIG_Y1 * s, H - IMG_H * s),
      };
    };

    const buildFills = () => {
      const y0 = fit.dy * dpr;
      const y1 = (fit.dy + IMG_H * fit.s) * dpr;
      if (!(y1 > y0)) return;
      const make = (stops: string[]) => {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
        return g;
      };
      // Gradients hold their end stops beyond the range, so the strips above
      // and below the frame continue the backdrop rather than cutting off.
      leftFill = make(LEFT_EDGE);
      rightFill = make(RIGHT_EDGE);
    };

    const resolveFrame = (i: number) => {
      for (let k = i; k >= 0; k--) if (frames[k]) return k;
      for (let k = i + 1; k < FRAME_COUNT; k++) if (frames[k]) return k;
      return -1;
    };

    const draw = (index: number, shift: number): boolean => {
      const img = frames[index];
      if (!img) return false;

      const cw = canvas.width;
      const ch = canvas.height;
      const x = (fit.dx + shift) * dpr;
      const y = fit.dy * dpr;
      const w = IMG_W * fit.s * dpr;
      const h = IMG_H * fit.s * dpr;

      // The right band is the wide one — it sits behind the type — so it is
      // the base coat. Anything left of the frame gets its own edge profile.
      ctx.fillStyle = rightFill;
      ctx.fillRect(0, 0, cw, ch);
      if (x > 0) {
        ctx.fillStyle = leftFill;
        ctx.fillRect(0, 0, x, ch);
      }

      // Above the frame the fill has to ramp across x, not down y, or the
      // seam steps by the backdrop's full left-to-right spread. Side by side
      // there is no strip here at all; stacked, this is the whole upper page.
      let topFill: CanvasGradient | null = null;
      if (y > 0) {
        topFill = ctx.createLinearGradient(x, 0, x + w, 0);
        TOP_EDGE.forEach((c, i) =>
          topFill!.addColorStop(i / (TOP_EDGE.length - 1), c),
        );
        ctx.fillStyle = topFill;
        ctx.fillRect(0, 0, cw, y);
      }

      ctx.drawImage(img, x, y, w, h);

      // Feather the frame into its bands. Two things show up as a hard edge
      // otherwise: the profile's few-level mismatch against this particular
      // frame, and the fact that the real backdrop keeps darkening outward
      // while a vertical fill cannot follow it. Spread over FEATHER pixels
      // neither is visible, and the frame's outer margin is bare backdrop, so
      // none of him is lost to it.
      // Each side is capped by its own clear margin, so however small he is
      // scaled the fade stops short of his fur.
      const N = 40;
      const margin = FEATHER * dpr;
      const rightFade = Math.min(margin, (IMG_W - FIG_X1) * fit.s * dpr * 0.85);
      const leftFade = Math.min(margin, FIG_X0 * fit.s * dpr * 0.85);
      if (x + w < cw && rightFade > 1) {
        const step = rightFade / N;
        ctx.fillStyle = rightFill;
        for (let i = 0; i < N; i++) {
          const t = (i + 1) / N;
          ctx.globalAlpha = t * t;
          ctx.fillRect(x + w - rightFade + i * step, 0, step + 1, ch);
        }
      }
      if (x > 0 && leftFade > 1) {
        const step = leftFade / N;
        ctx.fillStyle = leftFill;
        for (let i = 0; i < N; i++) {
          const t = (i + 1) / N;
          ctx.globalAlpha = t * t;
          ctx.fillRect(x + leftFade - (i + 1) * step, 0, step + 1, ch);
        }
      }
      // The strip above matches the seam's colour exactly but cannot follow
      // the backdrop's downward ramp, so soften that change too.
      const topFade = Math.min(margin, FIG_Y0 * fit.s * dpr * 0.85);
      if (topFill && topFade > 1) {
        const step = topFade / N;
        ctx.fillStyle = topFill;
        for (let i = 0; i < N; i++) {
          const t = (i + 1) / N;
          ctx.globalAlpha = t * t;
          ctx.fillRect(0, y + topFade - (i + 1) * step, cw, step + 1);
        }
      }
      ctx.globalAlpha = 1;

      if (!hasPainted) {
        hasPainted = true;
        setPainted(true);
      }
      return true;
    };

    const paint = (wanted: number, shift: number) => {
      const index = frames[wanted] ? wanted : resolveFrame(wanted);
      if (index < 0) return;
      const moved = !(Math.abs(shift - lastDrift) <= 0.05);
      if (index === lastDrawn && !moved) return;
      if (draw(index, shift)) {
        lastDrawn = index;
        lastDrift = shift;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (autopilotOn) {
        clock += dt;
        // A slow sine rather than a square wave: he has a continuous sweep to
        // play with, so there is no reason to jump between two poses.
        const phase = (clock / AUTOPILOT_PERIOD) * Math.PI * 2;
        const x = 0.5 + 0.42 * Math.sin(phase);
        target = frameForPointer(x);
        tDrift = x * 2 - 1;
      }

      if (reduced) {
        cur = target;
        drift = 0;
        tDrift = 0;
      } else {
        cur += (target - cur) * approach(dt, TAU_FRAME);
        drift += (tDrift - drift) * approach(dt, TAU_DRIFT);
      }

      paint(Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(cur))), drift * DRIFT_X);
      bounds.root.current?.style.setProperty(
        '--gaze',
        (cur / (FRAME_COUNT - 1)).toFixed(4),
      );

      const settled =
        !autopilotOn &&
        Math.abs(target - cur) < 0.004 &&
        Math.abs(tDrift - drift) < 0.002;
      if (settled) {
        cur = target;
        drift = tDrift;
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running || !alive) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    /**
     * He tracks the cursor anywhere on the page, not just over his own half —
     * the point is that he is watching you, so the mapping is against the
     * viewport rather than his box.
     */
    const onPointer = (e: PointerEvent) => {
      if (!onScreen) return;
      autopilotOn = false;
      const nx = e.clientX / Math.max(1, window.innerWidth);
      target = frameForPointer(nx);
      tDrift = Math.max(-1, Math.min(1, nx * 2 - 1));
      wake();
    };

    /** Cursor off the window: back to the resting left profile. */
    const onLeaveWindow = () => {
      if (autopilotOn) return;
      target = 0;
      tDrift = 0;
      wake();
    };

    const relayout = () => {
      const r = host.getBoundingClientRect();
      // Capping DPR at 2 keeps fill rate sane on 3x phones; on a soft-shaded
      // render the extra samples are invisible.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;

      const w = Math.max(1, Math.round(W * dpr));
      const h = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      fit = computeFit();
      buildFills();
      lastDrift = Number.NaN;
      // Resizing blanks the backing store; repaint rather than let a frame of
      // empty canvas through.
      if (lastDrawn >= 0) paint(lastDrawn, drift * DRIFT_X);
      wake();
    };

    const ro = new ResizeObserver(relayout);
    ro.observe(host);
    // The type's own box drives the fit, so watch it too — a reflow or a font
    // swap moves it without the hero ever changing size.
    for (const el of [bounds.nav.current, bounds.lockup.current]) {
      if (el) ro.observe(el);
    }
    relayout();

    document.fonts?.ready.then(() => {
      if (alive) relayout();
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (autopilot) autopilotOn = onScreen;
        if (onScreen && autopilotOn) wake();
      },
      {threshold: 0},
    );
    io.observe(host);

    window.addEventListener('pointermove', onPointer, {passive: true});
    document.documentElement.addEventListener('pointerleave', onLeaveWindow);

    loadFrames((_loaded, _total, all) => {
      if (!alive) return;
      frames = all;
      lastDrift = Number.NaN;
      wake();
    }).catch(() => {
      /* A dropped frame just means he holds the pose he already has. */
    });

    return () => {
      alive = false;
      running = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
    };
  }, [reduced, bounds]);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="h-full w-full transition-opacity duration-[900ms] ease-out"
        style={{opacity: painted ? 1 : 0}}
      />
    </div>
  );
}
