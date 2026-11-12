(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("motion-ready");
  requestAnimationFrame(() => document.body.classList.add("page-ready"));

  // A slim reading indicator shared by every inner page.
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--progress", available > 0 ? Math.min(scrollY / available, 1) : 0);
  };
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress);
  updateProgress();
  const siteHeader = document.querySelector(".site-header");
  const searchToggle = document.querySelector(".search-toggle");
  const searchPanel = document.querySelector(".header-search");
  const searchClose = document.querySelector(".search-close");
  const searchInput = document.querySelector(".header-search input");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileDrawer = document.querySelector(".mobile-drawer");
  const drawerBackdrop = document.querySelector(".drawer-backdrop");
  const drawerClose = document.querySelector(".drawer-close");

  const syncHeaderSpace = () => {
    if (!siteHeader) return;
    document.documentElement.style.setProperty("--header", siteHeader.offsetHeight + "px");
  };
  if (siteHeader) {
    const updateHeader = () => {
      siteHeader.classList.toggle("is-compact", window.scrollY > 48);
      syncHeaderSpace();
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", syncHeaderSpace);
    if ("ResizeObserver" in window) new ResizeObserver(syncHeaderSpace).observe(siteHeader);
    updateHeader();
  }

  const setSearch = (open) => {
    searchPanel?.classList.toggle("is-open", open);
    searchToggle?.setAttribute("aria-expanded", String(open));
    if (open) window.setTimeout(() => searchInput?.focus(), 80);
    else searchToggle?.focus();
  };
  searchToggle?.addEventListener("click", () => setSearch(!searchPanel.classList.contains("is-open")));
  searchClose?.addEventListener("click", () => setSearch(false));

  const setDrawer = (open) => {
    mobileDrawer?.classList.toggle("is-open", open);
    drawerBackdrop?.classList.toggle("is-open", open);
    mobileDrawer?.setAttribute("aria-hidden", String(!open));
    menuToggle?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) window.setTimeout(() => drawerClose?.focus(), 80);
    else menuToggle?.focus();
  };
  menuToggle?.addEventListener("click", () => setDrawer(true));
  drawerClose?.addEventListener("click", () => setDrawer(false));
  drawerBackdrop?.addEventListener("click", () => setDrawer(false));
  mobileDrawer?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setDrawer(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (mobileDrawer?.classList.contains("is-open")) setDrawer(false);
    else if (searchPanel?.classList.contains("is-open")) setSearch(false);
  });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links?.addEventListener("click", (event) => {
    if (event.target.closest("a")) links.classList.remove("open");
  });

  // Animate meaningful content without requiring animation classes in every page.
  const revealGroups = [
    ".section .section-head", ".section .split", ".facts .fact", ".cards .card",
    ".principles .principle", ".timeline .chapter", ".company", ".band",
    ".steps .step", ".job-card", ".process-card", ".cta", ".foot-grid > *"
  ];
  document.querySelectorAll(revealGroups.join(",")).forEach((el, index) => {
    el.classList.add("reveal");
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${(index % 4) * 70}ms`);
  });
  const reveals = [...document.querySelectorAll(".reveal")];
  const show = (el) => el.classList.add("in");
  if (reduced) document.querySelectorAll("video").forEach((video) => { video.removeAttribute("autoplay"); video.pause(); });
  if (reduced || !("IntersectionObserver" in window)) reveals.forEach(show);
  else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    reveals.forEach((el) => observer.observe(el));
  }

  const counters = [...document.querySelectorAll("[data-count]")];
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    if (reduced) {
      el.textContent = prefix + target.toLocaleString() + suffix;
      return;
    }
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / 1100, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && "IntersectionObserver" in window && !reduced) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  } else counters.forEach(runCount);

  // Gentle pointer depth for hero content and interactive cards.
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduced && finePointer) {
    const hero = document.querySelector(".hero");
    hero?.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--pointer-x", x.toFixed(3));
      hero.style.setProperty("--pointer-y", y.toFixed(3));
    });
    hero?.addEventListener("pointerleave", () => {
      hero.style.setProperty("--pointer-x", 0);
      hero.style.setProperty("--pointer-y", 0);
    });

    document.querySelectorAll(".card, .principle, .job-card, .process-card, .fact, .mini").forEach((card) => {
      card.classList.add("motion-card");
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--tilt-x", `${((0.5 - (event.clientY - rect.top) / rect.height) * 7).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${((((event.clientX - rect.left) / rect.width) - 0.5) * 7).toFixed(2)}deg`);
        card.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  // Three-dimensional company orbit used by the Our Group hero.
  const orbitCore = document.querySelector(".hero-group .core");
  const orbitNodes = orbitCore ? [...orbitCore.querySelectorAll(".node")] : [];
  if (orbitCore && orbitNodes.length === 4 && !reduced) {
    const desktopOrbit = window.matchMedia("(min-width: 1101px)");
    let orbitFrame = 0;
    let orbitStart = performance.now();
    const drawOrbit = (now) => {
      if (!desktopOrbit.matches) {
        orbitCore.classList.remove("orbit-3d");
        orbitNodes.forEach((node) => {
          node.style.transform = "";
          node.style.opacity = "";
          node.style.filter = "";
          node.style.zIndex = "";
        });
        orbitFrame = requestAnimationFrame(drawOrbit);
        return;
      }
      orbitCore.classList.add("orbit-3d");
      const elapsed = (now - orbitStart) / 1000;
      const radiusX = Math.min(210, orbitCore.clientWidth * 0.36);
      const radiusY = Math.min(155, orbitCore.clientHeight * 0.31);
      orbitNodes.forEach((node, index) => {
        const angle = elapsed * 0.28 + index * Math.PI / 2 - Math.PI * 0.75;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = 0.78 + depth * 0.28;
        const z = -90 + depth * 180;
        const tilt = Math.cos(angle) * -7;
        node.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${tilt}deg) scale(${scale})`;
        node.style.opacity = String(0.52 + depth * 0.48);
        node.style.filter = `brightness(${0.72 + depth * 0.38})`;
        node.style.zIndex = String(Math.round(2 + depth * 8));
      });
      orbitFrame = requestAnimationFrame(drawOrbit);
    };
    orbitFrame = requestAnimationFrame(drawOrbit);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(orbitFrame);
      else {
        orbitStart = performance.now();
        orbitFrame = requestAnimationFrame(drawOrbit);
      }
    });
  }

  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const go = () => {
    const offset = (document.querySelector(".site-header")?.offsetHeight || 110) + 12;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    root.style.scrollBehavior = previous;
  };
  target.classList.add("in", "landed");
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
  setTimeout(go, 180);
})();
