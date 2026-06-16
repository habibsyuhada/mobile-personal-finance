# Tasks — Modul Notes (Notion-style)

Status: **Draft v1** (belum dimulai)
Tanggal: 2026-06-16
Mengacu pada: `requirements.md`, `design.md`, `../platform/`, `../todo/tasks.md`
(pola tasks mengikuti Todo & Habit)

Prasyarat: Platform registry + launcher + module pattern sudah ada (✅ dari
modul Finance/Todo/Habit).

Konvensi: `[ ]` belum, `[~]` berjalan, `[x]` selesai. Tiap task menyebut
requirement (mis. `N1.1`).

> **Strategi eksekusi:** kerjakan per fase. Tiap fase adalah unit commit
> terpisah. Fase 1 (fondasi) & Fase 2 (editor) bisa paralel di branch berbeda
> tapi gabung sebelum merge. Fase 3 (database) bisa jadi PR kedua. Fase 4
> (search/navigation) & 5 (lampiran) setelah itu.

---

## Fase 1 — Fondasi Modul & Page Tree

- [ ] 1.1 Buat folder `src/modules/notes/` sesuai struktur design §2.
- [ ] 1.2 Tulis `NOTES_MIGRATIONS` (tabel `notes_*` sesuai design §3.1).
      (N10.1)
- [ ] 1.3 Tipe domain di `data/models.ts`. (design §4)
- [ ] 1.4 `INotesRepository` + `SqliteNotesRepository` (page CRUD + tree
      query). (N1.1, N1.2, N4.1)
- [ ] 1.5 `NotesService.createPage` + `movePage` + `softDeletePage` +
      `restorePage`. (N1.1, N1.4, N1.5)
- [ ] 1.6 `init: seedNotesDefaults` → buat page "Catatan Pribadi" di root.
      (N4.1)
- [ ] 1.7 Daftarkan `notesModule` di `src/platform/registry.ts` dengan
      `order: 4`. (platform P2.2)
- [ ] 1.8 `NotesRoot` dengan route `/m/notes` (render `NotesPage` kosong
      dengan placeholder "Pilih halaman").
- [ ] 1.9 `useNotesStore` Zustand dengan state tree + actions
      `loadTree`, `createPage`, `deletePage`, `restorePage`,
      `toggleFavorite`, `trackOpen`. (design §6)
- [ ] 1.10 Unit test service: create page, move page, cascade soft-delete,
      restore orphan.

**Acceptance**: Modul Notes tampil di launcher, bisa dibuka, tabel terbuat,
page tree bekerja (create/delete/restore). Sidebar tree menampilkan page
dengan expand/collapse.

## Fase 2 — Block Editor (TipTap)

- [ ] 2.1 Tambah dependency: `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`,
      `@tiptap/extension-placeholder`, `@tiptap/extension-task-list`,
      `@tiptap/extension-task-item`, `@tiptap/extension-typography`,
      `@tiptap/extension-image`. (N2.1)
- [ ] 2.2 Setup TipTap dasar di `editor/tiptap.ts` dengan StarterKit +
      Placeholder + TaskList + Image + Typography. (N2.1, N2.3)
- [ ] 2.3 Komponen `EditorArea` — render `<EditorContent>` di dalam
      `IonContent` dengan virtualized block rendering (custom hook
      `useVirtualBlocks` atau `@tanstack/react-virtual`). (N2.7)
- [ ] 2.4 Custom extension `SlashCommand` (detect `/` di awal paragraph,
      trigger popover `BlockMenu`). (N2.2)
- [ ] 2.5 `BlockMenu` component — list command (heading, list, todo, code,
      quote, divider, callout, image) dengan keyboard navigation.
- [ ] 2.6 `NotesService.savePageContent(pageId, blocks[])` + debounced
      auto-save (500ms). Update `text` polos untuk FTS. (N2.4, N2.6)
