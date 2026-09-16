import {useRef} from 'react';
import {SlothStage, type StageBounds} from './SlothStage';

const NAV = ['Shop', 'Story', 'Journal', 'Stockists'];

const TICKER = [
  'Small batch',
  'Undyed wool',
  'Made to be kept',
  'Repairs for life',
  'Shipped slowly',
];

const STATS: [string, string][] = [
  ['Pieces a year', '120'],
  ['Makers', '4'],
  ['Returns', 'Never asked'],
];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);

  // The stage measures these and fits him into the space they leave.
  const bounds: StageBounds = {root: rootRef, nav: navRef, lockup: lockupRef};

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{['--gaze' as string]: '0'}}
    >
      <SlothStage bounds={bounds} />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[96rem] flex-col px-6 md:px-10">
        <TopBar ref={navRef} />

        <div className="relative flex-1">
          {/* Him left, words right. Below lg the type moves to the top and he
              drops beneath it, because a half-width column of this is
              unreadable on a phone. */}
          <div
            ref={lockupRef}
            className="relative w-full max-w-[min(34rem,100%)] pt-2 md:absolute md:top-1/2 md:right-0 md:w-[46%] md:max-w-[38rem] md:-translate-y-1/2 md:pt-0"
          >
            <p className="text-label font-mono text-bark flex items-center gap-3 uppercase">
              <span className="bg-bark/50 h-px w-8" />
              Est. 2019 — Small batch
            </p>

            <h1 className="text-display font-display text-ink mt-6 max-w-[17ch] font-normal">
              Nothing here was made in{' '}
              <em className="text-bark font-semibold italic">a hurry</em>.
            </h1>

            <p className="text-lede text-ink/85 mt-7 max-w-[44ch]">
              Knitwear, ceramics and small comforts from a workshop that keeps
              its own pace. We make less than we could, and we would rather you
              bought one thing twice than two things once.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#"
                className="text-btn font-mono bg-ink text-cream group inline-flex items-center gap-2.5 rounded-full px-7 py-4 uppercase transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#0b1317]"
              >
                Shop the collection
                <Arrow />
              </a>
              <a
                href="#"
                className="text-btn font-mono text-ink border-ink/55 hover:border-ink/80 hover:bg-ink/8 inline-flex items-center rounded-full border px-7 py-4 uppercase backdrop-blur-[2px] transition-colors duration-300"
              >
                Our story
              </a>
            </div>

            <dl className="border-ink/20 mt-10 hidden max-w-[32rem] grid-cols-3 gap-6 border-t pt-7 lg:grid">
              {STATS.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-label font-mono text-ink/85 uppercase">{label}</dt>
                  <dd className="font-display text-ink mt-2 text-[1.375rem] font-normal">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Stacked only: the room he stands in. At md he is beside the
              type and takes the whole column instead. */}
          <div className="min-h-[46svh] md:hidden" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <Ticker />
      </div>
    </section>
  );
}

function TopBar({ref}: {ref: React.Ref<HTMLElement>}) {
  return (
    <header ref={ref} className="flex items-center justify-between py-6 md:py-7">
      <a
        href="#"
        aria-label="Amble, home"
        className="text-ink flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-60"
      >
        <Mark />
        <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">
          Amble
        </span>
      </a>

      <nav className="hidden md:block" aria-label="Primary">
        <ul className="text-label font-mono text-ink/85 flex items-center gap-9 uppercase">
          {NAV.map((item) => (
            <li key={item}>
              <a
                href="#"
                className="hover:text-ink relative inline-block py-1 transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <a
        href="#"
        className="text-label font-mono text-ink border-ink/55 hover:border-ink/80 hover:bg-ink/8 rounded-full border px-5 py-2.5 uppercase transition-colors duration-300"
      >
        Cart <span className="text-ink/85">(0)</span>
      </a>
    </header>
  );
}

/** A slow band of the things the brand keeps saying. */
function Ticker() {
  const run = [...TICKER, ...TICKER, ...TICKER, ...TICKER];
  return (
    <div className="border-ink/20 overflow-hidden border-t py-4">
      {/* Said once, plainly, for anyone listening rather than looking — the
          band itself repeats each phrase eight times, which is fine to see
          and miserable to hear. */}
      <ul className="sr-only">
        {TICKER.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>

      {/* Two identical halves, sliding exactly one of them, so the loop has
          no seam. Each half has to be at least a viewport wide or the seam
          becomes a visible gap. */}
      <div className="marquee-track flex w-max items-center" aria-hidden="true">
        {[0, 1].map((half) => (
          <ul
            key={half}
            className="text-label font-mono text-ink/80 flex items-center uppercase"
          >
            {run.map((word, i) => (
              <li key={`${word}-${i}`} className="flex items-center">
                <span className="px-7 whitespace-nowrap">{word}</span>
                <span className="bg-bark/60 h-1 w-1 rounded-full" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:translate-x-0.5"
    >
      <path
        d="M3 11 L11 3 M5 3 h6 v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A leaf, more or less — two arcs meeting at the tips. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2c6 3.4 9 7.2 9 11.2A9 9 0 0 1 3 13.2C3 9.2 6 5.4 12 2Z"
        fill="currentColor"
      />
      <path
        d="M12 22V9"
        stroke="var(--color-ground)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
