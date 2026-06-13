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
| Todo List | Direncanakan | M | Lihat `specs/todo` |
| Habit Tracker | Direncanakan | M | Lihat `specs/habit-tracker` |

## Backlog kandidat (belum dispesifikasikan)

| Modul | Kompleksitas | Nilai | Sinergi | Deskripsi singkat |
|---|---|---|---|---|
| Notes / Catatan | M | Tinggi | Todo, Habit | Catatan cepat, folder, pencarian, markdown ringan |
| Journal / Diary | S–M | Sedang | Habit, Mood | Entri harian, mood, lampiran foto |
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

1. **Todo List** — fondasi sederhana, sering dipakai, validasi arsitektur modul.
2. **Habit Tracker** — pola data berbeda (jadwal + log harian), menguji
   fleksibilitas platform.
3. **Reminders** — menambah kapabilitas notifikasi lokal yang dipakai banyak
   modul lain (Todo due-date, Habit reminder).
4. **Notes** — cepat dibangun, nilai harian tinggi.
5. **Calendar/Agenda** — agregator lintas modul; baru bernilai setelah beberapa
   modul punya tanggal (Todo due, Habit schedule).

## Catatan arsitektur dari katalog ini

- Beberapa modul **berbagi konsep** (jadwal, reminder, tag, lampiran). Saat
  membangun Todo & Habit, ekstrak util bersama (mis. penjadwalan, notifikasi,
  tag) ke `src/lib/` agar modul berikutnya lebih cepat.
- **Reminders/Notifications** sebaiknya jadi layanan platform (bukan modul biasa)
  karena dipakai lintas modul → tambahkan ke spec platform saat dibutuhkan
  (kandidat plugin: `@capacitor/local-notifications`).
- Modul sensitif (**Password Vault**) butuh enkripsi at-rest; jangan dibangun
  sebelum ada strategi keamanan yang matang (selaras dengan catatan API key di
  spec keuangan).
