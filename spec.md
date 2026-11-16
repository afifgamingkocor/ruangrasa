# Spesifikasi Website RuangRasa

Dokumen ini mendeskripsikan struktur, komponen, dan perilaku website **RuangRasa** sebagaimana
yang benar-benar ada di dalam folder proyek. Fungsinya sebagai acuan kerja: kalau ada
perubahan, ubah kode dan dokumen ini bersamaan.

- **Jenis proyek:** website statis multi-halaman (Proyek UAS Desain Web)
- **Bahasa antarmuka:** Indonesia
- **Status:** tanpa build step, tanpa backend, tanpa database

---

## 1. Tujuan & Ruang Lingkup

RuangRasa adalah toko online fiktif yang menjual benda kurasi untuk rumah, gaya hidup, dan
hadiah. Website berfungsi sebagai **katalog + etalase**, bukan toko transaksional.

**Termasuk dalam lingkup:**

- 7 halaman statis yang saling terhubung
- Filter, pencarian, dan pengurutan katalog di sisi klien
- Keranjang sisi-klien dengan penghitung, panel isi tas, dan penyimpanan `localStorage`
- Galeri produk dan pemilihan varian di halaman detail
- Form kontak dan newsletter dengan validasi HTML + umpan balik toast

**Di luar lingkup (memang tidak dibuat):**

- Checkout, pembayaran, ongkir, dan riwayat pesanan
- Login/registrasi dan akun pengguna
- Panel admin atau CMS
- Pengiriman form ke server (semua form hanya menampilkan toast)

---

## 2. Struktur Berkas

```
/
├── index.html          Beranda
├── produk.html         Katalog + filter
├── detail-produk.html  Detail satu produk
├── kategori.html       Landing 3 kategori
├── tentang.html        Profil & nilai brand
├── kontak.html         Kontak, form, peta, FAQ singkat
├── faq.html            Pusat bantuan + pencarian FAQ
├── style.css           Seluruh gaya (1 file, 1.992 baris)
├── script.js           Seluruh perilaku (1 file, 12 fungsi)
└── spec.md             Dokumen ini
```

Tidak ada folder aset lokal: semua gambar diambil dari Unsplash lewat URL, dan font dari
Google Fonts. Tidak ada dependensi, package manager, atau proses kompilasi — cukup buka
`index.html` di browser.

---

## 3. Design System

### 3.1 Variabel warna (`:root` di `style.css`)

| Variabel | Nilai | Pemakaian |
|---|---|---|
| `--ink` | `#20342b` | Teks utama, tombol gelap, announcement bar |
| `--ink-soft` | `#385044` | Teks sekunder gelap |
| `--cream` | `#f7f4ee` | Latar halaman |
| `--paper` | `#fffdf9` | Latar kartu & input |
| `--sand` | `#e8dfd1` | Aksen netral |
| `--peach` | `#df7751` | Tombol aksen (newsletter) |
| `--peach-light` | `#f4d8cb` | Aksen lembut |
| `--sage` | `#dce8dc` | Latar blok produk unggulan |
| `--gold` | `#bd944e` | Aksen bintang/rating |
| `--muted` | `#6f776f` | Teks keterangan |
| `--line` | `#ddd9d0` | Garis pembatas, border |
| `--shadow` | `0 18px 45px rgba(46,42,32,.08)` | Bayangan kartu |

### 3.2 Tipografi

- **Judul & aksen serif:** `Playfair Display` (600, 700, italic 600)
- **Body & UI:** `DM Sans` (400, 500, 600, 700)
- Base font-size body: `15px`; ukuran lain memakai `px` eksplisit, bukan `rem`.
- Dimuat via `<link>` Google Fonts dengan `preconnect` di setiap halaman.

### 3.3 Layout & container

- `.container`: `width: min(1140px, calc(100% - 48px)); margin-inline: auto`
- `.nav-wrap`: `width: min(1240px, calc(100% - 48px)); height: 78px`
- Satu-satunya breakpoint: `@media (max-width: 820px)` (nav jadi 65px, grid turun kolom)
- Pola jarak vertikal per seksi memakai `padding` tetap, mis. `.feature-section` `96px 0`,
  `.category-list` `90px 0`, `.detail-tabs` `padding-bottom: 100px`.

### 3.4 Konvensi penamaan kelas

