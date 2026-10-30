/* =========================================================
   Meja Admin — RusianArt
   Klien gudang Supabase memakai fetch biasa (tanpa pustaka).
   Yang ditulis (unggah/hapus) selalu lewat akun login; orang
   lain tidak bisa, karena aturannya dipaksa di sisi gudang.

   GUDANG_URL & GUDANG_KUNCI di bawah ← isi setelah gudang
   dibuat (lihat PANDUAN-GUDANG.md).
   ========================================================= */
(function () {
  "use strict";

  var GUDANG_URL = "https://yqlexaetlxhdcyjwjdwd.supabase.co";
  var GUDANG_KUNCI = "sb_publishable_4aW5cToMcJL1rnWoj3FYAA_Xbz2rxlK";
  // kalau kelak alamat ditempel lengkap dengan /rest/v1/, bagian itu dibuang otomatis:
  GUDANG_URL = GUDANG_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  var DASAR = GUDANG_URL;
  var URL_FOTO = DASAR + "/storage/v1/object/public/foto-karya/";
  var KUNCI_SESI = "rusianart-sesi";

  var KARYA_AWAL = [
    { judul: "Naruto & Kawan-Kawan",     kategori: "Sketsa",   media: "Pensil di atas kertas", berkas: "../images/karya-naruto.jpg" },
    { judul: "Spiderman Gantung",        kategori: "Ilusi 3D", media: "Pensil", coretan: "Pensil asli ikut terfoto — justru itu kuncinya.", berkas: "../images/karya-spiderman-gantung.jpg" },
    { judul: "Hiu & Ikan Kecil",         kategori: "Sketsa",   media: "Pensil", berkas: "../images/karya-hiu.jpg" },
    { judul: "Goku Terbang",             kategori: "Sketsa",   media: "Pensil", berkas: "../images/karya-goku-terbang.jpg" },
    { judul: "Spiderman Mengayun",       kategori: "Ilusi 3D", media: "Pensil", coretan: "Pensil asli ikut terfoto — justru itu kuncinya.", berkas: "../images/karya-spiderman-ayun.jpg" },
    { judul: "Goku Menembus Batu",       kategori: "Sketsa",   media: "Pensil", berkas: "../images/karya-goku-pukul.jpg" },
    { judul: "Educative Creative Smart", kategori: "Lettering", media: "Spidol papan tulis", berkas: "../images/karya-lettering.jpg" }
  ];

  function $(id) { return document.getElementById(id); }

  var layarAtur = $("layar-atur");
  var layarMasuk = $("layar-masuk");
  var layarAdmin = $("layar-admin");

  var kategoriDiGudang = [];   // untuk saran kategori
  var seedBerjalan = false;
  var pratinjauUrl = "";

  /* ---------- kecil-kecilan ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function status(id, teks, gagal) {
    var p = $(id);
    if (!p) return;
    p.textContent = teks;
    p.classList.toggle("gagal", gagal === "gagal");
  }
  function tombol(id, sibuk) {
    var b = $(id);
    if (b) b.disabled = !!sibuk;
  }
  function formatWaktu(iso) {
    try {
      var d = new Date(iso);
      var kini = new Date();
      var awalHari = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate()).getTime();
      var t = d.getTime();
      if (t >= awalHari) return "hari ini";
      if (t >= awalHari - 86400000) return "kemarin";
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d);
    } catch (e) { return ""; }
  }

  /* ---------- dialog konfirmasi (pengganti confirm bawaan) ---------- */
  var dk = $("dialog-konfirmasi");
  var janjiKonfirmasi = null;

  function tanya(teks, labelYa) {
    return new Promise(function (selesai) {
      $("dkTeks").textContent = teks;
      $("dkYa").textContent = labelYa || "Ya, lanjut";
      janjiKonfirmasi = selesai;
      if (typeof dk.showModal === "function") { dk.showModal(); }
      else { dk.setAttribute("open", ""); }
      $("dkTidak").focus();
    });
  }
  function jawab(hasil) {
    if (typeof dk.close === "function") { if (dk.open) dk.close(); }
    else { dk.removeAttribute("open"); }
    if (janjiKonfirmasi) { var s = janjiKonfirmasi; janjiKonfirmasi = null; s(hasil); }
  }
  if (dk) {
    $("dkYa").addEventListener("click", function () { jawab(true); });
    $("dkTidak").addEventListener("click", function () { jawab(false); });
    dk.addEventListener("click", function (e) { if (e.target === dk) jawab(false); });
    dk.addEventListener("cancel", function () { jawab(false); });
  }

  /* ---------- sesi login ---------- */
  var sesi = null;
  try { sesi = JSON.parse(localStorage.getItem(KUNCI_SESI) || "null"); } catch (e) { sesi = null; }

  function simpanSesi() { localStorage.setItem(KUNCI_SESI, JSON.stringify(sesi)); }
  function hapusSesi() { sesi = null; localStorage.removeItem(KUNCI_SESI); }

  function tampil(layar) {
    layarAtur.hidden = layar !== "atur";
    layarMasuk.hidden = layar !== "masuk";
    layarAdmin.hidden = layar !== "admin";
  }

  function tokenSegar() {
    if (!sesi) return Promise.reject(new Error("belum masuk"));
    if (Date.now() < (sesi.t || 0)) return Promise.resolve(sesi.a);
    status("status-masuk", "Menyambung ulang sesi…", "");
    return fetch(DASAR + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: GUDANG_KUNCI },
      body: JSON.stringify({ refresh_token: sesi.r })
    }).then(function (r) {
      if (!r.ok) throw new Error("sesi habis");
      return r.json();
    }).then(function (j) {
      sesi.a = j.access_token;
      sesi.r = j.refresh_token;
      sesi.t = Date.now() + ((j.expires_in || 3600) - 60) * 1000;
      simpanSesi();
      return sesi.a;
    });
  }

  /* ---------- masuk / keluar ---------- */
  $("form-masuk").addEventListener("submit", function (e) {
    e.preventDefault();
    status("status-masuk", "Memeriksa sandi…", "");
    tombol("tombol-masuk", true);
    var email = $("masuk-email").value.trim();
    var sandi = $("masuk-sandi").value;
    fetch(DASAR + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: GUDANG_KUNCI },
      body: JSON.stringify({ email: email, password: sandi })
    }).then(function (r) {
      tombol("tombol-masuk", false);
      if (!r.ok) {
        throw new Error(r.status === 400 || r.status === 422
          ? "Email atau sandi belum tepat."
          : "Gudang menolak sambungan (kode " + r.status + ").");
      }
      return r.json();
    }).then(function (j) {
      sesi = {
        a: j.access_token,
        r: j.refresh_token,
        t: Date.now() + ((j.expires_in || 3600) - 60) * 1000,
        email: (j.user && j.user.email) || email
      };
      simpanSesi();
      $("masuk-sandi").value = "";
      bukaMeja();
    }).catch(function (err) {
      tombol("tombol-masuk", false);
      status("status-masuk", err && err.message ? err.message : "Tidak bisa menghubungi gudang — periksa sambungan internet.", "gagal");
    });
  });

  $("tombol-keluar").addEventListener("click", function () {
    var t = sesi && sesi.a;
    hapusSesi();
    tampil("masuk");
    status("status-masuk", "Sampai jumpa di meja berikutnya!", "");
    if (t) {
      fetch(DASAR + "/auth/v1/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + t, apikey: GUDANG_KUNCI }
      }).catch(function () {});
    }
  });

  /* ---------- daftar karya ---------- */
  function gambarDaftar(rows) {
    kategoriDiGudang = [];
    var ada = {};
    rows.forEach(function (k) {
      var s = (k.kategori || "").toLowerCase();
      if (s && !ada[s]) { ada[s] = true; kategoriDiGudang.push(k.kategori); }
    });

    $("hitung-karya").textContent = rows.length ? "(" + rows.length + ")" : "";
    isiSaranKategori();

    /* stiker statistik */
    var stJumlah = $("stiker-jumlah");
    var stTerakhir = $("stiker-terakhir");
    if (stJumlah) stJumlah.textContent = rows.length + " karya di gudang";
    if (stTerakhir) {
      if (rows.length && rows[rows.length - 1].dibuat) {
        stTerakhir.textContent = "ditambah terakhir: " + formatWaktu(rows[rows.length - 1].dibuat);
        stTerakhir.hidden = false;
      } else {
        stTerakhir.hidden = true;
      }
    }

    /* karya bawaan sudah terunggah? (untuk peringatan lembut) */
    var sudahSeed = rows.some(function (k) {
      var j = (k.judul || "").toLowerCase();
      return KARYA_AWAL.some(function (a) { return a.judul.toLowerCase() === j; });
    });
    var pringatan = $("peringatan-seed");
    if (pringatan) pringatan.hidden = rows.length === 0 || sudahSeed;

    /* kondisi kosong */
    var meja = $("meja-kosong");
    if (meja) meja.hidden = rows.length > 0;
    if (!rows.length) {
      $("daftar-karya").innerHTML = "";
      status("status-daftar", "", "");
      return;
    }

    $("daftar-karya").innerHTML = rows.map(function (k) {
      var media = k.media ? k.kategori + " · " + k.media : k.kategori;
      return '<li class="baris-karya">' +
        '<span class="selotip-varian" aria-hidden="true"></span>' +
        '<img src="' + esc(URL_FOTO + k.foto) + '" alt="" loading="lazy" decoding="async">' +
        '<div class="bk-teks"><b>' + esc(k.judul) + "</b><span>" + esc(media) + "</span></div>" +
        '<button class="tombol-hapus" type="button" data-id="' + esc(k.id) + '" data-foto="' + esc(k.foto) + '" aria-label="Hapus karya ' + esc(k.judul) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg> hapus</button>' +
        "</li>";
    }).join("");
    status("status-daftar", "", "");
  }

  function muatDaftar() {
    return fetch(DASAR + "/rest/v1/karya?select=*&order=dibuat.asc", { headers: { apikey: GUDANG_KUNCI } })
      .then(function (r) {
        if (!r.ok) throw new Error("Gudang tak merespons (kode " + r.status + ").");
        return r.json();
      })
      .then(function (rows) { gambarDaftar(rows || []); return rows || []; })
      .catch(function (err) {
        status("status-daftar", err && err.message ? err.message : "Tidak bisa menghubungi gudang.", "gagal");
        return [];
      });
  }

  $("daftar-karya").addEventListener("click", function (e) {
    var btn = e.target.closest(".tombol-hapus");
    if (!btn) return;
    hapusKarya(btn.dataset.id, btn.dataset.foto);
  });

  function hapusKarya(id, foto) {
    tanya("Hapus karya ini? Kartunya juga hilang dari galeri pengunjung.", "Ya, hapus").then(function (ya) {
      if (!ya) return;
      tokenSegar().then(function (token) {
      return fetch(DASAR + "/storage/v1/object/foto-karya/" + encodeURIComponent(foto), {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
    }).catch(function () { /* foto mungkin sudah tak ada — lanjut hapus datanya */ })
      .then(function () {
        return tokenSegar();
      }).then(function (token) {
        return fetch(DASAR + "/rest/v1/karya?id=eq." + encodeURIComponent(id), {
          method: "DELETE",
          headers: { apikey: GUDANG_KUNCI, Authorization: "Bearer " + token }
        });
      }).then(function (r) {
        if (!r.ok) throw new Error("Gagal menghapus (kode " + r.status + ").");
        status("status-daftar", "Karya dihapus. Kartunya juga hilang dari galeri pengunjung.", "");
        muatDaftar();
      }).catch(function (err) {
        status("status-daftar", err && err.message ? err.message : "Gagal menghapus — coba lagi.", "gagal");
      });
      });
  }

  /* ---------- foto: padatkan di HP, lalu unggah ---------- */
  function padatkan(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        try {
          var maks = 1200;
          var skala = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
          var kanvas = document.createElement("canvas");
          kanvas.width = Math.max(1, Math.round(img.naturalWidth * skala));
          kanvas.height = Math.max(1, Math.round(img.naturalHeight * skala));
          kanvas.getContext("2d").drawImage(img, 0, 0, kanvas.width, kanvas.height);
          kanvas.toBlob(function (blob) {
            URL.revokeObjectURL(url);
            if (!blob) reject(new Error("Foto tidak bisa diproses — coba foto yang lain."));
            else resolve({ blob: blob, lebar: kanvas.width, tinggi: kanvas.height });
          }, "image/jpeg", 0.82);
        } catch (err) { URL.revokeObjectURL(url); reject(err); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Foto tidak bisa dibuka — pilih gambar yang lain.")); };
      img.src = url;
    });
  }

  function ukuranDari(blob) {
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(blob);
      img.onload = function () {
        var u = { lebar: img.naturalWidth, tinggi: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(u);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve({ lebar: null, tinggi: null }); };
      img.src = url;
    });
  }

  function unggahFoto(blob, nama) {
    return tokenSegar().then(function (token) {
      return fetch(DASAR + "/storage/v1/object/foto-karya/" + nama, {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": blob.type || "image/jpeg" },
        body: blob
      });
    }).then(function (r) {
      if (!r.ok) {
        throw new Error(r.status === 413
          ? "Fotonya terlalu besar untuk gudang — coba foto yang lebih ringan."
          : "Unggah foto gagal (kode " + r.status + ").");
      }
    });
  }

  function simpanBaris(k) {
    return tokenSegar().then(function (token) {
      return fetch(DASAR + "/rest/v1/karya", {
        method: "POST",
        headers: {
          apikey: GUDANG_KUNCI,
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify([k])
      });
    }).then(function (r) {
      if (!r.ok) throw new Error("Menyimpan data karya gagal (kode " + r.status + ").");
    });
  }

  $("form-tambah").addEventListener("submit", function (e) {
    e.preventDefault();
    var file = $("tambah-foto").files[0];
    if (!file) { status("status-tambah", "Pilih fotonya dulu, ya.", "gagal"); return; }
    var k = {
      judul: $("tambah-judul").value.trim(),
      kategori: $("tambah-kategori").value.trim(),
      media: $("tambah-media").value.trim() || null,
      coretan: $("tambah-coretan").value.trim() || null
    };
    if (!k.judul || !k.kategori) { status("status-tambah", "Judul dan kategori wajib diisi.", "gagal"); return; }

    tombol("tombol-unggah", true);
    status("status-tambah", "Memadatkan foto supaya ringan…", "");

    padatkan(file).then(function (hasil) {
      status("status-tambah", "Mengunggah fotonya…", "");
      k.foto = "karya-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
      k.lebar = hasil.lebar;
      k.tinggi = hasil.tinggi;
      return unggahFoto(hasil.blob, k.foto);
    }).then(function () {
      status("status-tambah", "Menyimpan data karya…", "");
      return simpanBaris(k);
    }).then(function () {
      status("status-tambah", "Beres! \u201c" + k.judul + "\u201d sudah tampil di galeri pengunjung 🎉", "");
      $("form-tambah").reset();
      $("pratinjau").hidden = true;
      if (pratinjauUrl) { URL.revokeObjectURL(pratinjauUrl); pratinjauUrl = ""; }
      muatDaftar();
    }).catch(function (err) {
      status("status-tambah", err && err.message ? err.message : "Ada kendala — coba lagi.", "gagal");
      // bila fotonya sudah terunggah tapi data gagal, buang fotonya agar tak jadi sampah
      if (k.foto) {
        tokenSegar().catch(function () { return null; }).then(function (t) {
          if (!t) return;
          fetch(DASAR + "/storage/v1/object/foto-karya/" + k.foto, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + t }
          }).catch(function () {});
        });
      }
    }).finally(function () {
      tombol("tombol-unggah", false);
    });
  });

  $("tambah-foto").addEventListener("change", function () {
    var f = this.files[0];
    var pv = $("pratinjau");
    if (!f) { pv.hidden = true; return; }
    status("status-tambah", "Menyiapkan pratinjau…", "");
    padatkan(f).then(function (h) {
      if (pratinjauUrl) URL.revokeObjectURL(pratinjauUrl);
      pratinjauUrl = URL.createObjectURL(h.blob);
      pv.src = pratinjauUrl;
      pv.hidden = false;
      status("status-tambah", "Foto siap: " + h.lebar + "×" + h.tinggi + " (±" + Math.round(h.blob.size / 1024) + " KB, ringan untuk HP).", "");
    }).catch(function (err) {
      pv.hidden = true;
      status("status-tambah", err && err.message ? err.message : "Foto tak bisa dibaca.", "gagal");
    });
  });

  /* ---------- saran kategori: bawaan + yang sudah ada di gudang ---------- */
  function isiSaranKategori() {
    var dl = $("saran-kategori");
    var dasar = ["Sketsa", "Ilusi 3D", "Lettering"];
    var semua = {}, urut = [];
    dasar.concat(kategoriDiGudang).forEach(function (k) {
      var s = k.toLowerCase();
      if (!semua[s]) { semua[s] = true; urut.push(k); }
    });
    dl.innerHTML = urut.map(function (k) { return '<option value="' + esc(k) + '"></option>'; }).join("");
  }

  /* ---------- unggah 7 karya bawaan sekali klik ---------- */
  $("tombol-seed").addEventListener("click", function () {
    if (seedBerjalan) return;
    muatDaftar().then(function (rows) {
      var judulAda = {};
      rows.forEach(function (k) { judulAda[(k.judul || "").toLowerCase()] = true; });
      var sisa = KARYA_AWAL.filter(function (k) { return !judulAda[k.judul.toLowerCase()]; });
      if (!sisa.length) {
        status("status-daftar", "Semua karya awal sudah ada di gudang ✔", "");
        return;
      }
      tanya("Unggah " + sisa.length + " karya bawaan ke gudang sekarang?", "Ya, unggah").then(function (ya) {
        if (!ya) return;
        seedBerjalan = true;
        tombol("tombol-seed", true);
        prosesSeed(sisa, 0);
      });
    });
  });

  function prosesSeed(sisa, i) {
    if (i >= sisa.length) {
      seedBerjalan = false;
      tombol("tombol-seed", false);
      status("status-daftar", "Selesai! Semua karya awal kini disimpan di gudang 🎉", "");
      muatDaftar();
      return;
    }
    var k = sisa[i];
    status("status-daftar", "Mengunggah " + (i + 1) + "/" + sisa.length + " — " + k.judul + "…", "");
    fetch(k.berkas).then(function (r) {
      if (!r.ok) throw new Error("Berkas " + k.berkas + " tak bisa dibaca.");
      return r.blob();
    }).then(function (blob) {
      return ukuranDari(blob).then(function (u) {
        var nama = "karya-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
        var baris = {
          judul: k.judul, kategori: k.kategori, media: k.media, coretan: k.coretan || null,
          foto: nama, lebar: u.lebar, tinggi: u.tinggi
        };
        return unggahFoto(blob, nama).then(function () { return simpanBaris(baris); });
      });
    }).then(function () {
      prosesSeed(sisa, i + 1);
    }).catch(function (err) {
      seedBerjalan = false;
      tombol("tombol-seed", false);
      var pesan = (err && err.message === "Failed to fetch")
        ? "Tombol ini hanya bisa jalan dari website yang sudah online (bukan dari berkas di komputer). Buka alamat admin di GitHub Pages, lalu ulangi."
        : (err && err.message ? err.message : "Gagal — jalankan tombol ini lagi untuk melanjutkan.");
      status("status-daftar", pesan + " (berhenti saat \u201c" + k.judul + "\u201d — yang sudah masuk tidak diulang.)", "gagal");
    });
  }

  /* ---------- start ---------- */
  if (!GUDANG_URL || !GUDANG_KUNCI) {
    tampil("atur");
    return;
  }
  if (sesi) {
    tokenSegar().then(function () { bukaMeja(); }).catch(function () {
      hapusSesi();
      tampil("masuk");
    });
  } else {
    tampil("masuk");
  }

  function bukaMeja() {
    tampil("admin");
    if (sesi && sesi.email) $("admin-halo").textContent = "Selamat datang kembali, " + sesi.email + " 👋";
    muatDaftar();
  }
})();
