# Enhancement Plan — Premium Feel & Productivity

Status: Selesai v1
Tanggal: 2026-06-15
Update terakhir: 2026-06-16

Roadmap 11 fitur untuk membuat aplikasi terasa premium & produktif. Setiap
fase adalah unit kerja yang berdiri sendiri dan bisa di-commit terpisah.

## Ringkasan Eksekusi

| Fase | Tier | Status | Commit |
|---|---|---|---|
| A — Onboarding carousel + sample data | 3 | ✅ Selesai | `eec9f9a` |
| B — Theme presets + accent picker | 1 | ✅ Selesai | `81b41f3` |
| C — Number rolling animation | 3 | ✅ Selesai | `54d74a6` |
| D — Smart insights on-device | 1 | ✅ Selesai | `325b652` |
| E — Smart reschedule | 2 | ✅ Selesai | `1cbaf38` |
| F — Templates & shortcuts | 2 | ✅ Selesai | `a20fc25` |
| G — Per-modul theming polish | 3 | ✅ Selesai | `83043d9` |
| H — Home screen widget Android | 3 | ✅ Selesai | `8b1037a` |
| I — Live activity / persistent notif | 1 | ✅ Selesai | `d82a911` |

## Ringkasan Prioritas

| Tier | Fitur | Tujuan | Effort |
|---|---|---|---|
| 3 | Onboarding carousel + sample data | First impression | S |
| 1 | Theme presets + accent picker | Personalisasi | S-M |
| 3 | Number rolling + shared element | Visual delight | S |
| 1 | Smart insights on-device | "Wow" factor | M |
| 2 | Smart reschedule | Produktivitas | M |
| 2 | Templates & shortcuts | Produktivitas | M |
| 3 | Per-modul theming polish | Konsistensi | S |
| 3 | Home screen widget Android | Differentiator | L |
| 1 | Live activity / persistent notif | Native feel | L |

## Fase A — Onboarding carousel + sample data (Tier 3, S)

**Tujuan:** first impression yang kuat, langsung terlihat "wah", bantu user
memahami apa yang bisa dilakukan.

**Fitur:**
- First-launch: tampilkan carousel 3 slide (Swiper-style) di root `/`:
  1. "Selamat datang" — preview launcher dengan 3 modul
  2. "Notifikasi pintar" — preview notif habit/task/finance
  3. "Mulai" — pilih modul & opsi sample data
- Tombol "Lewati" tersedia di tiap slide
- Setelah selesai / di-lewati, set flag `pref.onboarded = true` di Preferences
- Saat reload berikutnya, langsung ke launcher
- "Sample data" opsional: tambah 3 task contoh, 2 habit contoh, 3 transaksi
  contoh (1 income, 2 expense) — user bisa langsung merasakan app berisi
- Sample data ditandai `isSample = 1` agar bisa dihapus sekaligus

**Struktur:**
- `src/app/Onboarding.tsx` (carousel + step logic)
- `src/features/sample/seed.ts` (data contoh)
- `src/store/onboarding.store.ts` (status + actions)

## Fase B — Theme presets + accent picker (Tier 1, S-M)

**Tujuan:** personalisasi visual, semua modul ikut berubah dari satu tempat.

**Fitur:**
- 4 preset: `Indigo` (default), `Sunset` (oranye-pink), `Forest` (hijau-teal),
  `Mono` (abu netral)
- Custom accent: 8 pilihan warna primer (override preset)
- True black dark mode (opsional, untuk AMOLED screen — `#000` background)
- Setting tersimpan di `pref.theme.preset` + `pref.theme.accent` (bisa override
  preset)
- Update `src/theme/variables.css` dengan CSS custom properties per preset
- Settings UI di Pengaturan → Tampilan

**Implementasi:** cukup manipulasi variabel CSS — Ionic variables di-toggle
via class di `<html>` / `<body>`.

## Fase C — Number rolling animation + shared element (Tier 3, S)

**Tujuan:** angka "count up" saat nilai berubah, bikin angka terasa hidup.

**Fitur:**
- Komponen `<RollingNumber value={n} />` — animasi count dari nilai lama
  ke nilai baru (~600ms) pakai `requestAnimationFrame`
- Pakai untuk: net worth, saldo akun, income/expense ringkasan, habit streak
  counter, task counts
- Pakai `Intl.NumberFormat` agar format uang konsisten
- Shared element transition: opsional pakai Ionic's built-in router
  animation. Cukup set `IonReactRouter` untuk pakai slide animation
- Easing: cubic-bezier untuk feel premium

**Komponen:** `src/lib/RollingNumber.tsx`

## Fase D — Smart insights on-device (Tier 1, M)