- Struktural: `site-header`, `main-nav`, `nav-wrap`, `site-footer`, `container`
- Blok halaman: `hero-home`, `page-heading`, `shop-layout`, `product-detail`, `about-story`,
  `contact-layout`, `faq-page`
- Elemen berulang: `product-card`, `product-image`, `product-body`, `btn`, `overline`,
  `section-title`, `arrow-link`, `toast`, `empty-products`
- Modifier memakai kelas tambahan, bukan BEM penuh: `btn btn-dark`, `thumb active`,
  `category-feature category-feature-home`

---

## 4. Komponen Global

Komponen berikut muncul identik di semua (atau hampir semua) halaman.

### 4.1 Announcement bar

`.announcement` — bilah gelap penuh lebar di paling atas: teks "Gratis ongkir untuk pembelian
di atas Rp300.000" + tautan "Belanja sekarang →" ke `produk.html`.

### 4.2 Header & navigasi

```
.site-header (sticky, z-index 20, backdrop-filter blur)
└── .nav-wrap
    ├── a.logo                 "Ruang" + <span>Rasa</span>  → index.html
    ├── button.menu-toggle     ☰  (hanya tampil ≤820px), aria-expanded
    ├── nav.main-nav           Beranda · Belanja · Kategori · Tentang · Kontak
    └── .nav-tools
        ├── a.tool-link        ⌕  → produk.html (produk.html: #catalog-search)
        └── button.cart-button "Tas" + <b data-cart-count>0</b>
```

Aturan: setiap halaman menandai tepat satu tautan navigasi dengan `class="active"`.
Semua `button` wajib punya `type="button"` agar tidak men-trigger submit.

### 4.3 Footer

`.site-footer` dengan 4 kolom `.footer-grid`:

| Kolom | Isi |
|---|---|
| Brand | logo + "Kurasi benda untuk merayakan keseharianmu." |
| Jelajahi | Belanja, Kategori, Tentang Kami |
| Bantuan | Hubungi Kami, Pertanyaan Umum / FAQ |
| Ikuti Kami | Instagram, Pinterest (href `#`, placeholder) |

`.footer-bottom`: `© <span data-year></span> RuangRasa. Proyek UAS Desain Web.` dan
"Dibuat dengan penuh rasa." Tahun diisi otomatis oleh `initYear()`.

### 4.4 Toast

`div.toast[role="status"][aria-live="polite"]` di akhir `<body>` setiap halaman.
Ditampilkan dengan menambah kelas `.show`, hilang otomatis setelah 2.500 ms.

---

## 5. Spesifikasi per Halaman

### 5.1 `index.html` — Beranda

`<title>`: *RuangRasa — Hidup yang Terasa Lebih Hangat*

| Urutan | Seksi | Isi |
|---|---|---|
| 1 | `.hero-home` | Overline, h1 "Ruang yang baik, *membuat hari lebih berarti.*", paragraf, CTA "Jelajahi Koleksi" + "Cerita RuangRasa", 3 statistik (12K+ / 4,9-5 / 100%), gambar hero + kartu "Pilihan minggu ini" + lingkaran "Terpilih untukmu" |
| 2 | `.intro-strip` | "Barang sederhana. *Rasa yang istimewa.*" + 3 poin bernomor 01–03 |
| 3 | `.section-space` | Judul "Mulai dari hal yang dekat." + 3 `category-tile` (Rumah, Gaya Hidup, Untuk Dihadiahi) → `kategori.html` |
| 4 | `.feature-section` | 3 produk favorit (`product-card`) + tautan "Lihat semua produk" |
| 5 | `.editorial` | Foto + teks "Bukan sekadar benda di dalam rumah." + CTA ke `tentang.html` |
| 6 | `.newsletter` | Heading + `form.newsletter-form[data-message]` (email + tombol "Daftar") |

Interaksi: tombol `+` pada kartu produk menambah keranjang, memperbarui counter, dan memunculkan toast.

### 5.2 `produk.html` — Katalog

`<title>`: *Belanja | RuangRasa*

```
.page-heading            judul "Pilihan untuk dinikmati setiap hari."
.shop-layout (2 kolom)
├── aside.filter-panel
│   ├── .filter-heading  "Filter" + button[data-clear-filter] "Hapus"
│   ├── fieldset Kategori   radio name="category": all | rumah | gaya-hidup | hadiah
│   └── fieldset Harga      radio name="price":    all | 100000 | 200000
└── section.catalog-area
    ├── .catalog-top     total produk + search + select[data-sort]
    ├── .catalog-grid    kartu produk
    └── p.empty-products (hidden)
```

