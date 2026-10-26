/* =========================================================
   RusianArt — perilaku halaman
   Semua animasi hanya menyentuh transform & opacity (GPU),
   satu loop rAF, dan berhenti total saat tidak terlihat.
   ========================================================= */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("js");

  var hemat = false;
  try {
    var core = navigator.hardwareConcurrency || 8;
    var mem = navigator.deviceMemory || 8;
    var gerakMinim = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hematData = navigator.connection && (navigator.connection.saveData ||
      /(^|-)2g/.test(navigator.connection.effectiveType || ""));
    hemat = gerakMinim || hematData || core <= 4 || mem <= 4;
  } catch (e) { /* biarkan normal */ }
  if (hemat) html.classList.add("mode-hemat");

  /* ---------- layar pembuka ---------- */
  var pembuka = document.getElementById("pembuka");
  var mauLangsung = location.search.indexOf("langsung") > -1;
  if (hemat || mauLangsung) {
    // HP lemot / gerak minim / ?langsung: langsung masuk tanpa seremoni
    html.classList.add("lompati-pembuka");
  } else {
    // kunci gulir selama koreografi pembuka (~1,4 dtk)
    html.classList.add("kunci");
    window.setTimeout(function () {
      html.classList.remove("kunci");
    }, 1450);
    if (pembuka) {
      pembuka.addEventListener("click", function () {
        html.classList.add("lompati-pembuka");
        html.classList.remove("kunci");
      });
    }
  }

  /* ---------- tahun di footer ---------- */
  var tahun = document.getElementById("tahun");
  if (tahun) tahun.textContent = new Date().getFullYear();

  /* ---------- bayangan nav saat menggulir ---------- */
  var nav = document.getElementById("nav");
  var cekGulir = false;
  window.addEventListener("scroll", function () {
    if (cekGulir) return;
    cekGulir = true;
    requestAnimationFrame(function () {
      nav.classList.toggle("gulir", window.scrollY > 12);
      cekGulir = false;
    });
  }, { passive: true });

  /* ---------- sorot menu sesuai seksi yang terlihat ---------- */
  var tautanMenu = Array.prototype.slice.call(document.querySelectorAll(".menu a"));
  var seksi = tautanMenu.map(function (a) {
    return document.getElementById(a.getAttribute("href").slice(1));
  }).filter(Boolean);

  if ("IntersectionObserver" in window && seksi.length) {
    var sorot = new IntersectionObserver(function (entri) {
      entri.forEach(function (en) {
        if (!en.isIntersecting) return;
        tautanMenu.forEach(function (a) {
          a.classList.toggle("aktif", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    seksi.forEach(function (s) { sorot.observe(s); });
  }

  /* ---------- cadangan bila foto belum ada ---------- */
  function pasangCadangan() {
    var semua = document.querySelectorAll(".paper-isi img, .kartu-gambar img, .foto-bingkai img");
    Array.prototype.forEach.call(semua, function (img) {
      function gagal() {
        var wadah = img.closest(".paper, .kartu, .foto-bingkai");
        if (wadah) wadah.classList.add(wadah.classList.contains("foto-bingkai") ? "foto-kosong" : "kosong");
        img.remove();
      }
      img.addEventListener("error", gagal, { once: true });
      if (img.complete && img.naturalWidth === 0) gagal();
    });
  }
  pasangCadangan();

  /* ---------- panggung 3D: tarik untuk memutar ---------- */
  var scene = document.getElementById("scene");
  var stage = document.getElementById("stage");
  var hint = document.getElementById("dragHint");

  if (scene && stage && !hemat) {
    var ry = -16, rx = 9;        // sudut saat ini
    var tRy = -16, tRx = 9;      // sudut target
    var vel = 0;                 // kecepatan lempar (inertia)
    var tarik = false;
    var x0 = 0, y0 = 0;
    var interaksiTerakhir = 0;
    var parX = 0, tParX = 0;     // parallax mouse
    var parY = 0, tParY = 0;
    var jalan = true;            // loop hidup?

    stage.classList.add("aktif-3d");

    function terapkan() {
      stage.style.transform =
        "rotateX(" + (rx + parX).toFixed(2) + "deg) rotateY(" + (ry + parY).toFixed(2) + "deg)";
    }

    function putaran() {
      if (!jalan) return;
      if (!tarik) {
        tRy += vel;                 // lemparan
        vel *= 0.93;
        if (Math.abs(vel) < 0.01) vel = 0;
        // berputar pelan saat dibiarkan
        if (!vel && performance.now() - interaksiTerakhir > 1800) tRy += 0.055;
      }
      ry += (tRy - ry) * 0.09;
      rx += (tRx - rx) * 0.09;
      parX += (tParX - parX) * 0.06;
      parY += (tParY - parY) * 0.06;
      terapkan();
      requestAnimationFrame(putaran);
    }

    scene.addEventListener("pointerdown", function (e) {
      tarik = true;
      x0 = e.clientX; y0 = e.clientY;
      interaksiTerakhir = performance.now();
      if (hint) hint.classList.add("selesai");
      if (scene.setPointerCapture) {
        try { scene.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    scene.addEventListener("pointermove", function (e) {
      if (!tarik) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = e.clientX; y0 = e.clientY;
      tRy += dx * 0.38;
      tRx = Math.max(-22, Math.min(22, tRx - dy * 0.16));
      vel = dx * 0.12;
      interaksiTerakhir = performance.now();
    });
    function lepas() { tarik = false; interaksiTerakhir = performance.now(); }
    scene.addEventListener("pointerup", lepas);
    scene.addEventListener("pointercancel", lepas);

    // parallax halus mengikuti mouse (hanya perangkat dengan kursor)
    if (window.matchMedia("(pointer: fine)").matches) {
      var hero = document.getElementById("beranda");
      hero.addEventListener("mousemove", function (e) {
        var r = scene.getBoundingClientRect();
        tParY = ((e.clientX - r.left) / r.width - 0.5) * 10;
        tParX = ((e.clientY - r.top) / r.height - 0.5) * -7;
      }, { passive: true });
      hero.addEventListener("mouseleave", function () { tParX = 0; tParY = 0; });
    }

    // hentikan total saat tab tak aktif ATAU panggung tak terlihat
    function aturJalan(hidup) {
      if (hidup && !jalan) { jalan = true; requestAnimationFrame(putaran); }
      if (!hidup) jalan = false;
    }
    document.addEventListener("visibilitychange", function () {
      aturJalan(!document.hidden);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        aturJalan(en[0].isIntersecting && !document.hidden);
      }, { threshold: 0.02 }).observe(scene);
    }

    requestAnimationFrame(putaran);
  }

  /* ---------- kartu karya: efek miring mengikuti kursor ---------- */
  if (!hemat && window.matchMedia("(pointer: fine)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".kartu"), function (kartu) {
      kartu.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = kartu.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        kartu.style.setProperty("--ty", (px * 8).toFixed(2) + "deg");
        kartu.style.setProperty("--tx", (py * -7).toFixed(2) + "deg");
      }, { passive: true });
      kartu.addEventListener("pointerleave", function () {
        kartu.style.setProperty("--tx", "0deg");
        kartu.style.setProperty("--ty", "0deg");
      });
    });
  }

  /* ---------- saring kategori karya ---------- */
  var tombolFilter = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
  var kartuSemua = Array.prototype.slice.call(document.querySelectorAll(".kartu"));
  var pesanKosong = document.getElementById("galeriKosong");

  tombolFilter.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tombolFilter.forEach(function (b) {
        var aktif = b === btn;
        b.classList.toggle("aktif", aktif);
        b.setAttribute("aria-pressed", String(aktif));
      });
      var f = btn.dataset.filter;
      var terlihat = 0;
      kartuSemua.forEach(function (k) {
        var cocok = f === "semua" || k.dataset.kategori === f;
        k.classList.toggle("pindah", !cocok);
        if (cocok) terlihat++;
      });
      if (pesanKosong) pesanKosong.hidden = terlihat > 0;
    });
  });

  /* ---------- lightbox pratinjau karya ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbJudul = document.getElementById("lbJudul");
  var lbMedium = document.getElementById("lbMedium");

  function tutupLb() {
    if (typeof lb.close === "function") { if (lb.open) lb.close(); }
    else { lb.removeAttribute("open"); }
    document.body.style.overflow = "";
  }

  if (lb && lbImg) {
    Array.prototype.forEach.call(document.querySelectorAll(".kartu-btn"), function (btn) {
      btn.addEventListener("click", function () {
        lbImg.src = btn.dataset.img;
        lbImg.alt = btn.querySelector("img") ? btn.querySelector("img").alt : btn.dataset.title;
        lbJudul.textContent = btn.dataset.title;
        lbMedium.textContent = btn.dataset.medium;
        if (typeof lb.showModal === "function") { lb.showModal(); }
        else { lb.setAttribute("open", ""); }
        document.body.style.overflow = "hidden";
      });
    });
    document.querySelector(".lb-tutup").addEventListener("click", tutupLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) tutupLb(); });
  }

  /* ---------- kemunculan elemen + coretan tergambar ---------- */
  if ("IntersectionObserver" in window) {
    var muncul = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add("muncul"); muncul.unobserve(x.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".anim-muncul, .coret").forEach(function (el) { muncul.observe(el); });
  } else {
    document.querySelectorAll(".anim-muncul, .coret").forEach(function (el) { el.classList.add("muncul"); });
  }
})();
