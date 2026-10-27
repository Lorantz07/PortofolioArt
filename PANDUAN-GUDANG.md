# 🎨 Panduan Gudang Karya — RusianArt

Panduan ini menyiapkan **"gudang karya"** supaya **Pak Rusian bisa menambah karyanya
sendiri** dari HP — tanpa menyentuh kode sedetik pun — sementara **pengunjung tetap
hanya bisa melihat**.

Ringkasnya:

```
Pak Rusian ──(login di halaman admin)──▶ menambah karya ──▶ GUDANG (Supabase, gratis)
Pengunjung ──(membuka website)──────────▶ galeri mengambil karya ◀── GUDANG
```

Website tetap tinggal di GitHub Pages seperti sekarang. Kalau gudang sedang tak bisa
dihubungi, galeri otomatis memakai **karya bawaan** yang sudah tertanam — website
tidak pernah tampil rusak.

---

## Langkah 1 — Buat gudangnya (± 5 menit)

1. Buka **supabase.com** → **Start your project** → daftar memakai
   **arofikrosian@gmail.com** (boleh lewat akun Google). Gratis, tanpa kartu.
2. Setelah masuk, klik **New project**:
   - Name: `rusianart`
   - Database Password: klik **Generate a password** → **salin dan simpan** di catatan
     (jarang dipakai, tapi penting)
   - Region: **Singapore** (paling dekat dengan Indonesia)
   - Klik **Create new project** → tunggu ± 2 menit sampai siap.

## Langkah 2 — Pasang aturannya (± 1 menit)

1. Di menu kiri, pilih **SQL Editor** → **New query** (atau + New).
2. Buka berkas **`supabase-setup.sql`** dari folder ini, **salin seluruh isinya**,
   tempel ke SQL Editor, klik **Run**.
3. Muncul "Success. No rows returned" — berarti aturan gudang sudah terpasang ✅

## Langkah 3 — Buat akun login untuk Pak Rusian (± 2 menit)

1. Menu kiri: **Authentication** → tab **Users** → **Add user** → **Create new user**.
2. Email: `arofikrosian@gmail.com` — atau email lain yang mau dipakai bapak.
3. Sandi: buat yang mudah diingat bapak (tulis di catatan!). **Auto Confirm User** dinyalakan.
4. Klik **Create user**. Ini satu-satunya kunci untuk menambah karya.

## Langkah 4 — Tutup pintu pendaftaran mandiri (± 1 menit)

Supaya tidak ada orang lain bisa membuat akun di gudang kita:

1. **Authentication** → **Sign In / Providers** (atau **Providers** → Email).
2. Matikan pilihan **Allow new users to sign up** (atau **Disable new user signups**).

## Langkah 5 — Serahkan alamat gudang ke website (± 3 menit)

1. Menu kiri pojok: **Project Settings** (ikon ⚙) → **API** (atau **Data API**).
2. Salin dua hal:
   - **Project URL** — bentuknya `https://xxxx.supabase.co`
   - **anon public** — kunci panjang berawalan `eyJ...` (yang **anon**, BUKAN
     `service_role`!)
3. Tempel ke **dua berkas** yang sama-sama berisi kata `GANTI`:
   - `script.js` → baris `GUDANG_URL` dan `GUDANG_KUNCI` di bagian atas
   - `admin/admin.js` → baris yang sama persis

> Kunci *anon* memang dirancang boleh terlihat publik — yang menjaga tulisan adalah
> aturan server dari Langkah 2 + sandi bapak dari Langkah 3.

## Langkah 6 — Terbitkan

Bilang "done", semua akan di-commit & di-push. Setelah online:

1. Buka **`https://lorantz07.github.io/PortofolioArt/admin/`** → masuk dengan akun
   Langkah 3.
2. Klik tombol **"Unggah 7 karya awal"** sekali — tujuh karya yang sekarang ikut
   pindah ke gudang (butuh website sudah online; tombol ini tidak bisa jalan dari
   file yang dibuka langsung di komputer).
3. Selesai — galeri kini diatur dari gudang ✅

---

## 🖌️ Sehari-hari untuk Pak Rusian (cukup hafal ini)

1. Buka alamat `…/admin/` di HP (boleh disimpan ke layar utama/bookmark).
2. Masuk sekali — sesi diingat sampai berminggu-minggu.
3. **Tambah karya baru** → pilih foto dari galeri HP → tulis judul → pilih kategori
   (atau ketik kategori baru, mis. *Arsiran Pensil*) → **Simpan ke galeri**.
   Foto otomatis dipadatkan supaya ringan; karya langsung tampil di website.
4. Menghapus karya: tekan **hapus** di daftarnya.

Kategori baru yang bapak tulis otomatis menjadi **tombol saring baru** di galeri
pengunjung — klik chip itu, semua karya satu kategori tampil.

## 🔧 Kalau ada masalah

| Gejala | Artinya | Obatnya |
|---|---|---|
| Halaman admin bilang "Gudang belum dipasang" | Alamat/kunci belum diisi di `admin/admin.js` | Ulangi Langkah 5 |
| Galeri tidak berubah setelah menambah karya | `script.js` belum diisi / belum di-push | Ulangi Langkah 5 di `script.js`, lalu push |
| "Email atau sandi belum tepat" | Sandi salah / akun belum dibuat | Cek Langkah 3; lupa sandi? Buat ulang di **Authentication → Users → user bapak → Reset password** |
| Unggah foto gagal | Sambungan / kuota foto penuh | Coba lagi; cek kuota di dashboard (Storage) |
| Galeri tampil karya lama saja | Gudang sedang tak terjangkau | Website aman — galeri memakai karya bawaan; nanti menyala sendiri |

## 🔒 Keamanan & biaya, dalam satu tarikan napas

- Pengunjung **tidak mungkin** menambah/menghapus: aturan "hanya yang login boleh
  menulis" dijalankan di server gudang, bukan sekadar tombol tersembunyi.
- Halaman admin **tidak diindeks** mesin pencari (`noindex`) dan tidak tercantum di menu.
- Gratis: 1 GB foto (≈ ribuan karya — foto dipadatkan ±200–400 KB per karya),
  kuota pembacaan longgar untuk website portofolio.
- Karya bawaan (7 karya) tetap tampil walau internet/gudang bermasalah — tanpa gudang
  pun website tetap utuh seperti sekarang.
