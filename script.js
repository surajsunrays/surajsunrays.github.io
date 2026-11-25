document.getElementById("year").textContent = new Date().getFullYear();
const navigationLinks = document.querySelectorAll("nav a");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navigationLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    });
  },
  { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
);
document
  .querySelectorAll("section[id]")
  .forEach((section) => observer.observe(section));

// Animate metrics once on entry; static HTML remains readable without JavaScript.
const metrics = document.querySelector(".metrics");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const counters = Array.from(
  document.querySelectorAll("[data-counter]"),
  (element) => ({
    node: element.querySelector(".counter-value"),
    target: Number(element.dataset.counter),
    decimals: (element.dataset.counter.split(".")[1] || "").length,
  }),
);
let counterFrame;
let counterObserver;
const renderCounters = (progress) => {
  counters.forEach(({ node, target, decimals }) => {
    node.textContent = (target * progress).toFixed(decimals);
  });
};
if (metrics && !motionPreference.matches && "IntersectionObserver" in window) {
  counterObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      counterObserver.disconnect();
      if (motionPreference.matches) return;
      const duration = 1800;
      let startedAt;
      const tick = (now) => {
        startedAt ??= now;
        const progress = Math.min((now - startedAt) / duration, 1);
        renderCounters(1 - Math.pow(1 - progress, 3));
        if (progress < 1) counterFrame = requestAnimationFrame(tick);
      };
      renderCounters(0);
      counterFrame = requestAnimationFrame(tick);
    },
    { threshold: 0.3 },
  );
  counterObserver.observe(metrics);
}
motionPreference.addEventListener("change", (event) => {
  if (event.matches) {
    cancelAnimationFrame(counterFrame);
    counterObserver?.disconnect();
    renderCounters(1);
  }
});

// Decorative mouse halo: never intercepts clicks or replaces focus indicators.
const cursorMedia = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const cursorHalo = document.createElement('div');
cursorHalo.className = 'cursor-halo';
cursorHalo.setAttribute('aria-hidden', 'true');
document.body.append(cursorHalo);
let haloFrame = null;
let haloX = 0;
let haloY = 0;
let pointerX = 0;
let pointerY = 0;
let haloVisible = false;
function hideHalo() {
  cursorHalo.style.opacity = '0';
  haloVisible = false;
  cancelAnimationFrame(haloFrame);
  haloFrame = null;
}
function animateHalo() {
  haloX += (pointerX - haloX) * 0.28;
  haloY += (pointerY - haloY) * 0.28;
  cursorHalo.style.transform = `translate3d(${haloX}px, ${haloY}px, 0)`;
  if (Math.abs(pointerX - haloX) + Math.abs(pointerY - haloY) > 0.2) {
    haloFrame = requestAnimationFrame(animateHalo);
  } else {
    haloFrame = null;
  }
}
document.addEventListener('pointermove', (event) => {
  if (!cursorMedia.matches || event.pointerType !== 'mouse') {
    hideHalo();
    return;
  }
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!haloVisible) {
    haloX = pointerX;
    haloY = pointerY;
    cursorHalo.style.transform = `translate3d(${haloX}px, ${haloY}px, 0)`;
    cursorHalo.style.opacity = '1';
    haloVisible = true;
  }
  if (haloFrame === null) haloFrame = requestAnimationFrame(animateHalo);
}, { passive: true });
document.documentElement.addEventListener('pointerleave', hideHalo);
window.addEventListener('blur', hideHalo);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hideHalo();
});
cursorMedia.addEventListener('change', hideHalo);

// A stationary background grid revealed by a mouse spotlight.
const gridReveal = document.createElement('div');
gridReveal.className = 'grid-reveal';
gridReveal.setAttribute('aria-hidden', 'true');
document.body.prepend(gridReveal);
let gridFrame = null;
let gridX = 0;
let gridY = 0;
function hideGridReveal() {
  gridReveal.style.opacity = '0';
  cancelAnimationFrame(gridFrame);
  gridFrame = null;
}
document.addEventListener('pointermove', (event) => {
  if (!cursorMedia.matches || event.pointerType !== 'mouse') {
    hideGridReveal();
    return;
  }
  gridX = event.clientX;
  gridY = event.clientY;
  if (gridFrame !== null) return;
  gridFrame = requestAnimationFrame(() => {
    gridReveal.style.setProperty('--grid-x', `${gridX}px`);
    gridReveal.style.setProperty('--grid-y', `${gridY}px`);

    gridReveal.style.opacity = '1';
    gridFrame = null;
  });
}, { passive: true });
document.documentElement.addEventListener('pointerleave', hideGridReveal);
window.addEventListener('blur', hideGridReveal);
cursorMedia.addEventListener('change', hideGridReveal);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hideGridReveal();
});

// Delay ordinary mouse link activation briefly; preserve native link behavior.
let replayingLinkClick = false;
let fasteningLink = false;
document.addEventListener('click', (event) => {
  if (replayingLinkClick || event.defaultPrevented || event.detail === 0 ||
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey ||
      event.altKey || !cursorMedia.matches) return;
  const link = event.target.closest('a[href]');
  if (!link) return;
  if (fasteningLink) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  fasteningLink = true;
  const feedback = document.createElement('div');
  feedback.className = 'screw-feedback';
  feedback.setAttribute('aria-hidden', 'true');
  feedback.style.left = `${event.clientX}px`;
  feedback.style.top = `${event.clientY}px`;
  const head = document.createElement('span');
  head.className = 'screw-head';
  feedback.append(head);
  document.body.append(feedback);
  window.setTimeout(() => {
    feedback.remove();
    fasteningLink = false;
    replayingLinkClick = true;
    try { link.click(); } finally { replayingLinkClick = false; }
  }, 350);
});
