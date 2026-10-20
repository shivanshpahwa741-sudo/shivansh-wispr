import './style.css'
import { initMorph } from './morph.js'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

initMorph(
  document.getElementById('morph'),
  reduceMotion,
  document.getElementById('morphLead')
)

/* Sticky nav hairline ------------------------------------------------ */
const nav = document.getElementById('nav')
const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })

/* Reveal on enter ----------------------------------------------------- */
const revealables = document.querySelectorAll('.reveal')
if (reduceMotion) {
  revealables.forEach((el) => el.classList.add('is-in'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px 18% 0px', threshold: 0 }
  )
  revealables.forEach((el) => io.observe(el))
}

/* Bar fills ----------------------------------------------------------- */
const fills = document.querySelectorAll('.bar-fill')
const paint = (el) => {
  el.style.width = `${el.dataset.fill}%`
}

if (reduceMotion) {
  fills.forEach(paint)
} else {
  const barIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        setTimeout(() => paint(el), 120 * Number(el.dataset.index || 0))
        barIo.unobserve(el)
      })
    },
    { threshold: 0.4 }
  )
  fills.forEach((el, i) => {
    el.dataset.index = i
    barIo.observe(el)
  })
}

/* Smooth scroll, loaded only when motion is welcome -------------------- */
if (!reduceMotion) {
  import('lenis').then(({ default: Lenis }) => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'))
        if (!target) return
        e.preventDefault()
        lenis.scrollTo(target, { offset: -80 })
      })
    })
  })
}
