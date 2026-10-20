/* ------------------------------------------------------------------
   Hero flow band.

   Text on an SVG <textPath>, scrolled along a curve by moving
   startOffset. "unstructured data" rides the loop on the left, passes
   through the mark, and leaves on the right as "actionable insights"
   in cream on a black ribbon.

   WHY requestAnimationFrame AND NOT SMIL
   SMIL is the obvious tool here and it is what Flow's own hero uses,
   but it does not work in this Chromium: the SVG document timeline
   reports getCurrentTime() pinned at 0.00 and never advances, an
   <animate> appended after load stays parked on its first keyframe, and
   beginElement() against that dead timeline does nothing. Tested twice,
   once with markup-declared animations and once with animations built
   in JS. So the position is written from script instead.

   WHY THE LOOP IS NEVER CANCELLED
   An earlier version started and stopped the loop from both an
   IntersectionObserver and a visibilitychange handler, which gave two
   independent ways to leave it stopped for good. Now there is one loop,
   started once, that runs for the life of the page. The observer only
   flips a flag, and offscreen frames return early instead of being
   cancelled. Browsers throttle rAF on backgrounded windows by design;
   nothing can paint during that, and the loop resumes on its own.

   POSITION IS DERIVED FROM ELAPSED TIME, NOT ACCUMULATED PER FRAME,
   so a long throttled gap resolves to the correct position on the
   first frame back rather than drifting behind.

   NO VISIBLE RESET
   The repeat count comes from the real measured path length, so the
   phrase always overruns the curve, and the position wraps by exactly
   one repeat width. Shifting by a whole repeat is indistinguishable
   from not shifting.
   ------------------------------------------------------------------ */

const RAW_UNIT = 'unstructured data   ·   '
const CLEAN_UNIT = 'actionable insights   ·   '

// User units per second.
const RAW_SPEED = 78
const CLEAN_SPEED = 64

/**
 * Lays down enough repeats to overrun the curve and returns the width
 * of one repeat, or 0 if the text could not be measured yet.
 */
function layout(textPath, unit) {
  const path = document.getElementById(textPath.dataset.path)
  if (!path) return 0

  textPath.textContent = unit
  const unitLen = textPath.getComputedTextLength()
  if (!unitLen) return 0

  const repeats = Math.ceil(path.getTotalLength() / unitLen) + 3
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

  const measure = () => tracks.forEach((t) => (t.unitLen = layout(t.el, t.unit)))

  measure()
  // The web font changes the measurement, so lay it down again once it
  // lands, and after a resize.
  if (document.fonts?.ready) document.fonts.ready.then(measure)
  let resizeTimer = null
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(measure, 180)
    },
    { passive: true }
  )

  if (reduceMotion) {
    tracks.forEach((t) => t.el.setAttribute('startOffset', '0'))
    return
  }

  let visible = true
  const started = performance.now()

  const tick = (now) => {
    requestAnimationFrame(tick)
    if (!visible) return

    const elapsed = (now - started) / 1000

    for (const t of tracks) {
      // The first measurement can come back zero if it lands before the
      // web font and the first layout. Retry rather than sit still.
      if (!t.unitLen) {
        t.unitLen = layout(t.el, t.unit)
        if (!t.unitLen) continue
      }

      // Forward along the path, wrapped into a single repeat. Derived
      // from elapsed time, so a throttled gap cannot leave it behind.
      const travelled = (elapsed * t.speed) % t.unitLen
      t.el.setAttribute('startOffset', (travelled - t.unitLen).toFixed(2))
    }
  }

  // The observer only flips a flag. It cannot stop the loop.
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting)
    },
    { threshold: 0, rootMargin: '10% 0px' }
  )
  io.observe(band)

  requestAnimationFrame(tick)
}
