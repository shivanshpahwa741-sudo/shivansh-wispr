/* ------------------------------------------------------------------
   Hero word morph.

   Echoes Flow's own hero grammar: a raw, unresolved state that
   settles into a clean one. Here the raw state is "unstructured data"
   and it resolves, in turn, into the things that actually come out of
   it. Same serif throughout; raw is roman and muted, resolved is
   italic and full ink, so the transformation reads without a label.
   ------------------------------------------------------------------ */

const RAW = 'unstructured data'

const RESOLVED = [
  'actionable insights',
  'strategy calls',
  'a driver-flow fix',
  'a reorder-rate KPI',
  'the one number that matters',
]

const GLYPHS = '01<>/|=+-*#%&$@{}[]~^'
const SCRAMBLE_MS = 760
const HOLD_RESOLVED = 1900
const HOLD_RAW = 1250

const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

/**
 * Scrambles from one string to another, revealing the target left to
 * right while the unrevealed tail churns through glyphs.
 */
function scramble(el, to, onDone) {
  const start = performance.now()
  const from = el.textContent
  const len = Math.max(from.length, to.length)

  const frame = (now) => {
    const t = Math.min((now - start) / SCRAMBLE_MS, 1)
    // ease-out so the reveal front decelerates into place
    const revealed = Math.floor((1 - Math.pow(1 - t, 3)) * len)

    let out = ''
    for (let i = 0; i < len; i += 1) {
      if (i < revealed) {
        out += to[i] ?? ''
      } else if (to[i] === ' ' || from[i] === ' ') {
        out += ' '
      } else if (i < to.length || i < from.length) {
        out += pick()
      }
    }
    el.textContent = out

    if (t < 1) {
      requestAnimationFrame(frame)
    } else {
      el.textContent = to
      onDone()
    }
  }

  requestAnimationFrame(frame)
}

export function initMorph(el, reduceMotion, lead) {
  if (!el) return

  // "I turn unstructured data" on the raw state, "into actionable
  // insights" on every resolved one, so the line stays a sentence all
  // the way round the cycle.
  const setLead = (atRaw) => {
    if (lead) lead.textContent = atRaw ? 'I turn' : 'into'
  }

  // Reserve the height of the longest phrase so nothing below shifts.
  const measure = document.createElement('span')
  measure.setAttribute('aria-hidden', 'true')
  measure.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;white-space:pre-wrap'
  el.parentNode.appendChild(measure)
  let tallest = 0
  ;[RAW, ...RESOLVED].forEach((phrase) => {
    measure.className = el.className
    measure.textContent = phrase
    tallest = Math.max(tallest, measure.offsetHeight)
  })
  measure.remove()
  if (tallest) el.style.minHeight = `${tallest}px`

  if (reduceMotion) {
    // No churn, no timers. State the transformation plainly instead.
    setLead(true)
    el.textContent = `${RAW} into ${RESOLVED[0]}`
    el.classList.add('is-resolved')
    return
  }

  let i = -1
  let stopped = false

  const next = () => {
    if (stopped) return
    i += 1

    // Every pass walks the resolved list, then returns to the raw state.
    const atRaw = i % (RESOLVED.length + 1) === RESOLVED.length
    const target = atRaw ? RAW : RESOLVED[i % (RESOLVED.length + 1)]

    el.classList.toggle('is-resolved', !atRaw)
    setLead(atRaw)
    scramble(el, target, () => {
      setTimeout(next, atRaw ? HOLD_RAW : HOLD_RESOLVED)
    })
  }

  // Pause while the tab is hidden so we are not burning frames offscreen.
  document.addEventListener('visibilitychange', () => {
    stopped = document.hidden
    if (!stopped) next()
  })

  setLead(true)
  el.textContent = RAW
  setTimeout(next, HOLD_RAW)
}
