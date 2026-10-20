/* ------------------------------------------------------------------
   Hero flow band.

   Same mechanism as Flow's own hero: text on an SVG <textPath>,
   scrolled along a curve by animating startOffset. "unstructured data"
   rides the loop on the left, passes through the mark, and leaves on
   the right as "actionable insights" in cream on a black ribbon.

   Driven by SMIL, deliberately.

   A requestAnimationFrame version looked correct and then froze: rAF is
   throttled to zero frames a second whenever the tab or window is
   backgrounded or occluded, so the band would sit still while the page
   was plainly on screen. SMIL runs on the browser's own animation
   timeline and is not subject to that.

   An earlier SMIL attempt also failed, for a reason worth recording:
   an IntersectionObserver called svg.pauseAnimations() while the band
   was still below the fold, which freezes the document timeline before
   it has ever started, and unpauseAnimations() will not revive it.
   So nothing here ever pauses the timeline. There is no observer and
   no visibilitychange handler. The browser already stops compositing
   offscreen work on its own.

   No visible reset: the repeat count comes from the real measured path
   length so the phrase always overruns the curve, and one animation
   cycle advances by exactly one repeat width. Shifting by a whole
   repeat is indistinguishable from not shifting.
   ------------------------------------------------------------------ */

const SVG_NS = 'http://www.w3.org/2000/svg'

const RAW_UNIT = 'unstructured data   ·   '
const CLEAN_UNIT = 'actionable insights   ·   '

// User units per second.
const RAW_SPEED = 78
const CLEAN_SPEED = 64

/**
 * Fills a textPath with enough repeats to overrun its curve, and drives
 * it with a freshly created <animate>. Returns nothing; the element is
 * left animating.
 */
function drive(textPath, unit, speed) {
  const path = document.getElementById(textPath.dataset.path)
  if (!path) return

  // Drop any previous driver before re-measuring.
  textPath.querySelectorAll('animate').forEach((n) => n.remove())

  // Measure one repeat, then lay down enough to overrun the curve.
  textPath.textContent = unit
  const unitLen = textPath.getComputedTextLength()
  if (!unitLen) return

  const repeats = Math.ceil(path.getTotalLength() / unitLen) + 3
  textPath.textContent = unit.repeat(repeats)

  // Forward along the path: toward the mark, then away from it.
  const animate = document.createElementNS(SVG_NS, 'animate')
  animate.setAttribute('attributeName', 'startOffset')
  animate.setAttribute('values', `-${unitLen.toFixed(2)};0`)
  animate.setAttribute('dur', `${(unitLen / speed).toFixed(3)}s`)
  animate.setAttribute('repeatCount', 'indefinite')
  animate.setAttribute('calcMode', 'linear')

  // Appending an <animate> that is already fully configured starts it,
  // which avoids relying on beginElement against a cold timeline.
  textPath.appendChild(animate)
}

export function initFlow(band, reduceMotion) {
  if (!band) return

  const tracks = [
    { el: band.querySelector('[data-raw]'), unit: RAW_UNIT, speed: RAW_SPEED },
    { el: band.querySelector('[data-clean]'), unit: CLEAN_UNIT, speed: CLEAN_SPEED },
  ].filter((t) => t.el)

  if (!tracks.length) return

  if (reduceMotion) {
    // Lay the text down and leave it completely still.
    tracks.forEach((t) => {
      const path = document.getElementById(t.el.dataset.path)
      t.el.textContent = t.unit
      const unitLen = t.el.getComputedTextLength()
      if (!unitLen || !path) return
      const repeats = Math.ceil(path.getTotalLength() / unitLen) + 1
      t.el.textContent = t.unit.repeat(repeats)
    })
    return
  }

  const run = () => tracks.forEach((t) => drive(t.el, t.unit, t.speed))

  run()
  // The web font changes the measurement, so lay it down again once it
  // lands. Re-running replaces the driver rather than stacking one.
  if (document.fonts?.ready) document.fonts.ready.then(run)

  let resizeTimer = null
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(run, 180)
    },
    { passive: true }
  )
}
