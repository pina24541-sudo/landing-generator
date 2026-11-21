# AI Landing Page Generator

Form → AI Generate → Preview → Download HTML

Menggunakan **Groq API** (gratis) + model **Llama 3.3 70B**.

## Cara Pakai

### 1. Install dependencies

```bash
cd landing-generator
npm install
```

### 2. Jalankan server

```bash
npm start
```

Buka browser: [http://localhost:3000](http://localhost:3000)

### 3. Dapatkan Groq API Key (Gratis)

1. Buka → [https://console.groq.com](https://console.groq.com)
2. Daftar / Login (bisa pakai Google)
3. Masuk ke menu **API Keys**
4. Klik **Create API Key**
5. Copy key-nya (format: `gsk_...`)
6. Paste di form website

### 4. Generate

Isi form → klik **Generate Landing Page** → tunggu beberapa detik → Preview muncul → klik **Download HTML**.

---

## Deploy ke Domain / Hosting

Bisa di-deploy ke:

- **Railway** (paling mudah)
- **Render**
- **VPS** (Ubuntu + PM2)
- **Vercel** (perlu sedikit penyesuaian)

Contoh di Railway / Render:
1. Push project ke GitHub
2. Connect repository
3. Build command: `npm install`
4. Start command: `npm start`
5. Sudah live.

---

## Catatan

- API Key Groq disimpan di `localStorage` browser (tidak dikirim ke server lain).
- Semua konten (deskripsi, review, FAQ) digenerate oleh AI.
- Template HTML ada di folder `templates/landing.html` (bisa kamu edit desainnya).