**Tujuan:** kartu "Insights" di dashboard masing-masing modul yang kasih
analisis personal — terasa mahal tanpa biaya server.

**Habit insights:**
- "Paling konsisten di hari [Senin]. Streak terbaik: [N] hari"
- "Waktu favorit: [pagi/siang/malam]" (dari log timestamps)
- "Kategori teratas: [nama kategori]"

**Finance insights:**
- "Pengeluaran [kategori] naik [N]% bulan ini"
- "Bulan ini kamu hemat [Rp X] dari bulan lalu"
- "Pengeluaran harian rata-rata: [Rp X]"

**Task insights:**
- "Kamu paling sering complete task di [Senin]"
- "[N] task lewat minggu lalu — ingin auto-reschedule?"
- "Completion rate: [N]% minggu ini"

**Cara kerja:**
- Insight engine di tiap modul (`lib/insights.ts`): pure function, input data
  → output array of `Insight {id, title, body, emoji, priority}`
- Dipanggil saat modul mount, hasil di-cache 1 jam
- Tampilan: kartu scrollable horizontal di atas dashboard
- User bisa dismiss (disimpan di `pref.insights.dismissed.{id}`)

## Fase E — Smart reschedule (Tier 2, M)

**Tujuan:** saat user lewat due date / streak pecah, tawarkan 1-tap recovery.

**Fitur:**
- Task lewat due date: notifikasi jadi interaktif dengan action "Geser ke besok"
  → service handler update `dueAt` ke besok, kasih toast "Diundur 1 hari"
- Habit streak pecah: kalau `currentStreak` baru reset ke 0, tawarkan di
  detail page "Mulai streak baru — target 7 hari?" → set habit target 7-hari
- Recurring transaction gagal: saat app buka dan ada recurring yang due_date
  terlewat >7 hari, tampil banner di dashboard "X transaksi terlewat —
  proses sekarang?" dengan 1-tap trigger

**Implementasi:**
- Tambah notif actions di `LocalNotifications` (id 'action')
- `scheduleReminder` di Task service menerima opsi postpone (1 day, 1 week)
- Habit detail page tambah "Restart Streak" button
- `recurring.service.processDue(past)` accept parameter

## Fase F — Templates & shortcuts (Tier 2, M)

**Tujuan:** "power user" feature — hemat 80% waktu untuk task/habit berulang.

**Fitur:**
- **Task templates**: di TaskForm, tombol "Gunakan Template" → modal pilih
  template → auto-fill title, list, subtasks, priority
- **Habit bundle**: wizard "Buat Paket Habit" → pilih beberapa habit preset
  ("Pagi sehat" = {Minum air, Olahraga 30m, Meditasi 10m}) — semuanya dibuat
  sekaligus dengan reminder time yang disinkronkan
- **Merchant favorit di Finance**: scan struk / input manual → suggestion
  berdasarkan history. List disimpan lokal
- **Template & bundle definitions** ada di kode (bukan DB) — kita kontrol
  kualitas, dan user tidak perlu manage-nya

**Struktur:**
- `src/features/templates/tasks.ts` — array `TASK_TEMPLATES`
- `src/features/templates/habits.ts` — array `HABIT_BUNDLES`
- `src/features/templates/finance.ts` — `MerchantSuggestion` (computed)

## Fase G — Per-modul theming polish (Tier 3, S)

**Tujuan:** saat user masuk modul, terasa "benar-benar di tempat ini" — bukan
hanya ganti tab.

**Fitur:**
- Subtle gradient header per modul (sudah ada accent, tinggal poles)
- Tab bar indicator color ikut accent modul
- Empty state ilustratif per modul (icon + tagline berbeda tiap modul)
- Module-specific microcopy: "Belum ada tugas. Yuk mulai!" vs "Belum ada
  kebiasaan. Mau mulai dari yang kecil?"

**Implementasi:** CSS variables per route + per-modul. CSS `[data-module="finance"]`
selector.

## Fase H — Home screen widget Android (Tier 3, L)

**Tujuan:** big differentiator — user lihat info penting tanpa buka app.

**Fitur:**
- App widget 4x2: tampilkan
  - 3 task teratas due hari ini (ngga selesai)
  - Habit streak tertinggi + emoji api
  - Today's net expense
- Tap modul: buka app ke modul terkait
- Update tiap kali user tambah/complete task, check-in habit, tambah transaksi
  (via `AppWidgetManager.updateAppWidget`)
- Native: `AppWidgetProvider` di Android (Java/Kotlin di folder `android/`)
- File layout XML untuk widget UI
- `@capacitor-community/appwidget` (kalau ada) atau custom plugin sederhana
  via `Capacitor.registerPlugin`