Kontrol katalog:

| Kontrol | Atribut | Perilaku |
|---|---|---|
| Jumlah hasil | `[data-product-total]` | diisi ulang setiap render |
| Pencarian | `[data-product-search]` | filter `includes()` pada `data-product`, case-insensitive, langsung saat mengetik |
| Urutkan | `[data-sort]` | `latest` (urutan DOM awal) · `low` (harga naik) · `high` (harga turun) |
| Hapus filter | `[data-clear-filter]` | reset pencarian, kategori `all`, harga `all`, urutan `latest` |
| Kosong | `.empty-products` | tampil bila hasil = 0 |

Data produk (6 item, atribut pada `<article class="product-card">`):

| Produk | `data-category` | `data-price` | Label |
|---|---|---|---|
| Lilin Aromaterapi Senja | `rumah` | 89000 | Baru |
| Mug Keramik Pagi | `rumah` | 75000 | Favorit |
| Tas Kanvas Sederhana | `gaya-hidup` | 119000 | Terlaris |
| Vas Kaca Embun | `rumah` | 145000 | Baru |
| Notebook Linen | `gaya-hidup` | 68000 | Terpilih |
| Set Kartu Pesan | `hadiah` | 45000 | Hadiah |

Setiap kartu berisi `a.product-image` (gambar + badge) dan `.product-body` (kategori, nama,
harga, `button.add-cart[data-product]`). Semua tautan detail mengarah ke `detail-produk.html`.

### 5.3 `detail-produk.html` — Detail Produk

`<title>`: *Lilin Aromaterapi Senja | RuangRasa* (halaman contoh untuk satu produk)

```
.breadcrumbs                 Beranda / Produk / Lilin Aromaterapi Senja
.product-detail (2 kolom)
├── .detail-gallery
│   ├── .main-product-photo > img
│   └── .thumb-row > button.thumb (×2)
└── article.product-detail-info
    ├── overline, h1, .rating "★★★★★ 4.9 (84 ulasan)", h2 harga Rp89.000
    ├── .detail-description
    ├── .color-choice       label "Pilihan wadah : Amber" + 2 .color-dot
    ├── .purchase-row       .quantity (− output +) + btn "Tambah ke Tas"
    └── .detail-perks       2 poin (pengiriman aman, pengembalian 14 hari)
.detail-tabs                 3 <details>: Deskripsi, Cara Penggunaan, Pengiriman & Pengembalian
```

Atribut interaksi:

- `.thumb` membawa `data-full` (URL gambar 1000px) dan `data-alt`; klik menukar gambar utama
  dan memindahkan kelas `active`.
- `.color-dot` membawa `data-color="Amber" | "Ivory"`; klik memperbarui label varian.
- `.quantity` memakai `[data-quantity-minus]`, `[data-quantity]`, `[data-quantity-plus]`;
  nilai minimum 1, tanpa batas atas.
- Tombol tambah memakai `data-product` dan menambahkan jumlah yang dipilih ke keranjang.

Kuantitas pada halaman detail diterapkan saat produk ditambahkan ke keranjang.

### 5.4 `kategori.html` — Kategori

`<title>`: *Kategori | RuangRasa*

- `.page-heading`: "Setiap sudut punya ceritanya."
- `.category-list`: 3 blok `category-feature` berselang-seling kiri/kanan
  (Untuk Rumah, Gaya Hidup, Untuk Dihadiahi) — semuanya menuju `produk.html`
- `.quote-band`: kutipan "Rumah bukan selalu tempat…"

Tidak ada filter atau state dinamis di halaman ini.

### 5.5 `tentang.html` — Tentang

`<title>`: *Tentang | RuangRasa*

| Seksi | Isi |
|---|---|
| `.page-heading` | "Merayakan momen sederhana melalui benda yang bermakna." |
| `.about-story` | Gambar studio + 2 paragraf cerita |
| `.values-section` | 3 nilai: Kualitas, Kesederhanaan, Keberlanjutan |
| `.about-stats` | 5+ tahun · 2.000+ pelanggan · 100+ produk · 98% kepuasan |
| `.timeline-section` | Linimasa 2020, 2022, 2024 |
| `.about-cta` | CTA gelap "Mulai Belanja" → `produk.html` |

