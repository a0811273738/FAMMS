# Panduan Pengguna POS Pro (Bahasa Indonesia)

> Untuk pemilik toko dan kasir. Panduan ini menjelaskan langkah demi langkah, dari login pertama sampai operasional harian.
> Untuk cara instalasi, baca dulu Panduan Instalasi (docs/sales/04-Panduan-Instalasi-Indonesia.md).

---

## 1. Pengaturan Awal

### 1.1 Masuk (Login)
1. Ketuk ikon POS Pro di layar utama
2. Pojok kanan atas: pilih bahasa — 中文 / English / Bahasa Indonesia
3. Pilih akun "Bos", masukkan password awal `1234`
4. Ketuk "Masuk"

### 1.2 Segera ganti password (penting!)
1. Buka "Pengaturan" di menu kiri
2. Cari "Akun Karyawan"
3. Ganti password untuk "Bos" dan "Karyawan"
4. Beritahu password baru hanya kepada orang yang perlu

### 1.3 Isi nama toko
1. "Pengaturan" → "Info Toko"
2. Masukkan nama toko Anda (akan tercetak di struk)

---

## 2. Menambah Produk

### 2.1 Tambah satu produk
1. Buka "Produk" di menu kiri
2. Ketuk "Tambah Produk"
3. Isi: nama produk, harga jual, modal (boleh dikosongkan), jumlah stok
4. Produk dengan barcode: ketuk kolom "Barcode", scan dengan alat scanner atau ketik nomornya
5. Ketuk "Simpan"

### 2.2 Masukkan banyak produk sekaligus (CSV)
1. "Produk" → "Ekspor CSV" untuk mengunduh contoh format
2. Buka di Excel, isi produk Anda sesuai format
3. "Produk" → "Impor CSV", pilih file Anda
4. Periksa pratinjau, lalu konfirmasi

💡 Tips: masukkan dulu 30–50 barang yang paling laku, langsung bisa mulai jualan. Sisanya menyusul.

---

## 3. Kasir / Transaksi (Rutinitas Harian)

### 3.1 Buka shift
1. Sebelum transaksi pertama, buka "Shift" dan ketuk "Buka Shift"
2. Masukkan uang modal di laci (contoh: 500.000)
3. Sekarang siap jualan

### 3.2 Melayani satu transaksi
1. Buka "Kasir" di menu kiri
2. Masukkan barang ke keranjang — pilih salah satu cara:
   - **Scan barcode**: pakai alat scanner, atau ketuk "Scan Kamera" pakai kamera HP
   - **Cari**: ketik nama barang di kolom pencarian
   - **Pilih kategori**: ketuk kategori, lalu ketuk barangnya
3. Ubah jumlah dengan "+" / "−" di keranjang
4. Ketuk "Bayar"
5. Pilih cara bayar (tunai dll.), masukkan uang yang diterima
6. Layar menampilkan **uang kembalian** — konfirmasi, selesai
7. Ketuk "Cetak" kalau pembeli minta struk

### 3.3 Tahan pesanan (pembeli pergi sebentar)
1. Saat keranjang ada isinya, ketuk "Tahan"
2. Layani pembeli berikutnya
3. Saat pembeli kembali, buka daftar "Pesanan Ditahan" dan lanjutkan

### 3.4 Retur / pengembalian barang
1. Cari transaksinya di "Pesanan"
2. Ketuk "Retur", centang barang yang dikembalikan
3. Konfirmasi jumlah uang — stok dan poin otomatis kembali

### 3.5 Tutup shift (tutup toko)
1. "Shift" → "Tutup Shift"
2. Hitung uang di laci, masukkan jumlah sebenarnya
3. Sistem otomatis hitung selisih dan menampilkan laporan shift hari ini

---

## 4. Mengelola Stok

- **Peringatan stok menipis**: barang di bawah stok aman akan muncul peringatan — waktunya belanja
- **Pembelian**: "Pembelian" → pilih supplier → buat pesanan → barang datang, ketuk "Terima"; stok otomatis bertambah
- **Stock opname**: "Opname" → hitung dan masukkan jumlah sebenarnya → sistem menampilkan dan memperbaiki selisih
- **Peringatan kedaluwarsa**: barang yang ada tanggal kedaluwarsa akan diingatkan sebelum expired

---

## 5. Member (Pelanggan Tetap)

### 5.1 Daftarkan member
1. "Member" → "Tambah Member"
2. Isi nama dan nomor HP (nomor HP jadi nomor member, paling gampang)

### 5.2 Kumpulkan poin saat belanja
1. Sebelum bayar, ketuk kolom "Member", cari dengan nomor HP
2. Poin otomatis terkumpul, bisa dipakai potongan belanja berikutnya

### 5.3 Saldo deposit
1. "Member" → pilih orangnya → "Deposit"
2. Terima uangnya, masukkan jumlah — belanja berikutnya bisa potong dari saldo

---

## 6. Pesan Mandiri via QR (Untuk Rumah Makan)

1. "Pengaturan" → aktifkan "Pesan via QR"
2. Buat kode QR, cetak, tempel di tiap meja (dengan nomor meja)
3. Pembeli scan pakai HP → pilih menu sendiri → kirim
4. Pesanan otomatis muncul di halaman "Pesanan" — masak, antar, terima pembayaran

---

## 7. Laporan (Untuk Pemilik)

- **Beranda**: omzet hari ini, untung kotor, dan jumlah transaksi langsung terlihat setelah login
- **Laporan**: grafik omzet harian/bulanan, barang terlaris, barang tidak laku, kinerja karyawan
- **Pembukuan**: pencatatan otomatis, ada laporan laba rugi; "Ekspor CSV" untuk akuntan Anda

---

## 8. Backup Data (Lakukan Tiap Minggu!)

1. "Pengaturan" → "Ekspor" untuk menyimpan data sebagai file CSV
2. Simpan ke Google Drive atau komputer Anda
3. Toko dengan paket cloud: data otomatis ter-backup dan tersinkron antar perangkat

---

## 9. Pertanyaan Umum & Solusi

| Masalah | Solusi |
|---------|--------|
| Lupa password | Hubungi layanan pelanggan untuk reset |
| Barcode tidak terbaca | Pastikan produk sudah terdaftar dan barcode benar; scan kamera perlu izin kamera |
| Fitur tidak ketemu | Beberapa fitur lanjutan ada di "Mode Lengkap" — ganti di "Pengaturan" |
| Ganti HP baru | "Ekspor" backup dulu → hubungi CS untuk lepas perangkat lama → instal di HP baru lalu "Impor" |
| Tampilan aneh | Tutup aplikasi sepenuhnya lalu buka lagi; kalau masih, refresh |

📱 WhatsApp Layanan Pelanggan: 【NOMOR-ANDA】
