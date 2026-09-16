import {useEffect, useRef} from 'react';

/* Generated section — the raw site was hero-only. Matches the hero's warm
   ink/cream/bark system, Fraunces display, mono labels, and the same
   rounded-pill button language. */

const PIECES: [string, string, string][] = [
  ['The Everyday Crewneck', 'Undyed lambswool', '£140'],
  ['Fisherman Cardigan', 'Aran, hand-linked', '£265'],
  ['Ribbed Watch Cap', 'Two-ply merino', '£58'],
  ['Boat-neck Sweater', 'Long-staple cotton', '£120'],
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (el.classList.add('is-in'), io.disconnect()),
      {threshold: 0.18},
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Collection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id="collection"
      data-section="02-collection"
      className="amble-reveal bg-cream text-ink relative w-full px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto w-full max-w-[96rem]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div data-r>
            <p className="text-label font-mono text-bark flex items-center gap-3 uppercase">
              <span className="bg-bark/50 h-px w-8" />
              The collection
            </p>
            <h2 className="font-display text-display mt-6 max-w-[16ch] font-normal">
              A short list, made{' '}
              <em className="text-bark font-semibold italic">well</em>.
            </h2>
          </div>
          <p className="text-lede text-ink/80 max-w-[38ch]" data-r>
            Twelve pieces a year, knitted in a workshop that keeps its own pace.
            No seasons, no sales — just the things worth owning twice.
          </p>
        </div>

        <ul className="border-ink/15 mt-16 grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:grid-cols-4">
          {PIECES.map(([name, spec, price], i) => (
            <li
              key={name}
              data-r
              style={{transitionDelay: `${120 + i * 90}ms`}}
              className="group border-ink/15 flex flex-col justify-between border-b px-1 pt-8 pb-6 sm:odd:border-r lg:border-r lg:last:border-r-0"
            >
              <div className="bg-ground/25 border-ink/10 mb-7 aspect-[4/5] w-full rounded-sm border" />
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[1.25rem] font-normal leading-tight">
                    {name}
                  </h3>
                  <span className="font-mono text-label text-bark shrink-0 uppercase">
                    {price}
                  </span>
                </div>
                <p className="text-label font-mono text-ink/60 mt-2 uppercase">{spec}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
