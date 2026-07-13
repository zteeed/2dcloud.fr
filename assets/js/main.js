/* 2D Cloud · interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------- Header: fond au scroll -------- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    if (window.scrollY > 24) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* -------- Thème clair / sombre -------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var applyTheme = function (t) {
    root.setAttribute("data-theme", t);
    if (themeMeta) themeMeta.setAttribute("content", t === "dark" ? "#081123" : "#0a1b3d");
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      themeBtn.setAttribute("aria-label", t === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
    }
  };
  applyTheme(root.getAttribute("data-theme") || "light");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      applyTheme(next);
    });
  }

  /* -------- Menu mobile -------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");
  var closeMenu = function () {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir le menu");
  };
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* -------- Carrousel 01 → 05 -------- */
  (function initCarousel() {
    var carousel = document.getElementById("carousel");
    if (!carousel) return;
    var track = document.getElementById("carouselTrack");
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".carousel__dot"));
    var progress = carousel.querySelector(".carousel__progress-bar");
    var btnPrev = document.getElementById("carouselPrev");
    var btnNext = document.getElementById("carouselNext");
    var btnPlay = document.getElementById("carouselPlay");
    var INTERVAL = 7000;

    var viewport = carousel.querySelector(".carousel__viewport");
    var index = 0;
    var playing = !reduceMotion;
    var hovering = false;
    var elapsed = 0;
    var last = 0;
    var raf = null;

    // Ajuste la hauteur du carrousel au volet actif (évite le vide + les contrôles hors écran)
    function setHeight() {
      var active = slides[index];
      if (active) viewport.style.height = active.offsetHeight + "px";
    }
    function render() {
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === index);
        s.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-current", i === index ? "true" : "false");
      });
      setHeight();
    }
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      elapsed = 0;
      render();
    }
    function updatePlayBtn() {
      if (!btnPlay) return;
      btnPlay.setAttribute("aria-pressed", playing ? "true" : "false");
      btnPlay.setAttribute("aria-label", playing ? "Mettre en pause le carrousel" : "Lancer le carrousel");
    }

    function frame(ts) {
      if (!last) last = ts;
      var dt = Math.min(ts - last, 64);
      last = ts;
      if (playing && !hovering && !document.hidden) {
        elapsed += dt;
        if (elapsed >= INTERVAL) { elapsed = 0; goTo(index + 1); }
      }
      if (progress) progress.style.transform = "scaleX(" + Math.min(elapsed / INTERVAL, 1) + ")";
      raf = requestAnimationFrame(frame);
    }

    // Contrôles
    if (btnNext) btnNext.addEventListener("click", function () { goTo(index + 1); });
    if (btnPrev) btnPrev.addEventListener("click", function () { goTo(index - 1); });
    dots.forEach(function (d) {
      d.addEventListener("click", function () { goTo(parseInt(d.getAttribute("data-i"), 10)); });
    });
    if (btnPlay) {
      btnPlay.addEventListener("click", function () {
        playing = !playing;
        if (playing) { last = 0; }
        updatePlayBtn();
        if (progress && !playing) { /* fige la barre */ }
      });
    }

    // Pause quand on survole/focus les volets, mais PAS les contrôles,
    // sinon cliquer sur ▶ focus le bouton et empêche la reprise.
    viewport.addEventListener("mouseenter", function () { hovering = true; });
    viewport.addEventListener("mouseleave", function () { hovering = false; last = 0; });
    viewport.addEventListener("focusin", function () { hovering = true; });
    viewport.addEventListener("focusout", function () { hovering = false; last = 0; });

    // Clavier
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { goTo(index + 1); }
      else if (e.key === "ArrowLeft") { goTo(index - 1); }
    });

    // Swipe tactile
    var x0 = null;
    track.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    track.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 50) { goTo(index + (dx < 0 ? 1 : -1)); }
      x0 = null;
    });

    // Liens internes → aller au bon volet
    var idToIndex = {};
    slides.forEach(function (s, i) { if (s.id) idToIndex[s.id] = i; });
    idToIndex.services = idToIndex["service-postes"];
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id in idToIndex) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          goTo(idToIndex[id]);
          carousel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          if (menu && menu.classList.contains("is-open")) closeMenu();
        });
      }
    });

    updatePlayBtn();
    render();
    window.addEventListener("resize", setHeight, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeight);
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  })();

  /* -------- Reveal au scroll (éléments hors carrousel) -------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------- Année du footer (fallback client) -------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