### 5.6 `kontak.html` — Kontak

`<title>`: *Kontak | RuangRasa*

- `.contact-layout`: `aside.contact-info` (alamat, email, telepon, jam operasional) +
  `section.contact-form-wrapper` berisi `form.contact-form[data-message]`
- Field form: `Nama` (text, required), `Email` (email, required), `Subjek` (text, opsional),
  `Pesan` (textarea, required) → tombol submit "Kirim Pesan"
- `.contact-map`: `<iframe>` Google Maps (`q=Jakarta`, `loading="lazy"`)
- `.contact-faq`: 3 `<details>` bantuan cepat

Perilaku: submit dicegah, toast "Terima kasih! Pesan Anda sudah kami terima." muncul, form
direset. Tidak ada pengiriman data ke mana pun.

### 5.7 `faq.html` — FAQ

`<title>`: *FAQ | RuangRasa*

- `.page-heading`: "Pertanyaan yang sering diajukan."
- `.faq-search`: `input[type=search][data-faq-search]` "Cari pertanyaan..."
- `.faq-page`: 5 `<details>` (pemesanan, pengiriman, gift wrapping, pengembalian, pembayaran)
  + `p.empty-products[data-faq-empty]` (hidden)
- `.about-cta`: CTA ke `kontak.html`

Perilaku pencarian: konci diambil dari `textContent` setiap `<details>` (pertanyaan **dan**
jawaban), dicocokkan dengan `includes()`, lalu `<details>` yang tidak cocok diberi atribut
`hidden`. Bila hasil nol, pesan kosong ditampilkan.

---

## 6. Perilaku JavaScript (`script.js`)

File tunggal, tanpa modul, dieksekusi setelah `DOMContentLoaded` dengan urutan:

```
initMobileMenu() → initAddCartButtons() → initQuantitySelector() → initGallery()
→ initColorChoice() → initProductSearch() → initFaqSearch() → initForms()
→ initYear() → updateCart()
```

Setiap fungsi memakai pola *guard clause*: jika elemen yang dibutuhkan tidak ada di halaman,
fungsi langsung `return` tanpa error. Karena itu satu file aman dipakai di semua halaman.

| Fungsi | Tanggung jawab | Elemen kunci |
|---|---|---|
| `initMobileMenu` | Toggle `.open` pada `.main-nav`, `.menu-open` pada `body`, sinkronkan `aria-expanded` | `.menu-toggle` |
| `updateCart` | Menulis jumlah item ke semua `[data-cart-count]` | — |
| `addToCart` | Menambah item, menyimpan keranjang, tampilkan toast | — |
| `openCart` / `renderCart` | Panel keranjang, ubah jumlah, subtotal/total, konfirmasi hapus | `.cart-button` |
| `initAddCartButtons` | Pasang listener pada setiap `.add-cart` | `data-product` |
| `showToast` | Isi pesan, tambah `.show`, auto-hide 2.500 ms (timeout tunggal, anti-tumpuk) | `.toast` |
| `initQuantitySelector` | Tambah/kurang kuantitas, minimum 1 | `[data-quantity*]` |
| `initGallery` | Tukar gambar utama dari thumbnail | `.thumb`, `[data-full]`, `[data-alt]` |
| `initColorChoice` | Pilih varian wadah, perbarui label | `.color-dot`, `[data-color]` |
| `initProductSearch` | Search + filter kategori/harga + sort + reset + hitungan + empty state | lihat §5.2 |
| `initFaqSearch` | Filter `<details>` FAQ berdasarkan kata kunci | `[data-faq-search]` |
| `initForms` | `preventDefault`, toast dari `data-message`, reset | `form[data-message]` |
| `initYear` | Isi tahun berjalan | `[data-year]` |

**State aplikasi**

- `cartItems` — jumlah dan harga item yang disimpan di `localStorage`; jumlah dihitung
  kembali saat halaman dibuka. Checkout tetap tidak tersedia.
- `order` — indeks DOM awal setiap kartu, disimpan di `card.dataset.order` saat init,
  dipakai untuk opsi urutan "Terbaru".

**Daftar lengkap atribut data (kontrak HTML ↔ JS)**

