/* ------------------------------------------------------------------
   Hero flow band.

   Same idea as Flow's own hero: text set on an SVG <textPath> and
   scrolled along a curve. "unstructured data" rides the loop on the
   left, passes through the mark, and leaves on the right as
   "actionable insights" in cream on a black ribbon.

   Travel runs forward along each path, so the text moves toward the
   mark and then away from it, the direction the curves are drawn.

   Driven from requestAnimationFrame rather than SMIL. SMIL's document
   timeline would not start in testing: animationsPaused() reported
   false while getCurrentTime() stayed pinned at zero, and
   unpauseAnimations() did not revive it.

   No visible reset: the number of repeats is computed from the real
   path length so the phrase always overruns the curve, and the offset
   wraps by exactly one measured repeat width. Shifting by one whole
   repeat looks identical to not shifting at all.
   ------------------------------------------------------------------ */

const RAW_UNIT = 'unstructured data   ·   '
const CLEAN_UNIT = 'actionable insights   ·   '

// User units per second.
const RAW_SPEED = 78
const CLEAN_SPEED = 64

const MAX_STEP = 0.05 // clamp the delta so a backgrounded tab cannot jump

/**
 * Fills a textPath with enough repeats to overrun its curve, and
 * returns the width of a single repeat.
 */
function fill(textPath, unit) {
  const pathId = textPath.dataset.path
  const path = pathId && document.getElementById(pathId)
  if (!path) return 0

  // Measure one repeat first.
  textPath.textContent = unit
  const unitLen = textPath.getComputedTextLength()
  if (!unitLen) return 0

  // Overrun the curve by a full extra screen of text in both
  // directions, so a wrap can never expose the end of the string.
  const pathLen = path.getTotalLength()
  const repeats = Math.ceil(pathLen / unitLen) + 3

  textPath.textContent = unit.repeat(repeats)
  return unitLen
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
      // Start one repeat back so the curve is already full at frame one.
      t.offset = t.offset ?? -(t.unitLen || 0)
      t.el.setAttribute('startOffset', (t.offset || 0).toFixed(2))
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
        t.unitLen = fill(t.el, t.unit)
        if (!t.unitLen) return
        t.offset = -t.unitLen
      }

      // Forward along the path: toward the mark, then away from it.
      t.offset += t.speed * dt
      // Wrap by exactly one repeat so the loop never shows a seam.
      if (t.offset >= 0) t.offset -= t.unitLen

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
