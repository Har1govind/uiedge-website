/**
 * fitText — vanilla implementation of Framer's `framer-fit-text` scaling.
 *
 * The live hero wordmark ("UiEdge") is rendered inside an SVG <foreignObject>
 * and scaled so the text always fills the container width. We replicate that
 * with a transform: scale() on the text element, keeping the layout box fixed.
 *
 * Usage:
 *   fitText(el, { minScale, maxScale })
 *
 * The element must contain the text (any display inline-block child is scaled).
 */

export interface FitTextOptions {
  minScale?: number;
  maxScale?: number;
}

export function fitText(el: HTMLElement, options: FitTextOptions = {}): () => void {
  const { minScale = 0.1, maxScale = 1 } = options;
  const textEl = el.querySelector<HTMLElement>("[data-fit-text]") ?? el;
  let scale = maxScale;

  const apply = () => {
    const parentWidth = el.clientWidth;
    const textWidth = textEl.scrollWidth;
    if (!parentWidth || !textWidth) return;
    scale = Math.min(maxScale, Math.max(minScale, parentWidth / textWidth));
    textEl.style.transform = `scale(${scale})`;
    // Preserve the scaled height so the layout doesn't collapse.
    el.style.height = `${textEl.offsetHeight * scale}px`;
  };

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
  ro?.observe(el);
  apply();

  // Re-measure once web fonts finish loading — the initial measurement can
  // happen against a fallback font, leaving the cached scale too large once
  // the real (often wider) glyphs swap in, clipping the text.
  document.fonts?.ready?.then(apply);

  return () => ro?.disconnect();
}