- [ ] 2.7 Save status indicator di UI ("Menyimpan..." / "Tersimpan X detik
      lalu"). (N2.6)
- [ ] 2.8 `PageHeader` component — inline title edit, icon picker (emoji),
      favorite toggle. (N1.3, N6.1)
- [ ] 2.9 Paste handler untuk convert HTML ke TipTap (paste dari luar). (N2.5)
- [ ] 2.10 Unit test `markdown.ts` round-trip (TipTap JSON ↔ MD) untuk
      semua node types.
- [ ] 2.11 Unit test `NotesService.savePageContent` (verify blocks
      tersimpan & text ter-update).

**Acceptance**: Buka page → editor load → ketik konten → slash command
muncul → blok bisa ditambah/dihapus → auto-save jalan → reload → konten
tersimpan.

## Fase 3 — Database (Notion-style Tables)

- [ ] 3.1 Migrasi v2: tabel `notes_databases`, `notes_db_rows`,
      `notes_db_views`. (N3.1)
- [ ] 3.2 Tipe domain `Database`, `DbRow`, `DbView`, `PropertyDef` di
      `models.ts`. (design §4)
- [ ] 3.3 Repository methods: `getDatabase`, `listRows`, `createRow`,
      `updateRow`, `deleteRow`, `listViews`, `createView`, `updateView`.
- [ ] 3.4 UI: opsi "Database" di `+ New` menu → buat page dengan
      `type='database'`. (N3.1)
- [ ] 3.5 Komponen `PropertyEditor` — modal tambah/rename/hapus property
      dengan type picker. (N3.2, N3.5)
- [ ] 3.6 Komponen `DatabaseTableView` — header kolom + baris, inline edit
      cell per type (text input, number input, select dropdown, checkbox,
      date picker). (N3.2)
- [ ] 3.7 Komponen `DatabaseBoardView` — group by select property, card
      per row, drag-drop ke kolom lain. (N3.3)
- [ ] 3.8 Komponen `DatabaseListView` — list ringkasan row. (N3.3)
- [ ] 3.9 View tabs + view switcher di header database. Default view
      otomatis dibuat saat database page dibuat. (N3.3)
- [ ] 3.10 Filter & sort UI per view, simpan config di `notes_db_views`. (N3.4)
- [ ] 3.11 Click row → buka row sebagai page (sub-page dengan editor +
      properties panel). (N3.6)
- [ ] 3.12 Unit test: create database + row + filter, update property
      value, switch view type.

**Acceptance**: Buat database → tambah properties → tambah rows → switch
antara Table/Board/List view → filter & sort jalan → click row → buka
sebagai page.

## Fase 4 — Sidebar Polish, Search & Quick Switcher

- [ ] 4.1 `SidebarTree` component — section Favorites/Private/Recent/Trash
      dengan expand/collapse. State `expanded` di store. (N4.1, N4.3)
- [ ] 4.2 Drag-reorder page (desktop): pakai `react-dnd` atau HTML5
      drag-and-drop API. Update `sort_order` di repo. (N1.7)
- [ ] 4.3 Context menu (long-press mobile / right-click desktop): rename,
      duplicate, move to trash, copy internal link. (N1.3, N1.4)
- [ ] 4.4 Recent section: `trackOpen` dipanggil setiap `openPage`; list
      max 10 dengan timestamp. (N4.2, N6.2)
- [ ] 4.5 Clear Recent dari menu. (N6.3)
- [ ] 4.6 `GlobalSearch` modal (Cmd/Ctrl+K): query input + debounce +
      result list + highlight. Pakai `repo.search`. (N4.4)
- [ ] 4.7 FTS5 setup: virtual table + triggers (design §3.2) ATAU LIKE
      fallback jika FTS5 tidak tersedia (detect via PRAGMA). (N4.4)
- [ ] 4.8 Click hasil search → navigate ke page + scroll to first match
      (mark di editor dengan class `search-highlight` sementara). (N4.5)
- [ ] 4.9 `QuickSwitcher` modal (Cmd/Ctrl+P): fuzzy match page title. (N4.6)
- [ ] 4.10 Keyboard shortcut handler global (Cmd+K, Cmd+P) di module root.
- [ ] 4.11 Unit test `search.ts` (FTS query builder + LIKE fallback).

**Acceptance**: Sidebar lengkap (Favorites/Private/Recent/Trash) dengan
expand/collapse + drag-reorder. Cmd+K search menemukan match di judul &
konten. Cmd+P switcher fuzzy match. Recent ter-track otomatis.

## Fase 5 — Lampiran (Image)

- [ ] 5.1 `AttachmentService` + `notes_attachments` table sudah ada dari
      Fase 1 (migration), lengkapi method `uploadImage` & `deleteAttachment`.
      (N5.1, N5.2)
- [ ] 5.2 Custom TipTap extension `ImageUpload` (node: `image` dengan
      `data-uploaded="true"`, trigger file picker on click, pakai
      AttachmentService). (N5.1)
- [ ] 5.3 Komponen `ImageBlock` — render image dengan `IonImg` + tap to
      zoom modal (fullscreen). (N5.4)
- [ ] 5.4 Paste handler untuk image dari clipboard (web & Android). (N5.3)
- [ ] 5.5 Web fallback: jika upload gagal (no plugin), pakai object URL +
      tampilkan warning "Image tidak tersimpan" (konsisten dengan N5).
- [ ] 5.6 Quota tracking: hitung total `size_bytes` di `notes_attachments`,
      tampilkan warning di Settings jika >40MB. (design §10)
- [ ] 5.7 Soft-delete page → lampiran file tetap (di-Trash); Empty Trash →
      hapus file. (N5.2 + N1.6)
- [ ] 5.8 Unit test `attachment.service` lifecycle.

**Acceptance**: Upload image dari tombol → muncul inline. Paste image dari
clipboard → masuk. Tap image → fullscreen zoom. Hapus page di Trash →
file image ikut terhapus saat Empty Trash.

## Fase 6 — Ekspor/Impor & i18n & Polish

- [ ] 6.1 `NotesService.exportPageMarkdown(id)` — generate MD string
      dengan frontmatter (title, icon, created, updated). (N7.1)
- [ ] 6.2 `NotesService.exportDatabaseCsv(id)` — generate CSV dengan
      header property names. (N7.2)
- [ ] 6.3 Tombol "Export" di page header menu (MD untuk page, CSV untuk
      database). Trigger download via Filesystem / browser download.
- [ ] 6.4 Verifikasi data Notes muncul di bundle ekspor platform (test
      dengan Settings → Ekspor → buka JSON, cek tabel `notes_*` ada).
      (N7.3, N10.3)
- [ ] 6.5 Kamus `notes.*` (EN + ID) lengkap. `module.notes.name`. (NFR3)
- [ ] 6.6 Empty state ilustratif untuk: tree kosong, search no result,
      database no rows.
- [ ] 6.7 Loading state untuk first-load tree besar (skeleton).
- [ ] 6.8 Accessibility: keyboard nav di tree (arrow keys, enter, delete);
      focus visible di editor; ARIA labels di icon-only buttons. (NFR8)
- [ ] 6.9 Performance pass: ukur dengan 1000-blok page synthetic, pastikan
      scroll tetap 60fps. (NFR1)
- [ ] 6.10 Bundle size check: `vite build` + periksa TipTap size warning.
      (NFR7)

**Acceptance**: Export MD jalan, export CSV jalan, bundle platform berisi
data Notes, semua string EN+ID ada, tree/editor/database dapat di-navigate
via keyboard.

## Fase 7 — Verifikasi

- [ ] 7.1 `npm test` — semua test hijau (existing 31 + Notes tests baru).
- [ ] 7.2 `npm run lint` — zero error.
- [ ] 7.3 `npm run build` — sukses, TypeScript zero error.
- [ ] 7.4 Uji persistensi: buat 50 page + database, tutup app, buka lagi,
      semua data utuh.
- [ ] 7.5 Uji di Android: `npm run cap:sync` + build APK, install, test
      paste-image, drag-reorder, Cmd+K (disesuaikan dengan hardware
      keyboard jika ada).
- [ ] 7.6 Tinjau kriteria penerimaan requirements §7 (semua N1–N10 + NFR
      terpenuhi).

---

## Catatan Eksekusi

- **Pola disalin dari Todo/Habit**: descriptor di `module.ts`, folder
  `data/services/store/components/pages`, i18n namespace `notes.*`.
- **Reuse dari platform**:
  - `Notifications` (tidak dipakai di Notes v1, tapi struktur sudah ada)
  - `useSettingsStore` (untuk `notes.fts.enabled` flag)
  - `newId`, `nowIso` dari `src/lib/id.ts`
  - `IonSplitPane` untuk responsive sidebar
  - Pattern `useXxxStore` Zustand dari Todo/Habit
- **Dependency baru**:
  - `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit` (~50KB gz)
  - `@tiptap/extension-placeholder`, `-task-list`, `-task-item`,
    `-typography`, `-image` (~30KB gz)
  - `react-dnd` + `react-dnd-html5-backend` (untuk drag-reorder desktop,
    ~15KB gz) — atau implementasi HTML5 DnD native (lebih ringan)
  - `@tanstack/react-virtual` (untuk virtualized blocks & tree,
    ~10KB gz) — opsional, bisa implementasi manual
  - TipTap total dengan custom extensions: target <300KB gzipped (NFR7)
- **Risiko utama**:
  - **FTS5 availability** di sql.js (web). Mitigasi: feature detection +
    LIKE fallback (design §3.2 + 4.7).
  - **TipTap + Ionic focus management**: keyboard muncul di mobile bisa
    steal focus. Mitigasi: pakai `IonContent` dengan
    `scrollY=false` di area editor; test di device.
  - **Bundle size**: monitor `vite build` setiap dependensi ditambah.
    Mitigasi: code-split per feature (search modal, database view) di
    lazy import.
  - **Drag-reorder mobile**: HTML5 DnD tidak jalan di mobile. Mitigasi:
    pakai library `framer-motion` (sudah di platform?) atau implementasi
    touch gesture custom; alternatif: tap-and-hold → modal "Move to..."
    dengan parent picker.
- **Stretch goals (post-MVP)**:
  - Page history / version
  - Web clipper (browser extension)
  - AI summarize per page
  - Backlink ke Finance/Todo/Habit entities (`[[tx:id]]`, `[[task:id]]`)
  - Page reminder / notification
  - Export to PDF
  - Cover image upload
  - Page templates (Meeting Notes, Journal, dsb)
