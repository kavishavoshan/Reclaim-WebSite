/* Site interactions (no external deps) */

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
}

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initThemeToggle() {
  setTheme(getPreferredTheme());

  const btn = $("#themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  });
}

function initYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function initSmoothScroll() {
  const behavior = prefersReducedMotion() ? "auto" : "smooth";

  $all('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      // Don't interfere with new-tab / modified clicks.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior, block: "start" });
      try {
        history.pushState(null, "", href);
      } catch {
        // ignore (some file:// contexts can be restrictive)
      }
    });
  });
}

function initActiveNav() {
  const links = $all(".nav-links a").filter((a) => a.getAttribute("href")?.startsWith("#"));
  if (!links.length) return;

  const byId = new Map();
  const order = [];
  links.forEach((a) => {
    const id = a.getAttribute("href")?.slice(1);
    if (!id) return;
    if (!byId.has(id)) {
      byId.set(id, a);
      order.push(id);
    }
  });

  const setCurrent = (id) => {
    if (!id || !byId.has(id)) return;
    links.forEach((a) => a.removeAttribute("aria-current"));
    byId.get(id).setAttribute("aria-current", "page");
  };

  /** Y position (viewport) where a section is considered "reached" — aligned with fixed header + scroll-padding */
  const getActivateY = () => {
    const header = document.querySelector(".site-header");
    const h = header ? header.getBoundingClientRect().height : 0;
    return h + 8;
  };

  const updateActive = () => {
    if (!order.length) return;

    const yLine = getActivateY();
    const docEl = document.documentElement;
    const scrollBottom = window.scrollY + window.innerHeight;
    const maxScroll = docEl.scrollHeight - window.innerHeight;
    const nearBottom = maxScroll > 0 && scrollBottom >= docEl.scrollHeight - 4;

    if (nearBottom) {
      setCurrent(order[order.length - 1]);
      return;
    }

    let current = order[0];
    for (const id of order) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= yLine) {
        current = id;
      }
    }
    setCurrent(current);
  };

  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updateActive();
    });
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("hashchange", scheduleUpdate, { passive: true });
  window.addEventListener("load", scheduleUpdate, { passive: true });

  // Initial: after layout (double rAF so header height and scroll position are stable)
  requestAnimationFrame(() => {
    requestAnimationFrame(scheduleUpdate);
  });
}

function initMobileNav() {
  const toggle = $(".nav-toggle");
  const linksWrap = $("#nav-links");
  if (!toggle || !linksWrap) return;

  const close = () => {
    linksWrap.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = linksWrap.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  linksWrap.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.tagName === "A") close();
  });

  document.addEventListener("click", (e) => {
    if (!linksWrap.classList.contains("open")) return;
    const withinNav = e.target && (linksWrap.contains(e.target) || toggle.contains(e.target));
    if (!withinNav) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Close menu when leaving mobile breakpoint.
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 760) close();
    },
    { passive: true }
  );
}

function initContactFormValidation() {
  const form = document.querySelector('#contact form');
  if (!form) return;

  const name = $("#name", form);
  const email = $("#email", form);
  const subject = $("#subject", form);
  const message = $("#message", form);
  const submitBtn = form.querySelector('button[type="submit"]');

  const ensureStatus = () => {
    let box = form.querySelector("[data-form-status]");
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-form-status", "true");
      box.setAttribute("role", "status");
      box.style.marginTop = "0.75rem";
      box.style.color = "var(--muted)";
      form.appendChild(box);
    }
    return box;
  };

  const setError = (el, msg) => {
    if (!el) return;
    el.setAttribute("aria-invalid", "true");
    el.dataset.error = msg;
  };

  const clearError = (el) => {
    if (!el) return;
    el.removeAttribute("aria-invalid");
    delete el.dataset.error;
  };

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(v || "").trim());

  const validate = () => {
    let ok = true;

    if (name) {
      const v = String(name.value || "").trim();
      if (v.length < 2) {
        setError(name, "Please enter your name (at least 2 characters).");
        ok = false;
      } else {
        clearError(name);
      }
    }

    if (email) {
      const v = String(email.value || "").trim();
      if (!emailOk(v)) {
        setError(email, "Please enter a valid email address.");
        ok = false;
      } else {
        clearError(email);
      }
    }

    if (subject) {
      const v = String(subject.value || "").trim();
      if (v.length < 3) {
        setError(subject, "Please enter a subject (at least 3 characters).");
        ok = false;
      } else {
        clearError(subject);
      }
    }

    if (message) {
      const v = String(message.value || "").trim();
      if (v.length < 10) {
        setError(message, "Please enter a message (at least 10 characters).");
        ok = false;
      } else {
        clearError(message);
      }
    }

    return ok;
  };

  const showFirstError = () => {
    const first = form.querySelector('[aria-invalid="true"]');
    if (!first) return null;
    first.focus?.();
    return first.dataset.error || "Please fix the highlighted fields.";
  };

  const status = ensureStatus();

  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t && t.matches(".form-control")) clearError(t);
    status.textContent = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";

    if (!validate()) {
      const msg = showFirstError();
      if (msg) status.textContent = msg;
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    status.textContent = "Success — your message was submitted (demo mode). We will contact you via email.";

    // Reset after a short delay to simulate submission success.
    window.setTimeout(() => {
      form.reset();
      if (submitBtn) submitBtn.disabled = false;
      status.textContent = "";
    }, 1400);
  });
}

function initBackToTop() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-ghost";
  btn.textContent = "Back to top";
  btn.setAttribute("aria-label", "Back to top");
  btn.style.position = "fixed";
  btn.style.right = "16px";
  btn.style.bottom = "16px";
  btn.style.zIndex = "120";
  btn.style.display = "none";
  btn.style.boxShadow = "var(--shadow-soft)";
  btn.style.background = "color-mix(in oklab, var(--bg) 70%, transparent)";
  btn.style.backdropFilter = "blur(10px)";

  btn.addEventListener("click", () => {
    const top = document.getElementById("home") || document.body;
    top.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  });

  document.body.appendChild(btn);

  const onScroll = () => {
    const show = window.scrollY > 520;
    btn.style.display = show ? "inline-flex" : "none";
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initRevealOnScroll() {
  const els = $all(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    },
    { root: null, threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  els.forEach((el) => io.observe(el));
}

function initArchOptionalImages() {
  $all("img.arch-optional-img").forEach((img) => {
    const fallback = img.nextElementSibling;
    if (!fallback || !fallback.classList.contains("arch-optional-fallback")) return;

    const showFallback = () => {
      img.setAttribute("hidden", "");
      fallback.removeAttribute("hidden");
    };

    img.addEventListener("error", showFallback);
    if (img.complete && img.naturalWidth === 0) showFallback();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initYear();
  initSmoothScroll();
  initActiveNav();
  initMobileNav();
  initContactFormValidation();
  initBackToTop();
  initRevealOnScroll();
  initArchOptionalImages();
});

