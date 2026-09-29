/**
 * Scroll-reveal — replicates the live site's Framer entrance animation
 * (`data-framer-appear-id`: opacity 0.001 → 1, translateY -40px → 0) with
 * a vanilla IntersectionObserver. Applied automatically to top-level
 * sections and card components sitewide — no per-component markup needed.
 */
export function initReveal(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const targets = document.querySelectorAll<HTMLElement>('main > section, main > article, [class$="-card"]');

  if (reduceMotion || !("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  targets.forEach((el) => el.classList.add("js-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  targets.forEach((el) => observer.observe(el));
}