**Effort L** karena native code + lifecycle. Tanpa plugin resmi, kita bikin
**mini bridge plugin** JS-to-native untuk trigger widget update.

## Fase I — Live activity / persistent notification (Tier 1, L)

**Tujuan:** notification persistent yang update real-time (mirip timer di iOS),
terasa super native.

**Fitur:**
- Saat user buka Today Habit / Today Task, tampilkan persistent notification
  dengan progress bar: "Today: 3/5 habits done" atau "3 tasks remaining"
- Auto-dismiss saat user close Today
- Update tiap kali item dicomplete
- Tombol "Quick Add" di notification
- Android: pakai `Service.startForeground` + custom notification
- Capacitor plugin: `@capacitor-community/live-activity` (iOS only) atau
  custom `ForegroundService` (Android) — **Android only untuk MVP**

**Effort L** karena butuh foreground service yang dihandle dengan benar
agar tidak di-kill oleh OS.

## Strategi Eksekusi

1. **Spec dulu** (dokumen ini) → ✅
2. **Commit per fase** (jangan campur 11 fitur jadi 1 commit besar) → ✅
3. **On-device preview** dulu di web (banyak yang cukup web-friendly: A, B, C, D, E, F, G) → ✅
4. **Build & test APK** setelah Fase H & I (karena butuh native code)
   - Widget & live activity mengikuti pattern Capacitor plugin native;
     `registerPlugin(FinanceWidgetPlugin.class)` dan `LiveActivityPlugin.class`
     di `MainActivity.java`. Layout XML di `res/layout/widget_finance.xml`,
     `AppWidgetProvider` di `widget/FinanceWidgetProvider.java`.
5. **Update GitHub Actions** workflow untuk build widget — `cap sync` +
   `assembleDebug` akan otomatis compile native code (tidak perlu tambahan task).
6. **Final commit** dengan doc updates → ✅ (dokumen ini)

## Catatan Pasca-Implementasi

- **Fase H (widget)**: `targetCellWidth/Height` butuh Android 12+ untuk
  optimum. Pada Android 11 ke bawah, widget akan resize ke default 4x2 dengan
  `minWidth/minHeight` fallback. Aman untuk minSdk 22 yang dipakai project.
- **Fase I (live activity)**: `foregroundServiceType="dataSync"` di service
  declaration. Untuk Android 14+, tipe foreground service harus spesifik
  (dataSync cocok untuk update progress periodik). Build chain akan fail
  kalau lupa declare di manifest — sudah ditangani.
- **Fase F (templates)**: Merchant suggestion pakai field `note` sebagai
  pseudo-merchant (Transaction tidak punya kolom `merchant`). Bisa di-upgrade
  nanti dengan menambah kolom tsb di migration.

## Risiko & Mitigasi

- **Fase H (widget)** paling berisiko: native code, build chain. Mitigasi:
  pisah commit kecil, build APK setiap langkah.
- **Fase I (live activity)** butuh permission `FOREGROUND_SERVICE` dan
  `POST_NOTIFICATIONS` di Android 14+. Mitigasi: declare permission, minta
  izin runtime saat user buka Today.
- **Fase D (insights)** bisa berat di data besar (>1 tahun). Mitigasi: cache,
  limit data yang dianalisis (mis. 90 hari terakhir).
- **Kentang computer**: semua Fase A-G berbasis web (CSS/JS), bisa preview
  langsung. H & I butuh build APK — mungkin lambat di komputermu, hence
  delegasi ke GitHub Actions.

## Acceptance Per Fase

- **A**: Buka app fresh → carousel → pilih modul → launcher muncul dengan
  data sample.
- **B**: Settings → Theme → ganti preset → warna launcher + accent semua
  modul ikut berubah real-time.
- **C**: Buka dashboard → angka saldo count up dari 0 ke nilai aslinya.
- **D**: Dashboard finance → kartu "Insights" muncul dengan teks personal.
- **E**: Task lewat due → notification "Geser ke besok?" dengan action button.
- **F**: TaskForm → "Template" → pilih → form terisi otomatis.
- **G**: Pindah modul → tab bar + header punya accent berbeda.
- **H**: Home screen Android → widget 4x2 → tap buka modul.
- **I**: Buka Today Habit → persistent notification muncul dengan progress.

## Referensi Arsitektur

- **`AppSettings`** akan ditambah: `themePreset`, `themeAccent`, `trueBlack`
- **Insight store** baru: `useInsightStore` (per-modul, cached 1 jam)
- **Template picker** di TaskForm, HabitForm
- **Module descriptor** diperluas dengan `insights?` function
- **Android folder** akan dapat file baru di `android/app/src/main/java/.../widget/`
