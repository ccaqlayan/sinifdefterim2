import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Endpoint 1: Generate Parent Feedback Message in Turkish
app.post("/api/gemini/parent-feedback", async (req, res) => {
  try {
    const { studentName, subject, plusCount, minusCount, notebookAvg, homeworkRate, quizAvg, customNote } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response if API key is not configured
      const fallback = `Sayın Velimiz, ${studentName} isimli öğrencimizin ${subject} dersinde performansı: Artı/Eksi Net: ${plusCount - minusCount}, Defter Tamlığı: %${notebookAvg}, Ödev Tamamlama: %${homeworkRate}, Sınav/Quiz Ortalaması: ${quizAvg}. Öğrencimizin gelişimini desteklemek için iş birliğiniz için teşekkür ederiz.`;
      return res.json({ text: fallback, fallback: true });
    }

    const prompt = `Sen Türkiye'de görev yapan profesyonel, yapıcı, nezaketli bir branş öğretmenisin.
Öğrenci Adı: ${studentName}
Ders: ${subject}
Performans Bilgileri:
- Artı Sayısı: ${plusCount}, Eksi Sayısı: ${minusCount}
- Defter Kontrolü Ortalaması: %${notebookAvg}
- Ödev Tamamlama Oranı: %${homeworkRate}
- Sınav/Quiz Ortalaması: ${quizAvg}/100
- Özel Öğretmen Notu: ${customNote || 'Yok'}

Görev: Bu verileri kullanarak veliye WhatsApp veya SMS üzerinden gönderilecek, samimi, saygılı, destekleyici ve kısa (maksimum 3-4 cümle) bir veli bilgilendirme mesajı tasarla. Mesaj öğrencinin güçlü yönlerini takdir etsin ve varsa eksik olduğu alana (defter, ödev, quiz vb.) nazikçe dikkat çeksin.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Parent Feedback Error:", err);
    res.status(500).json({ error: "Geri bildirim mesajı üretilemedi", details: err.message });
  }
});

// AI Endpoint 2: Student Performance Summary & Personal Action Plan
app.post("/api/gemini/student-advice", async (req, res) => {
  try {
    const { studentName, subject, finalScore, stats } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallback = `Öğrencimiz ${studentName}, ${subject} dersinden ${finalScore} ortalama puana sahiptir. Düzenli defter tutumu ve eksiksiz ödev teslimi ile başarısını artırabilir.`;
      return res.json({ text: fallback, fallback: true });
    }

    const prompt = `Sen uzman bir rehberlik ve branş öğretmenisin.
Öğrenci: ${studentName} (${subject} Dersi)
Dönem Sonu Başarı Puanı: ${finalScore}/100
Detaylı İstatistikler: ${JSON.stringify(stats)}

Görev:
1. Öğrencinin durumunu değerlendiren 2 cümlelik pedagogik analiz yap.
2. Öğrencinin notunu yükseltmesi için 3 adet somut, uygulanabilir tavsiye listele (Defter düzeni, soru çözümü, ödev takibi vb.).
Türkçe olarak yanıt ver.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Student Advice Error:", err);
    res.status(500).json({ error: "Öğrenci tavsiyesi üretilemedi", details: err.message });
  }
});

// AI Endpoint 3: Homework Idea Generator for Teachers
app.post("/api/gemini/suggest-homework", async (req, res) => {
  try {
    const { subject, grade, topic } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        text: `${grade}. Sınıf ${subject} dersi (${topic || 'Genel Tekrar'}) için ödev önerisi:\n1. Konu özetinin deftere yazılması.\n2. Ders kitabındaki test sorularının çözülmesi.`,
        fallback: true
      });
    }

    const prompt = `Öğretmen için yaratıcı ve müfredata uygun ödev önerisi oluştur.
Sınıf Düzeyi: ${grade}. Sınıf
Ders: ${subject}
Konu/Ünite: ${topic || 'Haftalık Genel Tekrar ve Kavram Kontrolü'}

Lütfen:
1. Ödev Başlığı
2. Kısa Açıklama ve Adımlar
3. Deftere Yazılacak / Hazırlanacak Kısmı net belirten pratik bir ödev metni çıkar.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Homework Suggestion Error:", err);
    res.status(500).json({ error: "Ödev önerisi oluşturulamadı" });
  }
});

async function startServer() {
  // Vite middleware in dev mode or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Öğretmen Takip Portalı Sunucusu http://0.0.0.0:${PORT} üzerinde çalışıyor.`);
  });
}

startServer();
