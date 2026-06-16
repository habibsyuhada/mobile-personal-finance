# Requirements — Modul Notes (Notion-style)

Status: Draft v1
Tanggal: 2026-06-16
Bagian dari: Personal Super App (lihat `../platform/`)

## 1. Ringkasan

Modul pencatat notes ala Notion: setiap note adalah **page** dengan **block-based
editor** (TipTap/ProseMirror), disusun dalam **page tree bersarang tanpa batas
kedalaman**, mendukung **database view** (table/board) untuk catatan terstruktur,
serta **pencarian full-text** cepat. Offline-first, data lokal SQLite
(namespace tabel `notes_`), mengikuti pola module Finance/Todo/Habit.

## 2. Definisi

- **Page**: sebuah dokumen notes; bisa berisi blok konten bebas, atau menjadi
  **database** dengan baris-baris record.
- **Block**: unit konten dalam page (paragraf, heading, list, todo, code, quote,
  callout, image, divider, dsb). Tersimpan sebagai JSON terstruktur agar bisa
  di-render ulang dan di-query.
- **Page Tree**: hierarki page → child page (recursive). Sidebar menunjukkan tree
  dengan expand/collapse + drag-reorder.
- **Database Page**: page khusus yang menyimpan rows (records) dengan property
  typed (text, number, select, multi-select, date, checkbox, url).
- **Database View**: cara menampilkan database: table, board (kanban per
  select), atau list.
- **Favorites / Pinned**: page yang ditandai bintang; muncul di section khusus
  di sidebar.
- **Recent**: daftar page yang baru dibuka (maks 10), section di sidebar.
- **Trash**: page yang dihapus masuk Trash; restore 30 hari, setelahnya hilang
  permanen.

## 3. Persyaratan Fungsional (EARS)

### N1 — Page CRUD & Tree

- N1.1 The system shall mengizinkan pembuatan page baru (di root atau sebagai
  child page) dengan judul dan opsional ikon/emoji.
- N1.2 The system shall menyimpan page dalam struktur tree menggunakan
  `parent_id` (self-referencing FK). Mendukung kedalaman tak terbatas.
- N1.3 The system shall mengizinkan rename page, ganti ikon/emoji, dan ganti
  cover image (opsional).
- N1.4 When sebuah page dihapus, the system shall memindahkannya ke Trash
  (soft-delete) — bukan langsung hilang.
- N1.5 When sebuah page di-restore dari Trash, the system shall mengembalikannya
  ke parent semula (atau ke root bila parent sudah dihapus permanen).
- N1.6 The system shall menyediakan empty Trash manual ("Empty Trash") dan
  auto-purge setelah 30 hari.
- N1.7 The system shall mengizinkan drag-reorder page di sidebar (antar sibling
  dan ke parent lain).

### N2 — Block Editor

- N2.1 The system shall menyediakan block-based editor (TipTap) dengan blok
  minimal: paragraph, heading 1-3, bullet list, ordered list, todo list, quote,
  code block (dengan language), divider, callout, image.
- N2.2 The system shall menyediakan **slash command** (`/`) untuk insert blok
  dengan cepat.
- N2.3 The system shall mendukung **inline formatting**: bold, italic,
  strikethrough, inline code, link.
- N2.4 The system shall menyimpan konten page sebagai JSON terstruktur (TipTap
  doc) di kolom `content_json`, plus ringkasan teks polos di `content_text`
  untuk pencarian full-text.
- N2.5 The system shall men-support paste dari luar (HTML & plaintext) dan
  mengkonversi ke blok internal secara best-effort.
- N2.6 The system shall auto-save debounced (500ms) setelah user berhenti
  mengetik.
- N2.7 When page dibuka, the system shall menampilkannya dengan **virtualized
  rendering** untuk page panjang (>500 blok) tanpa jank.

### N3 — Database (Block-based Tables)

- N3.1 The system shall mengizinkan page dibuat sebagai **database** (bukan
  page dokumen biasa).
- N3.2 The system shall mendukung property typed berikut per database:
  `text`, `number`, `select`, `multi_select`, `date`, `checkbox`, `url`,
  `email`, `phone`.
- N3.3 The system shall menyediakan **3 view** untuk database: Table (default),
  Board (group by `select` property), List (compact list dengan title).
- N3.4 The system shall mengizinkan filter, sort, dan group-by pada view;
  konfigurasi disimpan per-view.
- N3.5 The system shall mengizinkan menambah/menghapus/rename property dan
  column di table view.
- N3.6 When sebuah row dibuka, the system shall membuka sebagai page terpisah
  (sub-page dari database) dengan editor yang sama + properties panel.

### N4 — Navigasi & Pencarian

- N4.1 The system shall menampilkan sidebar dengan section: **Favorites**,
  **Private** (page tree), **Trash**.
- N4.2 The system shall menampilkan daftar **Recent** (10 page terakhir
  dibuka) di sidebar.
- N4.3 The system shall mendukung **expand/collapse** node tree di sidebar
  (state disimpan lokal per user).
- N4.4 The system shall menyediakan **global search** (Cmd/Ctrl+K) yang mencari
  berdasarkan judul page dan `content_text` (full-text).
- N4.5 When hasil search diklik, the system shall membuka page dan highlight
  match di editor (scroll to first occurrence).
- N4.6 The system shall mendukung quick switcher (Cmd/Ctrl+P) — fuzzy match
  page title untuk navigasi cepat.

### N5 — Lampiran & Media

