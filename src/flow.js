/* ------------------------------------------------------------------
   Hero flow band.

   Built the way Flow's own hero is built. Raw text rides a looping
   SVG <textPath> on the left in muted ink. It passes through the mark
   at the bottom centre, and what leaves on the right is a finished
   read, set in cream on a thick dark ribbon. A badge above the mark
   names what each pass did, the way Flow calls out "Added question
   mark" or "Removed Umm".

   Both strings are duplicated and the offset travels exactly one copy,
   so the loop never visibly resets.
   ------------------------------------------------------------------ */

// Raw material, in the shape notes actually arrive in.
const RAW =
  '300+ driver signups, 42 finished   //   rider side converting fine   //   ' +
  'orders keep landing after site visits, not after calls   //   CRM fully ' +
  'updated and sales still flat   //   MAU stuck under 10   //   500 prospects ' +
  'a day and no movement   //   reorders arriving in waves   //   '

// The same material, read.
const CLEAN =
  'Driver conversion is 14% against 85% on riders, so the roadmap moves to ' +
  'driver flow.   What decides reform is reorder rate, not new customers.   ' +
  'At Loopdesk the outbound volume was fine and the customer profile was ' +
  'wrong.   Paid acquisition only broke even above a certain order value.   '

// What the pass actually did, named plainly.
const BADGES = [
  'Split the two sides of the marketplace',
  'Ranked by conversion, not by volume',
  'Found the binding constraint',
  'Traced orders back to their real source',
  'Separated the signal from the activity',
]

const BADGE_MS = 3600

export function initFlow(band, reduceMotion) {
  if (!band) return

  const rawEl = band.querySelector('[data-raw]')
  const cleanEl = band.querySelector('[data-clean]')
  const badgeEl = band.querySelector('[data-badge]')
  const svg = band.querySelector('svg')

  if (rawEl) rawEl.textContent = RAW.repeat(2)
  if (cleanEl) cleanEl.textContent = CLEAN.repeat(2)
  if (badgeEl) badgeEl.textContent = BADGES[0]

  if (reduceMotion) {
    // SMIL does not listen to CSS, so stop it outright and leave a
    // legible still frame with one badge showing.
    svg.pauseAnimations()
    return
  }

  let badgeTimer = null
  let i = 0

  const cycleBadge = () => {
    if (!badgeEl) return
    badgeEl.parentElement.classList.remove('is-shown')
    setTimeout(() => {
      i = (i + 1) % BADGES.length
      badgeEl.textContent = BADGES[i]
      badgeEl.parentElement.classList.add('is-shown')
    }, 420)
  }

  const play = () => {
    svg.unpauseAnimations()
    badgeEl?.parentElement.classList.add('is-shown')
    if (!badgeTimer) badgeTimer = setInterval(cycleBadge, BADGE_MS)
  }

  const pause = () => {
    svg.pauseAnimations()
    clearInterval(badgeTimer)
    badgeTimer = null
  }

  // Never animate a band that is offscreen or on a hidden tab.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? play() : pause())),
    { threshold: 0 }
  )
  io.observe(band)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause()
    else if (band.getBoundingClientRect().bottom > 0) play()
  })
}
