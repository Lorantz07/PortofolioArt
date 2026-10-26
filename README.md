# RusianArt — Website Portofolio

Website portofolio untuk **Rusian** (RusianArt), pelukis & seniman.
Tema: meja gambar — kertas hangat, biru muda & hijau, aksen coretan pensil.
Aksen 3D dibuat murni dengan CSS transform + JavaScript, **tanpa library**, jadi
tetap jalan walau offline dan ringan untuk HP dengan performa rendah.

## Isi folder

```
PortofolioArt/
├── index.html        ← halaman utama (konten & teks ada di sini)
├── style.css         ← tampilan & tema warna
├── script.js         ← 3D drag, filter karya, lightbox, optimasi otomatis
├── kompres-foto.ps1  ← alat bantu: mengecilkan ukuran foto karya
├── images/           ← SEMUA FOTO ADA DI SINI
│   └── asli/         ← foto asli sebelum dikompres (TIDAK perlu di-upload)
└── README.md
```

Foto yang dibutuhkan di folder `images/` (nama harus persis seperti ini, huruf kecil):

| File | Isi |
|---|---|
| `profil.jpg` | Foto Pak Rusian |
| `karya-naruto.jpg` | Sketsa Naruto & kawan-kawan |
| `karya-spiderman-gantung.jpg` | Ilusi 3D Spiderman gantung |
| `karya-hiu.jpg` | Sketsa hiu & ikan kecil |
| `karya-goku-terbang.jpg` | Sketsa Goku terbang |
| `karya-spiderman-ayun.jpg` | Ilusi 3D Spiderman mengayun |
| `karya-goku-pukul.jpg` | Sketsa Goku menembus batu |
| `karya-lettering.jpg` | Lettering "Educative Creative Smart" |

Jika sebuah foto belum ada, website **tidak rusak** — kotaknya otomatis
menampilkan tulisan "foto karya menyusul".

## Sebelum upload: kompres foto (disarankan)

Foto hasil kamera HP biasanya 2–5 MB per foto — bikin website lambat dibuka.
Setelah semua foto diletakkan di `images/`, jalankan di PowerShell (dari folder ini):

```powershell
powershell -ExecutionPolicy Bypass -File .\kompres-foto.ps1
```

Foto asli dipindah aman ke `images/asli/`, versi ringan (maks 1200px, ~200KB)
menggantikannya. `images/asli/` tidak perlu di-upload — sudah diblokir `.gitignore`.

## Cara upload ke GitHub Pages

1. Buka [github.com](https://github.com) → login → klik **+** (kanan atas) → **New repository**
2. Isi **Repository name**, mis. `rusianart` → klik **Create repository**
3. Di halaman repo baru, klik **uploading an existing file** (atau tombol *Add file → Upload files*)
4. **Seret semua isi folder ini** (index.html, style.css, script.js, README.md, dan folder `images`)
   ke area upload → tunggu selesai → klik **Commit changes**
5. Masuk **Settings → Pages** (menu kiri) → bagian *Build and deployment*:
   - Source: **Deploy from a branch**
   - Branch: **main** dan folder **/(root)** → klik **Save**
6. Tunggu 1–2 menit, muat ulang halaman — muncul alamat seperti:
   `https://usernameanda.github.io/rusianart/` → **website online!** 🎉

> Kalau kamu terbiasa dengan git, cara cepatnya:
> `git init`, `git add .`, `git commit -m "Portofolio RusianArt"`,
> hubungkan ke remote repo, lalu `git push -u origin main`.

## Kontak

Kontak website sudah terisi: WhatsApp (+62 838-9370-4733), email
(arofikrosian@gmail.com), dan Instagram (@rosian.anwar). Jika suatu saat
ingin mengganti, buka `index.html`, cari seksi `KONTAK`, lalu ubah tiga
tautan tombol di sana. Pratinjau berbagi (og:image/og:url) sudah memakai
alamat lengkap GitHub Pages.

## Menambah karya baru nantinya

1. Upload foto baru ke folder `images/` lewat web GitHub (mis. `karya-baru.jpg`)
2. Buka `index.html` → edit langsung di GitHub (ikon pensil) → temukan blok
   `<figure class="kartu" ...>` → salin satu blok, ubah nama file, judul, dan
   `data-kategori` (`sketsa` / `ilusi3d` / `lettering`) → **Commit changes**
3. Selesai — website otomatis terbarui