- N5.1 The system shall mengizinkan upload image ke dalam blok image.
- N5.2 The system shall menyimpan image sebagai file di direktori app
  (Capacitor Filesystem) dan path-nya di kolom blok.
- N5.3 The system shall men-support paste image dari clipboard (best-effort
  di mobile, konsisten di web).
- N5.4 The system shall menampilkan thumbnail image inline dan tap-to-zoom
  fullscreen.

### N6 — Favorite & Recent

- N6.1 The system shall mengizinkan toggle favorite (star) dari page header
  atau sidebar context menu.
- N6.2 The system shall men-track page yang dibuka (`opened_at`) dan
  menampilkan 10 terakhir di section Recent.
- N6.3 The system shall mengizinkan clear Recent dari menu.

### N7 — Ekspor/Impor (Lokal)

- N7.1 The system shall mengizinkan ekspor single page ke file Markdown
  (`.md`) dengan frontmatter (title, icon, dates).
- N7.2 The system shall mengizinkan ekspor database ke CSV (rows + properties).
- N7.3 The system shall menyertakan data Notes dalam bundle ekspor/impor
  platform (Tabel `notes_*`) — JSON, mengikuti pola module lain.

### N8 — Reminder (v1: Tidak Ada)

- N8.1 Modul Notes v1 **tidak** mengintegrasikan notifikasi lokal. Page
  reminder adalah stretch goal di v2.

### N9 — Integrasi Modul Lain (v1: Terisolasi)

- N9.1 Modul Notes v1 berdiri sendiri — tidak ada embed/block referensi ke
  Finance/Todo/Habit.
- N9.2 Backlink `[[page:id]]` internal Notes (antar page di tree) **didukung**
  di v1; backlink ke entity modul lain adalah v2.

### N10 — Data & Persistensi

- N10.1 The system shall menyimpan seluruh data di SQLite lokal dengan
  prefix tabel `notes_`.
- N10.2 While aplikasi ditutup-buka, the system shall mempertahankan data.
- N10.3 The system shall menyertakan data Notes dalam ekspor/impor platform
  (mengikuti pola `tables` di descriptor).
- N10.4 The system shall menyimpan file lampiran di app sandbox (Capacitor
  Filesystem); path di DB.

## 4. Persyaratan Non-Fungsional

- **NFR1 (Performa)**: Page dengan 1.000+ blok tetap mulus (virtualized
  rendering di editor + virtualized tree di sidebar).
- **NFR2 (Konsistensi)**: Memakai token desain & komponen platform; sidebar
  mengikuti pola navigasi yang dipakai modul lain; empty state ilustratif.
- **NFR3 (Lokalisasi)**: Teks dalam English (default) & Bahasa Indonesia
  (namespace `notes.*` + `module.notes.name`).
- **NFR4 (Portabilitas)**: Repository pattern; siap migrasi ke Postgres.
  Konten JSON disimpan sebagai TEXT (portabel, bukan BLOB SQLite).
- **NFR5 (Offline-first)**: Semua fitur jalan tanpa koneksi. Tidak ada
  kolaborasi real-time di v1.
- **NFR6 (Keamanan file)**: Lampiran disimpan di internal storage app
  (disandbox), tidak pernah ditulis ke shared storage.
- **NFR7 (Bundle size)**: TipTap + extensions tambahan total <300KB gzipped.
- **NFR8 (Aksesibilitas)**: Keyboard navigation di tree (arrow keys,
  enter to expand, delete to remove); focus visible di editor.

## 5. Asumsi

- A1: Editor block akan di-render read-only-friendly di web preview
  (`npm run dev`) — beberapa fitur paste-image dari clipboard mungkin
  terbatas di browser biasa, tapi tetap usable.
- A2: Single user, no collaboration. Multi-device sync adalah fase
  backend (lihat `../personal-finance/tasks.md` Fase 9).
- A3: Lampiran image saja di v1 (bukan file generic). PDF/zip/dsb di v2.

## 6. Di Luar Cakupan MVP

- Kolaborasi real-time multi-user.
- Sinkronisasi cloud / multi-device.
- Page public/share link.
- Web clipper (browser extension).
- AI assistant (auto-summary, Q&A over notes).
- Backlink ke Finance/Todo/Habit entities.
- Reminder/page-notification.
- File attachment generic (PDF, zip, dll).
- Comment / discussion.
- Page history / version diff (read-only history mungkin di v2).

## 7. Kriteria Penerimaan

- N1: Bisa membuat, rename, delete (ke Trash), restore dari Trash, dan
  empty Trash. Tree expand/collapse & drag-reorder berfungsi.
- N2: Editor block dengan slash command jalan; bold/italic/link jalan;
  paste dari luar ter-konversi; auto-save 500ms; page panjang mulus.
- N3: Database page bisa dibuat; Table view menambah/mengedit row; Board
  view mengelompokkan per `select`; filter/sort jalan.
- N4: Sidebar dengan Favorites/Private/Trash + Recent; Cmd+K global search
  menemukan match di judul & konten; quick switcher fuzzy match.
- N5: Upload image jalan; image muncul inline; tap-to-zoom; paste image
  dari clipboard (web).
- N6: Favorite star toggle; Recent ter-track otomatis; Clear Recent.
- N7: Ekspor single page ke `.md`; ekspor database ke CSV; data Notes
  muncul di bundle ekspor platform.
- N10: Buka-tutup app: data persisten; uninstall = data hilang; backup
  via Settings → Ekspor.
- NFR3: Semua string UI tersedia EN & ID; modul terdaftar di launcher.
