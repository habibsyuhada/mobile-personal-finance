# Module Catalog — Kandidat Modul Personal Super App

Status: Living document
Tanggal: 2026-06-13

Daftar ide modul untuk personal super app. Tujuannya membantu prioritisasi dan
memastikan arsitektur platform cukup umum untuk menampung beragam modul.

## Legenda

- **Kompleksitas**: S (kecil), M (sedang), L (besar).
- **Nilai**: seberapa sering dipakai / dampak harian.
- **Sinergi**: potensi integrasi dengan modul lain nanti.

## Modul yang sudah/akan dibuat

| Modul | Status | Kompleksitas | Catatan |
|---|---|---|---|
| Keuangan (Finance) | Selesai (MVP) | L | Transaksi, akun, anggaran, scan struk AI |
| Todo List | Selesai (v1) | M | Lihat `specs/todo` |
| Habit Tracker | Selesai (v1) | M | Lihat `specs/habit-tracker` |
| Notes (Notion-style) | Direncanakan (spec siap) | L | Lihat `specs/notes` |

## Backlog kandidat (belum dispesifikasikan)

| Modul | Kompleksitas | Nilai | Sinergi | Deskripsi singkat |
|---|---|---|---|---|
| Journal / Diary | S–M | Sedang | Habit, Mood, Notes | Entri harian, mood, lampiran foto (bisa di atas Notes + database) |
| Mood Tracker | S | Sedang | Habit, Journal | Catat suasana hati harian + grafik tren |
| Reminders / Pengingat | M | Tinggi | Todo, Habit | Notifikasi terjadwal lokal |
| Kalender / Agenda | L | Tinggi | Todo, Habit | Tampilan kalender menyatukan due-date modul lain |
| Goals / Target | M | Tinggi | Finance, Habit | Target jangka panjang + progres terukur |
| Health / Berat & Air | M | Sedang | Habit | Catat berat badan, minum air, langkah |
| Workout / Olahraga | M | Sedang | Habit, Health | Rutinitas latihan, set/rep, riwayat |
| Meal / Makanan | M | Sedang | Health, Finance | Catat makanan/kalori; bisa nyambung ke struk |
| Password Vault | L | Tinggi | — | Sensitif: butuh enkripsi kuat; pertimbangkan matang |
| Bookmarks / Tautan | S | Sedang | Notes | Simpan & kategorikan tautan |
| Contacts / Kontak Penting | S | Rendah | — | Kontak penting + tanggal penting |
| Subscriptions | S–M | Tinggi | Finance | Lacak langganan & tanggal tagih (bisa jadi sub-fitur Finance) |
| Reading List / Buku | S | Sedang | Notes, Habit | Daftar bacaan + progres halaman |
| Time Tracker | M | Sedang | Todo | Lacak waktu per aktivitas/proyek |
| Pomodoro / Focus | S | Sedang | Todo, Time | Timer fokus + statistik sesi |
| Inventory / Barang | M | Rendah | — | Daftar barang/garansi/aset |
| Travel / Perjalanan | M | Rendah | Finance | Itinerary, checklist, anggaran trip |

## Prioritas yang disarankan (setelah platform siap)

1. **Todo List** — fondasi sederhana, sering dipakai, validasi arsitektur modul. ✅
2. **Habit Tracker** — pola data berbeda (jadwal + log harian), menguji
   fleksibilitas platform. ✅
3. **Reminders** — menambah kapabilitas notifikasi lokal yang dipakai banyak
   modul lain (Todo due-date, Habit reminder). ✅ (sebagai layanan platform,
   dipakai Todo & Habit)
4. **Notes** — nilai harian tinggi, page tree & database jadi fondasi untuk
   modul Journal/Diary/Password/Knowledge base di masa depan. Spec siap
   (`specs/notes`); kompleksitas L karena block editor + database + search.
5. **Calendar/Agenda** — agregator lintas modul; baru bernilai setelah beberapa
   modul punya tanggal (Todo due, Habit schedule).

## Catatan arsitektur dari katalog ini

- Beberapa modul **berbagi konsep** (jadwal, reminder, tag, lampiran). Saat
  membangun Todo & Habit, ekstrak util bersama (mis. penjadwalan, notifikasi,
  tag) ke `src/lib/` agar modul berikutnya lebih cepat.
- **Reminders/Notifications** sebaiknya jadi layanan platform (bukan modul biasa)
  karena dipakai lintas modul → tambahkan ke spec platform saat dibutuhkan
  (kandidat plugin: `@capacitor/local-notifications`). ✅ Sudah ada, dipakai
  Todo & Habit.
- **Notes** dengan page tree + database akan jadi **fondasi** untuk modul
  masa depan yang bersifat knowledge-base (Journal, Reading List, Bookmarks,
  Inventory). Disarankan menjadi prioritas berikutnya setelah Todo & Habit.
- Modul sensitif (**Password Vault**) butuh enkripsi at-rest; jangan dibangun
  sebelum ada strategi keamanan yang matang (selaras dengan catatan API key di
  spec keuangan).
