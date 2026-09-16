/* Generated section — footer in the hero's warm system. */

const COLUMNS: [string, string[]][] = [
  ['Shop', ['Knitwear', 'Ceramics', 'Small comforts', 'Gift notes']],
  ['Workshop', ['Our story', 'Repairs for life', 'Journal', 'Stockists']],
  ['Say hello', ['hello@amble.co', 'Instagram', 'Newsletter', 'Visit us']],
];

export function Footer() {
  return (
    <footer
      id="footer"
      data-section="03-footer"
      className="bg-ink text-cream relative w-full px-6 pt-20 pb-10 md:px-10"
    >
      <div className="mx-auto w-full max-w-[96rem]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <span className="font-display text-[1.75rem] font-semibold tracking-[-0.015em]">
              Amble
            </span>
            <p className="text-lede text-cream/70 mt-4">
              Knitwear and small comforts from a workshop that would rather you
              bought one thing twice.
            </p>
            <p className="text-label font-mono text-cream/45 mt-6 uppercase">
              Est. 2019 — Small batch
            </p>
          </div>

          {COLUMNS.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <h3 className="text-label font-mono text-cream/50 uppercase">{title}</h3>
              <ul className="mt-5 space-y-3">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-cream/85 hover:text-cream text-[0.95rem] transition-colors duration-300"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-cream/15 mt-16 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-label font-mono text-cream/45 uppercase">
            © 2026 Amble — Made slowly
          </p>
          <div className="text-label font-mono text-cream/45 flex gap-6 uppercase">
            <a href="#" className="hover:text-cream transition-colors">Terms</a>
            <a href="#" className="hover:text-cream transition-colors">Privacy</a>
            <a href="#" className="hover:text-cream transition-colors">Repairs</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
