/**
 * UiEdge Portfolio Deck — navigation, responsive fit, and PDF export.
 * Loaded client-side only on /portfolio.
 */

declare global {
  interface Window {
    html2canvas: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf: { jsPDF: new (opts?: Record<string, unknown>) => JsPdfInstance };
  }
}

interface JsPdfInstance {
  addPage: (format: number[], orientation: string) => void;
  addImage: (img: string, type: string, x: number, y: number, w: number, h: number) => void;
  save: (filename: string) => void;
}

const SLIDE_W = 1280;
const SLIDE_H = 720;

function fitSlides(): void {
  const scale = Math.min(1, (window.innerWidth - 24) / SLIDE_W, (window.innerHeight - 24) / SLIDE_H);
  document.documentElement.style.setProperty("--slide-scale", String(scale));
}

function initFit(): void {
  fitSlides();
  window.addEventListener("resize", fitSlides);
}

function initNav(): void {
  const viewports = Array.from(document.querySelectorAll<HTMLElement>(".slide-viewport"));
  const deck = document.querySelector<HTMLElement>(".deck");
  const counter = document.querySelector<HTMLElement>("[data-deck-counter]");
  if (!deck || viewports.length === 0) return;

  function currentIndex(): number {
    const scrollTop = deck!.scrollTop;
    let closest = 0;
    let closestDist = Infinity;
    viewports.forEach((v, i) => {
      const dist = Math.abs(v.offsetTop - scrollTop);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function goTo(index: number): void {
    const clamped = Math.max(0, Math.min(viewports.length - 1, index));
    viewports[clamped].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateCounter(): void {
    if (!counter) return;
    counter.textContent = `${String(currentIndex() + 1).padStart(2, "0")} / ${String(viewports.length).padStart(2, "0")}`;
  }

  document.querySelector("[data-deck-prev]")?.addEventListener("click", () => goTo(currentIndex() - 1));
  document.querySelector("[data-deck-next]")?.addEventListener("click", () => goTo(currentIndex() + 1));

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      goTo(currentIndex() + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      goTo(currentIndex() - 1);
    }
  });

  deck.addEventListener("scroll", () => updateCounter(), { passive: true });
  updateCounter();
}

async function exportPdf(btn: HTMLButtonElement): Promise<void> {
  const progress = document.querySelector<HTMLElement>("[data-deck-progress]");
  const allButtons = document.querySelectorAll<HTMLButtonElement>("[data-deck-download]");

  const originalLabel = btn.innerHTML;
  allButtons.forEach((b) => (b.disabled = true));

  const slides = Array.from(document.querySelectorAll<HTMLElement>(".slide"));

  // Force full-scale, unscaled capture regardless of current viewport size.
  const prevScale = document.documentElement.style.getPropertyValue("--slide-scale");
  document.documentElement.style.setProperty("--slide-scale", "1");

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [SLIDE_W, SLIDE_H] });

    for (let i = 0; i < slides.length; i++) {
      btn.innerHTML = `Preparing PDF… ${i + 1}/${slides.length}`;
      if (progress) progress.style.width = `${((i + 1) / slides.length) * 100}%`;

      const canvas = await window.html2canvas(slides[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: SLIDE_W,
        windowHeight: SLIDE_H,
      });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], "landscape");
      pdf.addImage(img, "JPEG", 0, 0, SLIDE_W, SLIDE_H);
    }

    pdf.save("UiEdge-Portfolio-2026.pdf");
  } finally {
    document.documentElement.style.setProperty("--slide-scale", prevScale || "1");
    fitSlides();
    allButtons.forEach((b) => (b.disabled = false));
    btn.innerHTML = originalLabel;
    if (progress) progress.style.width = "0%";
  }
}

function initDownload(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-deck-download]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void exportPdf(btn);
    });
  });
}

export function initDeck(): void {
  initFit();
  initNav();
  initDownload();
}
