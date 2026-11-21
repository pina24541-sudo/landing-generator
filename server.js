const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Load HTML template
const templatePath = path.join(__dirname, 'templates', 'landing.html');
let htmlTemplate = '';

try {
  htmlTemplate = fs.readFileSync(templatePath, 'utf8');
} catch (err) {
  console.error('Gagal load template:', err.message);
}

// ============== PROMPT UNTUK AI ==============
function buildPrompt(data) {
  return `Kamu adalah copywriter profesional untuk landing page berbahasa Indonesia.
Buatkan konten lengkap untuk landing page dengan data berikut:

- Nama Brand: ${data.brandName}
- Tagline: ${data.tagline || 'Situs Terpercaya'}
- Minimal Deposit: ${data.minDeposit || 'IDR 10.000'}
- Minimal Withdraw: ${data.minWithdraw || 'IDR 50.000'}
- Metode Pembayaran: ${data.paymentMethods || 'Bank Transfer, E-Wallet, QRIS'}
- Rating: ${data.rating || '4.9'}
- Jumlah Review: ${data.reviewCount || '10.000+'}
- Kata Kunci Utama: ${data.keywords || 'situs terpercaya'}
- Tahun: ${data.year || '2026'}
- Fokus Konten: ${data.focus || 'permainan online'}

HASILKAN HANYA dalam format JSON murni (tanpa markdown, tanpa penjelasan tambahan) dengan struktur persis seperti ini:

{
  "title": "Judul SEO halaman (max 60 karakter)",
  "metaDescription": "Meta description SEO (max 155 karakter)",
  "heroTitle": "Judul besar di hero section",
  "infoJenis": "Teks singkat jenis/pasaran (contoh: Main Slot Anti Rungkad, Maxwin Setiap Hari)",
  "descriptionHtml": "Konten deskripsi panjang dalam format HTML. Harus ada beberapa paragraf, pakai <p>, <strong>, dan <br>. Minimal 4-6 paragraf. Buat seolah-olah review + keunggulan + tips + kesimpulan. Bahasa Indonesia natural, persuasif, dan SEO friendly.",
  "reviews": [
    {
      "name": "Nama orang Indonesia",
      "text": "Ulasan positif singkat (1-2 kalimat)"
    },
    {
      "name": "Nama orang Indonesia",
      "text": "Ulasan positif singkat (1-2 kalimat)"
    },
    {
      "name": "Nama orang Indonesia",
      "text": "Ulasan positif singkat (1-2 kalimat)"
    }
  ],
  "faqs": [
    {
      "question": "Pertanyaan FAQ 1",
      "answer": "Jawaban FAQ 1"
    },
    {
      "question": "Pertanyaan FAQ 2",
      "answer": "Jawaban FAQ 2"
    },
    {
      "question": "Pertanyaan FAQ 3",
      "answer": "Jawaban FAQ 3"
    }
  ],
  "footerText": "Teks singkat di footer"
}

PENTING:
- Semua teks harus dalam Bahasa Indonesia.
- Jangan gunakan kata-kata yang terlalu berlebihan atau terkesan spam.
- Buat konten yang natural dan meyakinkan.
- descriptionHtml harus berisi HTML yang valid (pakai tag <p> dan <strong>).`;
}

// ============== GENERATE DENGAN GROQ ==============
async function generateWithGroq(apiKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten yang hanya membalas dengan JSON valid. Jangan pernah menambahkan teks di luar JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Tidak ada konten dari AI');
  }

  return JSON.parse(content);
}

// ============== FILL TEMPLATE ==============
function fillTemplate(template, data, aiContent) {
  let html = template;

  const replacements = {
    '{{BRAND_NAME}}': data.brandName || 'BRAND',
    '{{TAGLINE}}': data.tagline || 'Situs Terpercaya',
    '{{YEAR}}': data.year || '2026',
    '{{MIN_DEPOSIT}}': data.minDeposit || 'IDR 10.000',
    '{{MIN_WITHDRAW}}': data.minWithdraw || 'IDR 50.000',
    '{{PAYMENT_METHODS}}': data.paymentMethods || 'Bank Transfer • E-Wallet • QRIS',
    '{{RATING}}': data.rating || '4.9',
    '{{REVIEW_COUNT}}': data.reviewCount || '10.000+',
    '{{LOGIN_URL}}': data.loginUrl || '#',
    '{{REGISTER_URL}}': data.registerUrl || '#',
    '{{LOGO_URL}}': data.logoUrl || 'https://via.placeholder.com/300x100?text=LOGO',
    '{{HERO_IMAGE}}': data.heroImage || 'https://via.placeholder.com/800x450?text=Hero+Image',
    '{{FAVICON}}': data.favicon || data.logoUrl || 'https://via.placeholder.com/64',
    
    // Dari AI
    '{{TITLE}}': aiContent.title || `${data.brandName} - ${data.year}`,
    '{{META_DESCRIPTION}}': aiContent.metaDescription || '',
    '{{HERO_TITLE}}': aiContent.heroTitle || data.brandName,
    '{{INFO_JENIS}}': aiContent.infoJenis || data.tagline || '',
    '{{DESCRIPTION_HTML}}': aiContent.descriptionHtml || '<p>Deskripsi belum tersedia.</p>',
    '{{FOOTER_TEXT}}': aiContent.footerText || data.tagline || '',
  };

  // Reviews
  let reviewsHtml = '';
  if (aiContent.reviews && Array.isArray(aiContent.reviews)) {
    aiContent.reviews.forEach((r) => {
      reviewsHtml += `
        <div class="review-card">
          <div class="reviewer-name">${r.name || 'User'}</div>
          <div class="review-text">"${r.text || ''}"</div>
        </div>`;
    });
  }
  replacements['{{REVIEWS_HTML}}'] = reviewsHtml;

  // FAQs
  let faqsHtml = '';
  if (aiContent.faqs && Array.isArray(aiContent.faqs)) {
    aiContent.faqs.forEach((f, i) => {
      faqsHtml += `
        <div class="faq-item">
          <div class="faq-question">${f.question || ''}</div>
          <div class="faq-answer"><p>${f.answer || ''}</p></div>
        </div>`;
    });
  }
  replacements['{{FAQS_HTML}}'] = faqsHtml;

  // Replace semua
  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(key).join(value);
  }

  return html;
}

// ============== API ENDPOINT ==============
app.post('/api/generate', async (req, res) => {
  try {
    const { apiKey, ...formData } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key Groq wajib diisi' });
    }

    if (!formData.brandName) {
      return res.status(400).json({ error: 'Nama Brand wajib diisi' });
    }

    console.log(`Generating untuk brand: ${formData.brandName}`);

    const prompt = buildPrompt(formData);
    const aiContent = await generateWithGroq(apiKey, prompt);

    const finalHtml = fillTemplate(htmlTemplate, formData, aiContent);

    res.json({
      success: true,
      html: finalHtml,
      aiContent // optional, buat debug
    });

  } catch (error) {
    console.error('Error generate:', error.message);
    res.status(500).json({
      error: error.message || 'Gagal generate landing page'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Landing Page Generator berjalan di http://localhost:${PORT}`);
  console.log(`   Buka browser dan mulai generate!\n`);
});
