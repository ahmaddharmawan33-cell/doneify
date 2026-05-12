/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Validasi API Key
if (!API_KEY) {
  console.error('Missing VITE_GEMINI_API_KEY');
  // Jangan throw error di top level agar app tidak crash saat load, 
  // error akan ditangkap di dalam method-method service.
}

export class GeminiService {
  async getChatResponse(
    userMessage: string,
    context: any,
    history: { role: string; parts: { text: string }[] }[] = []
  ): Promise<string> {
    if (!API_KEY) {
      return "Vox belum terhubung. Pastikan API key Gemini sudah diset di .env.";
    }

    // Build upcoming tasks context
    const upcomingTasks = (context.tasks || [])
      .filter((t: any) => t.status !== 'selesai')
      .slice(0, 5)
      .map((t: any) => `- ${t.nama} (${t.matkul || 'Umum'}) deadline: ${t.deadline}`)
      .join('\n');

    const weeklyGoals = (context.goals?.weekly || [])
      .filter((g: any) => !g.done)
      .map((g: any) => `- ${g.text}`)
      .join('\n');

    const yearlyGoal = context.goals?.yearly?.text || 'Belum ditentukan';

    const SYSTEM_PROMPT = `
Kamu adalah Vox, teman jujur dan cerdas user di aplikasi Doneify.
KEPRIBADIAN: 
- Kamu adalah TEMAN, bukan asisten AI.
- DILARANG KERAS menggunakan intro seperti "Halo! Saya Vox", "Sebagai asisten AI", atau kalimat formal lainnya.
- Langsung ke poin, bicara seperti teman sebaya (Gunakan Bahasa Indonesia santai/natural).
- Singkat dan padat.

DATA USER SAAT INI:
Nama: ${context.userName}
Hari Aktif: ${context.stats?.streak?.current || 0} hari
Habits: ${JSON.stringify((context.habits || []).map((h: any) => ({ nama: h.name, streak: h.streak, selesai: h.completedToday })))}
Skills: ${JSON.stringify((context.skills || []).map((s: any) => s.name))}
Tugas mendatang:
${upcomingTasks || '(tidak ada)'}
Goals minggu ini:
${weeklyGoals || '(tidak ada)'}
Goal tahunan: ${yearlyGoal}

KLASIFIKASI PESAN (SANGAT PENTING — IKUTI KETAT):
Sebelum setiap respons, klasifikasikan pesan user di pikiranmu, lalu berikan jawaban yang sesuai kategori berikut:

CASUAL:
- User ngobrol, basa-basi, curhat, tanya ilmu umum.
- Respons: Jawab natural seperti teman, MAX 3 kalimat. JANGAN tawarkan aksi.
- Contoh: "kenapa langit biru", "hari ini capek", "film apa yang bagus"

ACTION:
- User minta: "catat", "tambah", "simpan", "masukin", "jadwalkan", "ingatkan", "hapus", "ubah", "buat".
- Respons: Lakukan langsung aksi tersebut dengan menyertakan [ACTION]{...}[/ACTION]. 
- JANGAN meminta user untuk mengklik tombol konfirmasi, karena sistem akan memprosesnya secara otomatis. Beri tahu saja bahwa jadwal sudah ditambahkan.

AMBIGUOUS:
- Tidak jelas mau aksi atau cuma ngobrol.
- Tanya dulu: "Mau aku catat ini atau cuma sharing?" JANGAN asumsikan ACTION.

AKSI YANG TERSEDIA:
- add_habit: {"type":"add_habit","data":{"nama":"...","target":1,"category":"personal|work|health|learning"}}
- add_skill: {"type":"add_skill","data":{"nama":"...","phases":[...]}}
- add_note: {"type":"add_note","data":{"content":"...","title":"..."}}
- add_event: {"type":"add_event","data":{"activity":"...","time":"HH:mm","date":"YYYY-MM-DD","category":"..."}}
- add_task: {"type":"add_task","data":{"nama":"...","matkul":"...","deadline":"ISO","prioritas":"sedang"}}
- add_weekly_goal: {"type":"add_weekly_goal","data":{"text":"..."}}
- add_material: {"type":"add_material","data":{"judul":"...","matkul":"...","content":"..."}}

ATURAN:
1. JANGAN sebut kategori (CASUAL/ACTION/AMBIGUOUS) di dalam pesan.
2. JANGAN pakai emoji berlebihan.
3. Langsung jawab, jangan pakai intro basi.
`;

    try {
      const body = {
        contents: [
          ...history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: h.parts
          })),
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ],
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1000
        }
      };

      const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 403) return "API key bermasalah. Pastikan konfigurasi benar.";
        if (response.status === 429) return "Terlalu banyak request. Tunggu sebentar ya.";
        if (response.status === 400) return "Ada masalah dengan permintaan. Coba lagi.";
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Vox bingung mau jawab apa...';
      
      // Cleanup labels if AI leaks them
      return rawText
        .replace(/^(CASUAL|ACTION|AMBIGUOUS):\s*/i, '')
        .replace(/^VOX:\s*/i, '')
        .trim();

    } catch (error: any) {
      console.error("Gemini Error: failed to get response"); // Safe log
      console.error('Gemini error detail:', {
        message: error.message,
        stack: error.stack
      });
      return "Vox lagi offline. Koneksi bermasalah, coba lagi ya!";
    }
  }

  async summarizeText(text: string): Promise<string> {
    try {
      const body = {
        contents: [{
          parts: [{ text: `Buat ringkasan poin-poin penting dari catatan berikut dalam Bahasa Indonesia, format bullet points, maksimal 10 poin:\n\n${text}` }]
        }]
      };

      const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal membuat ringkasan.';
    } catch (error) {
      console.error("Summarize error: failed");
      return 'Vox gagal memproses teks. Coba lagi ya.';
    }
  }

  async summarizeImage(file: File): Promise<string> {
    try {
      const toBase64 = (file: File): Promise<string> => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64Data = await toBase64(file);
      const body = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: file.type,
                data: base64Data
              }
            },
            {
              text: "Kamu adalah asisten akademik. Baca materi di foto ini dan buat ringkasan poin-poin penting dalam Bahasa Indonesia. Format: bullet points, maksimal 10 poin."
            }
          ]
        }]
      };

      const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to summarize image');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal membaca foto.';
    } catch (error) {
      console.error("Image summarize error: failed");
      return 'Vox gagal memproses foto. Coba lagi ya.';
    }
  }

  async summarizeAudio(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Step 1: Upload file ke Gemini Files API
      const formData = new FormData();
      formData.append('file', file);
      
      if (onProgress) onProgress(50); 

      const uploadRes = await fetch(
        `${BASE_URL.replace('/v1beta', '/upload/v1beta')}/files?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'multipart',
            'X-Goog-Upload-Command': 'start, upload, finalize',
            'X-Goog-Upload-Header-Content-Length': file.size.toString(),
            'X-Goog-Upload-Header-Content-Type': file.type
          },
          body: formData
        }
      );

      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const fileUri = uploadData.file.uri;

      if (onProgress) onProgress(100);

      // Step 2: Generate content dengan file URI
      const body = {
        contents: [{
          parts: [
            {
              file_data: {
                mime_type: file.type,
                file_uri: fileUri
              }
            },
            {
              text: "Ini rekaman kuliah. Buat ringkasan poin penting dalam Bahasa Indonesia. Format bullet points per topik."
            }
          ]
        }]
      };

      const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to generate audio content');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal memproses audio.';
    } catch (error) {
      console.error("Audio summarize error: failed");
      return 'Vox gagal memproses rekaman. Coba lagi ya.';
    }
  }

  async generateRoadmap(skillName: string): Promise<{ phases: any[] } | null> {
    try {
      const prompt = `Buat roadmap belajar skill "${skillName}" dalam 3 fase untuk mahasiswa. Balas HANYA dengan JSON valid:
{"phases":[{"id":"phase-1","title":"Fondasi","period":"Minggu 1-4","items":[{"id":"i1","title":"...","description":"...","completed":false}]},{"id":"phase-2","title":"Pengembangan","period":"Minggu 5-8","items":[{"id":"i4","title":"...","description":"...","completed":false}]},{"id":"phase-3","title":"Mahir","period":"Minggu 9-12","items":[{"id":"i7","title":"...","description":"...","completed":false}]}]}
Berikan 3 item per fase yang spesifik dan relevan dengan skill "${skillName}".`;

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to generate roadmap');
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (error) {
      console.error("generateRoadmap error: failed");
      return null;
    }
  }
}

export const geminiService = new GeminiService();