| Atribut | Dipakai di | Fungsi |
|---|---|---|
| `data-product` | kartu & tombol tambah | nama produk untuk toast |
| `data-category` | `article` & `button` katalog | filter kategori |
| `data-price` | `article` & `button` katalog | filter & sort harga |
| `data-sort` | `select` | pilihan urutan |
| `data-product-search` | `input` | kata kunci |
| `data-product-total` | `span` | jumlah hasil |
| `data-clear-filter` | `button` | reset filter |
| `data-cart-count` | `b` | angka keranjang |
| `data-quantity`, `data-quantity-minus`, `data-quantity-plus` | halaman detail | kontrol kuantitas |
| `data-full`, `data-alt` | `.thumb` | sumber gambar utama |
| `data-color` | `.color-dot` | label varian |
| `data-faq-search`, `data-faq-empty` | `faq.html` | pencarian FAQ |
| `data-message` | `form` | teks toast saat submit |
| `data-year` | `span` footer | tahun berjalan |

---

## 7. Aksesibilitas

- `lang="id"` pada `<html>` setiap halaman.
- `nav.main-nav` memiliki `aria-label="Navigasi utama"`; logo memakai `aria-label`.
- `.menu-toggle` melaporkan state lewat `aria-expanded`.
- `.toast` memakai `role="status"` + `aria-live="polite"` sehingga dibacakan pembaca layar.
- Input ikon pencarian diberi `aria-label`; label form memakai `<label for>`.
- Gambar memiliki `alt` deskriptif; `.sr-only` tersedia untuk label yang tak terlihat.
- Fokus keyboard bawaan tidak dihapus; `.faq-search input:focus` memakai `outline` eksplisit.

---

## 8. Responsif

Satu breakpoint: **≤ 820px**.

- `.nav-wrap` menyusut ke 65px; `.main-nav` disembunyikan dan menjadi panel `.open`
  yang dikendalikan tombol ☰; `body.menu-open` mencegah scroll latar.
- Grid 3 kolom (kategori, produk, nilai, statistik, tim) turun menjadi lebih sedikit kolom.
- `.shop-layout` dan `.product-detail` menumpuk vertikal.
- `.main-product-photo` turun dari 560px ke 440px.
- `.faq-layout` (bila dipakai) merapatkan `gap` menjadi 40px.

---

## 9. Batasan yang Diketahui

Hal-hal ini disengaja atau belum dikerjakan — bukan bug tak terduga:

1. **Checkout belum tersedia.** Keranjang disimpan lokal, tetapi tidak ada pemesanan/pembayaran.
2. **Halaman detail memakai satu template** dan memilih produk melalui parameter URL.
3. **Instagram/Pinterest** memakai `href="#"` sampai URL akun tersedia.
4. **Peta** menunjuk Jakarta, sedangkan alamat di halaman kontak Banyuwangi.
5. **Form kontak dan newsletter hanya simulasi.** Data tidak dikirim atau disimpan.
6. **Filter kategori** di `produk.html` hanya mencakup 3 nilai; produk `hadiah` tidak punya
   halaman atau seksi khusus selain filter.
7. **CSS cukup panjang** (≈2.000 baris) dan memuat beberapa deklarasi `.catalog-grid`
   bertingkat (aturan dasar lalu override khusus katalog). Ini disengaja, bukan duplikasi
   yang saling menimpa nilai penting.
8. **Tidak ada validasi JS** di form; mengandalkan atribut `required` dan `type="email"`.

---

## 10. Cara Menjalankan

Tidak perlu instalasi apa pun:

1. Buka `index.html` langsung di browser (double-click), atau
2. Jalankan server statis lokal dari folder ini, misalnya `python -m http.server 8000`,
   lalu buka `http://localhost:8000`.

Pemeriksaan sintaks JS tanpa browser: `node --check script.js`.

---

## 11. Panduan Perubahan

Saat menambah halaman baru:

1. Salin struktur header/footer/announcement/toast dari halaman yang sudah ada.
2. Tandai satu tautan navigasi dengan `class="active"`.
3. Sertakan `<link rel="stylesheet" href="style.css">` dan `<script src="script.js" defer></script>`.
4. Beri `data-year` pada tahun footer.
5. Jika menambah komponen interaktif, tambahkan fungsi `init*` bergaya guard clause dan
   daftarkan di `DOMContentLoaded` — jangan mengubah fungsi yang sudah ada tanpa alasan.
