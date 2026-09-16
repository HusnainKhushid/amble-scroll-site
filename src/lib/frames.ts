/**
 * The panel runs off a decoded WebP frame sequence rather than a <video>.
 *
 * Scrubbing a <video> means writing `currentTime` on every pointer move, and
 * every browser answers that with an async seek — Safari and Firefox drop or
 * coalesce seeks under a fast cursor, which reads as stutter exactly when the
 * motion should feel locked to the hand. Pre-decoded bitmaps sidestep the
 * codec: picking a frame is an array index, painting it is one drawImage.
 */

export const FRAME_COUNT = 50;

/**
 * Sampled unevenly from the source clip, which runs at 24fps:
 *
 *   index  0–1   source 60, 65        lead-in, he is holding the left profile
 *   index  2–5   source 70–76         the turn starting, every other frame
 *   index  6–36  source 78–108        the turn proper, every frame
 *   index 37–49  source 110–200       settling right, thinning out
 *
 * Even sampling would have spent a third of the payload on frames where
 * nothing moves. Because the cursor maps linearly onto the index, this also
 * spends most of the cursor's travel on the part that actually turns.
 */
export const frameUrl = (i: number) =>
  `${import.meta.env.BASE_URL}frames/g${String(i).padStart(2, '0')}.webp`;

function loadOne(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    // decode() moves the cost off the first paint; if it is unsupported or
    // rejects (some Safari versions throw on cached images) the load event
    // still hands back a usable bitmap.
    const done = () => resolve(img);
    if (typeof img.decode === 'function') {
      img.decode().then(done, () => (img.complete ? done() : (img.onload = done)));
    } else {
      img.onload = done;
    }
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
  });
}

/**
 * Fills — and hands back — a sparse array that becomes dense as frames land,
 * so the panel can paint the resting pose the moment frame 0 decodes instead
 * of holding an empty box until the last one is in.
 */
export async function loadFrames(
  onProgress?: (loaded: number, total: number, frames: HTMLImageElement[]) => void,
): Promise<HTMLImageElement[]> {
  const frames: HTMLImageElement[] = new Array(FRAME_COUNT);
  let loaded = 0;

  const track = async (i: number) => {
    frames[i] = await loadOne(frameUrl(i));
    onProgress?.(++loaded, FRAME_COUNT, frames);
  };

  await track(0);
  await Promise.all(Array.from({length: FRAME_COUNT - 1}, (_, k) => track(k + 1)));

  return frames;
}
