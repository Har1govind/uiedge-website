/**
 * Smooth scroll — the live site runs Lenis (`class="lenis"` on <html>).
 * We wire up the same library so wheel/touch scrolling has the same
 * eased, slightly-weighted feel instead of the browser's native scroll.
 */
import Lenis from "lenis";

export function initSmoothScroll(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const lenis = new Lenis({
    duration: 1.4,
    easing: (t: number) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  document.documentElement.classList.add("lenis");

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
