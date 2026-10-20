/* ------------------------------------------------------------------
   Hero flow band.

   Same idea as Flow's own hero: text set on an SVG <textPath> and
   scrolled along a curve. Raw phrasing rides the loop on the left in
   muted ink, passes through the mark, and leaves on the right in cream
   on a black ribbon.

   Driven from requestAnimationFrame rather than SMIL. SMIL's document
   timeline would not start in testing: animationsPaused() reported
   false while getCurrentTime() stayed pinned at zero, and
   unpauseAnimations() did not revive it. A rAF loop is also easier to
   stop precisely when the band is offscreen or the tab is hidden.

   Seamlessness: startOffset is measured in user units, so the phrase is
   repeated and the offset wraps by exactly one repeat width. Shifting by
   one whole repeat looks identical to not shifting, so there is no seam.
   ------------------------------------------------------------------ */

const RAW_UNIT = 'unstructured data   ·   '
const CLEAN_UNIT = 'actionable insights   ·   '

const REPEATS = 14

// User units per second. Slightly different per curve, the way their
// two chains run at different durations.
const RAW_SPEED = 30
const CLEAN_SPEED = 24

const MAX_STEP = 0.05 // clamp the delta so a backgrounded tab cannot jump

function fill(textPath, unit) {
  if (!textPath) return 0
  textPath.textContent = unit.repeat(REPEATS)
  const total = textPath.getComputedTextLength()
  return total ? total / REPEATS : 0
}

export function initFlow(band, reduceMotion) {
  if (!band) return

  const tracks = [
    { el: band.querySelector('[data-raw]'), unit: RAW_UNIT, speed: RAW_SPEED },
    { el: band.querySelector('[data-clean]'), unit: CLEAN_UNIT, speed: CLEAN_SPEED },
  ].filter((t) => t.el)

  if (!tracks.length) return

  const measure = () => {
    tracks.forEach((t) => {
      t.unitLen = fill(t.el, t.unit)
      t.offset = t.offset ?? 0
      t.el.setAttribute('startOffset', t.offset.toFixed(2))
    })
  }

  measure()
  // Web fonts change the measurement, so redo it once they land.
  if (document.fonts?.ready) document.fonts.ready.then(measure)
  window.addEventListener('resize', measure, { passive: true })

  if (reduceMotion) return

  let rafId = null
  let last = 0

  const tick = (now) => {
    const dt = last ? Math.min((now - last) / 1000, MAX_STEP) : 0
    last = now

    tracks.forEach((t) => {
      // The first measurement can come back zero if it lands before the
      // web font and the first layout. Retry rather than sit still.
      if (!t.unitLen) {
        const total = t.el.getComputedTextLength()
        if (!total) return
        t.unitLen = total / REPEATS
      }
      t.offset -= t.speed * dt
      // Wrap by exactly one repeat so the loop never shows a seam.
      if (t.offset <= -t.unitLen) t.offset += t.unitLen
      t.el.setAttribute('startOffset', t.offset.toFixed(2))
    })

    rafId = requestAnimationFrame(tick)
  }

  const start = () => {
    if (rafId !== null) return
    last = 0
    rafId = requestAnimationFrame(tick)
  }

  const stop = () => {
    if (rafId === null) return
    cancelAnimationFrame(rafId)
    rafId = null
  }

  // Never animate a band that is offscreen or on a hidden tab.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
    { threshold: 0 }
  )
  io.observe(band)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else if (band.getBoundingClientRect().bottom > 0) start()
  })
}
