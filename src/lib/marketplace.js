/* Marketplace iframe hook.

   When this site is embedded, the parent needs to know which section is on
   screen. Every section carries a data-section id; report the one that
   crosses the middle of the viewport, and the total order once on boot. */
if (window.parent !== window) {
  const post = (payload) => window.parent.postMessage({ source: 'scroll-site', ...payload }, '*')

  window.addEventListener('DOMContentLoaded', () => {
    const els = [...document.querySelectorAll('[data-section]')]
    post({ type: 'sections', ids: els.map((el) => el.dataset.section) })

    let current = null
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = e.target.dataset.section
          if (id === current) continue
          current = id
          post({ type: 'section', id })
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
  })

  // let the parent drive the scroll: { type: 'scrollTo', id: '03-night' }
  window.addEventListener('message', (e) => {
    if (e.data?.type !== 'scrollTo') return
    document.querySelector(`[data-section="${e.data.id}"]`)?.scrollIntoView({ behavior: 'smooth' })
  })
}
