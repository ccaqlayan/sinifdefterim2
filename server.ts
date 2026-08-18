import express from "express";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

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

// Resilient Gemini generateContent caller with model fallback & retry for 503/429/temporary outages
const CANDIDATE_FLASH_MODELS = [
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview"
];

async function generateWithGeminiFallback(ai: GoogleGenAI, requestConfig: { contents: any; config?: any }, preferredModels = CANDIDATE_FLASH_MODELS) {
  let lastError: any = null;

  for (const model of preferredModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestConfig.contents,
        config: requestConfig.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
      
      // If transient error on first model, wait a moment and try next candidate model silently
      if (isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      continue; // Move directly to next candidate model
    }
  }

  throw lastError || new Error("All Gemini models failed to respond.");
}

// Smart Turkish heuristic parser for lesson notes (Used as zero-fail fallback when AI is temporarily unavailable)
function heuristicParseLessonLog(rawText: string, className?: string, subject?: string) {
  const text = (rawText || "").trim();
  
  // 1. Detect page & question
  let lastPageAndQuestion = "";
  const pageMatch = text.match(/(?:sayfa|sf\.?)\s*(\d+)/i);
  const questionMatch = text.match(/(?:soru|soruda|sorusunda|örnek|etkinlik|test)\s*(\d+[\w-]*)/i);
  
  if (pageMatch && questionMatch) {
    lastPageAndQuestion = `Sayfa ${pageMatch[1]}, Soru ${questionMatch[1]}`;
  } else if (pageMatch) {
    lastPageAndQuestion = `Sayfa ${pageMatch[1]}`;
  } else if (questionMatch) {
    lastPageAndQuestion = `Soru ${questionMatch[1]}`;
  } else if (text.match(/test\s*(\d+)/i)) {
    lastPageAndQuestion = `Test ${text.match(/test\s*(\d+)/i)?.[1]}`;
  } else {
    lastPageAndQuestion = "Ders İşlendi";
  }

  // 2. Detect topic
  let lastTopic = subject || "Ders Konusu";
  const topicMatch = text.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ\s]{3,30}?)(?:\s*konusunda|\s*ünitesinde|\s*'de|\s*de|\s*da|\s*'da|\s*bitti|\s*kaldık)/i);
  if (topicMatch && topicMatch[1] && topicMatch[1].trim().length > 2 && !topicMatch[1].toLowerCase().includes("bugün")) {
    lastTopic = topicMatch[1].trim();
  }

  // 3. Detect Next Lesson Actions
  const nextLessonActions: string[] = [];
  if (text.match(/ödev/i)) {
    nextLessonActions.push("Ödev kontrolü ve çözülemeyen sorular incelenecek");
  }
  if (text.match(/(?:sorudan|sorudan itibaren|kaldığımız yerden)\s*devam/i) || pageMatch) {
    nextLessonActions.push(pageMatch ? `Sayfa ${pageMatch[1]} kalan sorular çözülecek` : "Kaldığımız yerden soru çözümüne devam edilecek");
  }
  if (text.match(/(?:test|etkinlik|deney|örnek)/i)) {
    nextLessonActions.push("Ders içi pekiştirme etkinlikleri tamamlanacak");
  }
  if (nextLessonActions.length === 0) {
    nextLessonActions.push("Ders tekrarı ve soru çözümü yapılacak");
  }

  // 4. Class atmosphere note
  let classAtmosphereNote = "";
  if (text.match(/(?:gürültü|ses|konuşan|uyarı)/i)) {
    classAtmosphereNote = "Sınıf içi ses ve gürültü seviyesi zaman zaman yükseldi.";
  } else if (text.match(/(?:katılım|ilgi|harika|çok iyi|başarılı|canlı|aktif)/i)) {
    classAtmosphereNote = "Sınıfın derse katılımı ve motivasyonu oldukça yüksekti.";
  }

  // 5. Summary
  const summary = `${lastTopic} işlendi, ${lastPageAndQuestion} noktasında kalındı. Gelecek ders için hazırlıklar planlandı.`;

  return {
    success: true,
    lastTopic,
    lastPageAndQuestion,
    nextLessonActions,
    classAtmosphereNote,
    summary: text.length > 20 ? summary : (text || summary),
    fallback: true,
  };
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Check if ornekplan.xlsx exists in root directory and parse it
app.get("/api/check-ornekplan", (req, res) => {
  try {
    const rootPath = process.cwd();
    const possiblePaths = [
      path.join(rootPath, "ornekplan.xlsx"),
      path.join(rootPath, "örnekplan.xlsx"),
      path.join(rootPath, "ornek_plan.xlsx"),
      path.join(rootPath, "assets", "ornekplan.xlsx"),
    ];

    let foundPath = possiblePaths.find((p) => fs.existsSync(p));

    if (!foundPath) {
      return res.json({ exists: false, message: "ornekplan.xlsx henüz ana klasörde bulunamadı." });
    }

    const fileBuffer = fs.readFileSync(foundPath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;

    const sheetsData: any[] = [];
    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      sheetsData.push({
        sheetName,
        rowCount: rows.length,
        rowsSample: rows.slice(0, 30),
      });
    });

    res.json({
      exists: true,
      fileName: path.basename(foundPath),
      sheetNames,
      sheetsData,
    });
  } catch (err: any) {
    console.error("Error reading ornekplan.xlsx:", err);
    res.status(500).json({ error: "Excel dosyası okunamadı", details: err.message });
  }
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

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Parent Feedback Error:", err);
    const { studentName, subject, plusCount, notebookAvg, homeworkRate } = req.body || {};
    res.json({
      text: `Sayın Velimiz, öğrencimiz ${studentName || ''}'in ${subject || 'ders'} takibinde ${plusCount || 0} artı, %${notebookAvg || 80} defter düzeni ve %${homeworkRate || 80} ödev başarısı bulunmaktadır. Gayreti için tebrik ederiz.`,
      fallback: true
    });
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

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Student Advice Error:", err);
    const { studentName, subject, finalScore } = req.body || {};
    res.json({
      text: `Öğrencimiz ${studentName || ''}, ${subject || ''} dersinde ${finalScore || 75} puan seviyesindedir.\n1. Günlük konu tekrarlarını aksatmamalıdır.\n2. Defter ve ödev kontrollerine özen göstermelidir.\n3. Yanlış yaptığı soruları öğretmene danışmalıdır.`,
      fallback: true
    });
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

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Homework Suggestion Error:", err);
    const { subject, grade, topic } = req.body || {};
    res.json({
      text: `${grade || '9'}. Sınıf ${subject || 'Ders'} - ${topic || 'Kazanım Pekiştirme'} Ödevi:\n1. Ders kitabındaki konu sonu etkinliklerini tamamlayınız.\n2. Formül ve kavram özetini deftere çıkarınız.`,
      fallback: true
    });
  }
});

// AI Endpoint 4: Parse PDF / Image Class List Grid (e-Okul Fotoğraflı Liste)
app.post("/api/gemini/parse-pdf-class-list", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: "Gemini API anahtarı ayarlanmamış." });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "Görsel verisi bulunamadı." });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Sen e-Okul ve okul sınıf fotoğraflı öğrenci listesi belgelerini analiz eden uzman bir yapay zekasın.
Sana verilen resim, bir e-Okul veya okul fotoğraflı sınıf listesi belgesidir.

Görevlerin:
1. "className": Sayfanın üst alanında yer alan sınıf/şube adını tespit et (Örn: "AL - 9. Sınıf / C Şubesi" -> "9-C", "10-A", "11/B", "5-A" şeklinde kısa sınıf adı).
2. "students": Sayfadaki HER BİR ÖĞRENCİ İÇİN aşağıdaki bilgileri içeren JSON dizisi oluştur:
   - "number": Öğrencinin vesikalık fotoğrafının altında yer alan okul numarası (örn: "57", "245", "1352"). Sadece rakamlar.
   - "fullName": Öğrencinin fotoğrafının altındaki adı ve soyadı (örn: "RUMEYSA GÜL DEMİROĞLU").
   - "photoBox": Öğrencinin YALNIZCA vesikalık/kafa fotoğrafını kapsayan dikdörtgen kutunun normalize koordinatları [ymin, xmin, ymax, xmax].
     ÖNEMLİ KOORDİNAT KURALLARI:
     - Değerler 0 ile 1000 arasında tamsayılar olmalıdır (resim yüksekliği ve genişliğine göre 0-1000 skalası).
     - photoBox SADECE öğrencinin vesikalık fotoğraf çerçevesini kapsasın; alttaki isim ve numara metinlerini İÇERMESİN.

Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak ver. Başka açıklama veya markdown bloğu ekleme.
Örnek Yanıt Formatı:
{
  "className": "9/C",
  "students": [
    {
      "number": "57",
      "fullName": "RUMEYSA GÜL DEMİROĞLU",
      "photoBox": [100, 50, 180, 110]
    }
  ]
}`;

    const response = await generateWithGeminiFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // Fallback cleanup if response has markdown fences
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    res.json(parsed);
  } catch (err: any) {
    console.error("PDF Class List Parsing Error:", err);
    res.status(500).json({ error: "PDF sayfasından öğrenciler ayrıştırılamadı.", details: err.message });
  }
});

// AI Endpoint 5: AI-Powered Annual Plan Sheet Cleaner & Structurer
app.post("/api/gemini/parse-plan", async (req, res) => {
  try {
    const { sheetName, grade, rawRows } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: "Gemini API anahtarı ayarlanmamış." });
    }

    const prompt = `Sen Türkiye Milli Eğitim Bakanlığı (MEB) Yıllık Ders Planlarını analiz eden uzman bir eğitim teknolojisi yapay zekasısın.
Sana verilen ham Excel satır verileri, "${sheetName || 'Sınıf'}" sekmesine aittir. (Tahmini Sınıf Düzeyi: ${grade || '5'}).

Görevlerin:
1. Bu ham tablo verisinden haftalık plan maddelerini tespit et.
2. Her bir ders haftası için şu alanları çıkar ve JSON formatında döndür:
   - "week": Hafta numarası (1, 2, 3... 36)
   - "dateRange": Tarih aralığı metni (örn: "08-12 Eylül")
   - "theme": Ünite veya Tema Adı
   - "topic": Konu veya Alt Konu Adı
   - "outcome": Öğrenme Çıktısı veya Kazanım Metni
   - "description": Yöntem-Teknik, Etkinlik, Araç-Gereç veya Değerlendirme Açıklamaları (Varsa)

Lütfen yanıtını YALNIZCA geçerli bir JSON dizisi formatında dök:
[
  {
    "week": 1,
    "dateRange": "08-12 Eylül",
    "theme": "Bilişim Teknolojileri ve Günlük Yaşam",
    "topic": "Bilişim Teknolojilerinin Temel Kavramları",
    "outcome": "Bilişim teknolojileri kavramlarını açıklar.",
    "description": "Anlatım, Soru-Cevap"
  }
]

Ham Satır Verileri:
${JSON.stringify((rawRows || []).slice(0, 100))}`;

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "[]";
    let parsed = [];
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    res.json({ items: parsed });
  } catch (err: any) {
    console.error("Gemini Plan Parsing Error:", err);
    res.status(500).json({ error: "Yıllık plan yapay zeka ile analiz edilemedi.", details: err.message });
  }
});

// AI Endpoint 6: AI Column Detection & Smart Role Mapping for Excel Annual Plans
app.post("/api/gemini/detect-columns", async (req, res) => {
  try {
    const { sheetName, rawRows, savedUserRules } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: "Gemini API anahtarı ayarlanmamış." });
    }

    if (!rawRows || !Array.isArray(rawRows) || rawRows.length === 0) {
      return res.status(400).json({ error: "İncelenecek satır verisi bulunamadı." });
    }

    // Pass first 25 sample rows (header + content) to Gemini for accurate detection
    const sampleRows = rawRows.slice(0, 25);

    const prompt = `Sen Türkiye Milli Eğitim Bakanlığı (MEB) Yıllık Ders Planı ve "Türkiye Yüzyılı Maarif Modeli" Excel dosyalarını analiz eden uzman bir yapay zekasın.
Sana verilen ham Excel tablosu "${sheetName || 'Plan'}" isimli çalışma sayfasına aittir.

GÖREVİN:
Verilen tablodaki HER BİR SÜTUN İÇİN (0, 1, 2, 3... vb. sütun indeksleri), hem başlık metinlerini hem de altındaki örnek veri hücrelerini son derece dikkatli inceleyerek sütunun tam olarak hangi işleve (role) sahip olduğunu belirlemektir.

${savedUserRules && Object.keys(savedUserRules).length > 0 ? `
KULLANICI TARAFINDAN EĞİTİLMİŞ ÖZEL EŞLEŞTİRME KURALLARI (BU KURALLARI BİREBİR UYGULA):
${JSON.stringify(savedUserRules, null, 2)}
` : ''}

MEB / MAARİF MODELİ STANDART SÜTUN EŞLEŞTİRME REHBERİ (KESİN KURALLAR):
1. "AY" -> "ignore" (Yoksay)
2. "HAFTA" (örneğin "1. Hafta: 8-12 Eylül" içeren sütun) -> "dateRange" veya "week"
3. "DERS SAATİ" -> "ignore" (Yoksay)
4. "ÜNİTE/TEMA", "ÜNİTE", "TEMA", "ÖĞRENME ALANI" -> "theme" (Tema / Ünite)
5. "KONU (İÇERİK ÇERÇEVESİ)", "KONU", "ALT KONU" -> "topic" (Konu)
6. "ÖĞRENME ÇIKTILARI", "KAZANIM", "KAZANIMLAR" -> "outcome" (Öğrenme Çıktısı / Kazanım)
7. "SÜREÇ BİLEŞENLERİ", "YÖNTEM VE TEKNİKLER", "AÇIKLAMALAR" -> "description" (Açıklama / Yöntem-Teknik)
8. "ÖLÇME VE DEĞERLENDİRME", "SOSYAL - DUYGUSAL ÖĞRENME BECERİLERİ", "DEĞERLER", "OKURYAZARLIK BECERİLERİ", "BELİRLİ GÜN VE HAFTALAR" -> "ignore" (Yoksay)

MÜMKÜN OLAN SÜTUN ROLLERİ ("role"):
- "week": Hafta Numarası
- "dateRange": Tarih Aralığı veya Hafta/Tarih Bilgisi
- "theme": Ünite veya Tema Adı
- "topic": Konu veya Alt Konu
- "outcome": Öğrenme Çıktısı / Kazanım Cümleleri
- "description": Süreç Bileşenleri, Açıklamalar veya Yöntem-Teknikler
- "ignore": AY, DERS SAATİ, ÖLÇME VE DEĞERLENDİRME, DEĞERLER, OKURYAZARLIK, BELİRLİ GÜN VE HAFTALAR veya gereksiz sütunlar

ÖNEMLİ KRİTERLER:
1. "detectedHeaderIndex": Tablodaki sütun başlıklarının ("AY", "HAFTA", "ÜNİTE/TEMA", "KONU", "ÖĞRENME ÇIKTILARI" vb.) yer aldığı satır numarasını (0-tabanlı tamsayı) belirle.
2. "columnMappings": Her sütun indeksi (0, 1, 2... vb. sayısal string key'leri) için yukarıdaki rollerden TAM OLARAK BİRİNİ seç.

Lütfen YALNIZCA aşağıdaki JSON formatında yanıt ver:
{
  "detectedHeaderIndex": 0,
  "columnMappings": {
    "0": "ignore",
    "1": "dateRange",
    "2": "ignore",
    "3": "theme",
    "4": "topic",
    "5": "outcome",
    "6": "description",
    "7": "ignore",
    "8": "ignore",
    "9": "ignore",
    "10": "ignore",
    "11": "ignore"
  }
}

İncelenecek Örnek Satırlar:
${JSON.stringify(sampleRows)}`;

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      detectedHeaderIndex: typeof parsed.detectedHeaderIndex === "number" ? parsed.detectedHeaderIndex : 0,
      columnMappings: parsed.columnMappings || {},
    });
  } catch (err: any) {
    console.error("Gemini Column Detection Error:", err);
    res.status(500).json({ error: "Sütunlar yapay zeka ile tahmin edilemedi.", details: err.message });
  }
});

// AI Endpoint 7: Digital Lesson Log & "Where We Left Off" Intelligent Parser
app.post("/api/gemini/parse-lesson-log", async (req, res) => {
  const { rawText, className, subject } = req.body;

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "Ders notu metni boş olamaz." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Fallback regex / heuristic parser if Gemini API key is missing
    return res.json(heuristicParseLessonLog(rawText, className, subject));
  }

  try {
    const prompt = `Sen Türkiye'de görev yapan bir öğretmenin dijital ders seyir defteri asistanısın.
Öğretmen bir dersin son saniyelerinde sesli veya yazılı olarak serbest formatta bir ders sonu notu girmiştir.
Sınıf: ${className || 'Sınıf'}
Ders/Branş: ${subject || 'Ders'}

Öğretmenin Girdiği Ham Not:
"""
${rawText}
"""

GÖREVİN:
Bu serbest metni son derece akıllı bir şekilde analiz et ve aşağıdaki JSON alanlarını yapılandırılmış olarak çıkar:
1. "lastTopic": İşlenen/kalınan ünite veya konu başlığı (Örn: "Türev ve Anlık Hız", "Maddenin Halleri", "Milli Edebiyat Dönemi"). Metinde geçmiyorsa mantıklı bir konu adı çıkar.
2. "lastPageAndQuestion": Tam olarak kalınan sayfa, soru, test veya etkinlik detayı (Örn: "Sayfa 48, Soru 3", "Kazanım Testi 4 Soru 6", "Etkinlik 2B").
3. "nextLessonActions": Gelecek derste yapılması gereken somut eylem maddeleri dizisi (Örn: ["5. sorudan devam edilecek", "Ödev kontrolü yapılacak", "Ahmet'in sorusuna bakılacak"]).
4. "classAtmosphereNote": Sınıfın motivasyonu, disiplini, gürültü seviyesi veya genel öğrenci ilgisiyle ilgili not (Örn: "Sınıfın katılımı yüksekti ancak ders sonuna doğru ses arttı.", "Grup çalışması çok verimli geçti."). Metinde yoksa boş bırakılabilir.
5. "summary": Bir sonraki derse girerken öğretmenin ekranda ilk 3 saniyede okuyup hatırlayacağı 1-2 cümlelik akıcı, net özet.

Lütfen YALNIZCA aşağıdaki JSON formatında yanıt ver:
{
  "lastTopic": "...",
  "lastPageAndQuestion": "...",
  "nextLessonActions": ["...", "..."],
  "classAtmosphereNote": "...",
  "summary": "..."
}`;

    const response = await generateWithGeminiFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      lastTopic: parsed.lastTopic || subject || "Ders Konusu",
      lastPageAndQuestion: parsed.lastPageAndQuestion || "Ders İşlendi",
      nextLessonActions: Array.isArray(parsed.nextLessonActions) && parsed.nextLessonActions.length > 0 ? parsed.nextLessonActions : ["Ders tekrarı ve soru çözümü yapılacak"],
      classAtmosphereNote: parsed.classAtmosphereNote || "",
      summary: parsed.summary || rawText,
    });
  } catch (err: any) {
    console.warn("Gemini Lesson Log Parse Warning (Using Smart Fallback):", err?.message || err);
    // Gracefully return our smart heuristic parse result instead of throwing 500 error
    return res.json(heuristicParseLessonLog(rawText, className, subject));
  }
});

// AI Endpoint 8: Parse Weekly Schedule from Photo / Image (Haftalık Öğretmen Ders Programı Çizelgesi Analizi)
app.post("/api/gemini/parse-schedule-image", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: "Gemini API anahtarı ayarlanmamış." });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "Görsel verisi bulunamadı." });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Sen Türkiye Milli Eğitim Bakanlığı (MEB) resmi Öğretmen Haftalık Ders Programı (Çizelge) belgelerini ve fotoğraflarını en ince detayına kadar hatasız okuyan uzman bir yapay zekasın.

Sana verilen fotoğraf veya taranmış belge, bir öğretmenin haftalık ders programı tablosudur (örneğin MEB e-Okul / Okul Yönetim Sistemi formatında haftalık ders dağıtım çizelgesi).

LÜTFEN GÖRSELİ DİKKATLE İNCELE VE ŞU BİLGİLERİ EKSİKSİZ TESPİT ET:

1. ÜST BİLGİLER (Header):
   - "schoolName": Okul Adı (örn: "Kestel Hasan Aslanoba Anadolu Lisesi" veya belgede yazan okul adı)
   - "teacherName": Öğretmenin Adı Soyadı (örn: "Adı Soyadı: ..." alanındaki isim)
   - "mentorship": Sınıf Öğretmenliği / Rehberlik sınıfı (örn: "12/A" veya "9/C", yoksa "")
   - "dutyInfo": Nöbet Günü ve Yeri (örn: "Pazartesi / Zemin Kat" veya "Çarşamba / 1. Kat", yoksa "")
   - "startDate": Program Başlangıç Tarihi (örn: "01/02/2025" veya "09/09/2024", yoksa "")

2. DERS SAATLERİ (Period Times) & ÖĞLE ARASI (Lunch Break) ANALİZİ:
   Tablonun üst satırında yer alan ders numaraları (1), (2), (3), (4), (5), (6), (7), (8)... ve hemen altındaki/yanındaki başlama-bitiş saatlerini çıkar.
   Örnek:
   (1) 08:40 - 09:20 -> { "period": 1, "startTime": "08:40", "endTime": "09:20" }
   (2) 09:35 - 10:15 -> { "period": 2, "startTime": "09:35", "endTime": "10:15" }
   (3) 10:20 - 11:00 -> { "period": 3, "startTime": "10:20", "endTime": "11:00" }
   (4) 11:10 - 11:50 -> { "period": 4, "startTime": "11:10", "endTime": "11:50" }
   (5) 12:00 - 12:40 -> { "period": 5, "startTime": "12:00", "endTime": "12:40" }
   (6) 13:30 - 14:10 -> { "period": 6, "startTime": "13:30", "endTime": "14:10" }
   (7) 14:20 - 15:00 -> { "period": 7, "startTime": "14:20", "endTime": "15:00" }
   (8) 15:10 - 15:50 -> { "period": 8, "startTime": "15:10", "endTime": "15:50" }

   ÖĞLE ARASI TESPİTİ:
   Saatler arasındaki en uzun aralığı incele (örn: 5. dersin bitişi 12:40 ile 6. dersin başlangıcı 13:30 arasında 50 dakika var. Bu 50 dakikalık öğle arasıdır).
   Buna göre:
   - "lunchBreakAfterPeriod": 5 (Hangi ders saatinden sonra olduğu)
   - "lunchBreakMinutes": 50 (Öğle arası süresi dakika cinsinden)

3. DERS LEJANTI / DERS ADI TABLOSU (Sayfanın altındaki "Yer Adı - Sınıf - Ders - Ders Adı - Toplam" tablosu):
   Belgenin altındaki açıklamalar tablosunu oku. Bu tabloda ders kısaltmaları ile tam ders adları eşleştirilmiştir:
   Örnekler:
   - Ders: "MAT4", Ders Adı: "SEÇMELİ MATEMATİK"
   - Ders: "SMAT", Ders Adı: "SEÇMELİ İLERİ MATEMATİK"
   - Ders: "MAT", Ders Adı: "MATEMATİK"
   - Ders: "REH", Ders Adı: "REHBERLİK VE YÖNLENDİRME"
   - Ders: "T SOS", Ders Adı: "TÜRK SOSYAL HAYATINDA AİLE"
   - Ders: "FİZ", Ders Adı: "FİZİK"
   - Ders: "KİM", Ders Adı: "KİMYA"
   - Ders: "BİY", Ders Adı: "BİYOLOJİ"
   - Ders: "BED", Ders Adı: "BEDEN EĞİTİMİ VE SPOR"
   - Ders: "DİN", Ders Adı: "DİN KÜLTÜRÜ VE AHLAK BİLGİSİ"
   - Ders: "TAR", Ders Adı: "TARİH"
   - Ders: "COĞ", Ders Adı: "COĞRAFYA"
   - Ders: "İNG", Ders Adı: "YABANCI DİL (İNGİLİZCE)"
   - Ders: "EDE" veya "TDE", Ders Adı: "TÜRK DİLİ VE EDEBİYATI"

4. HAFTALIK DERS TABLOSU HÜCRELERİ (Lessons Grid):
   Tablodaki Pazartesi, Salı, Çarşamba, Perşembe, Cuma günlerine ait her bir dolu ders hücresini tara.
   Hücre içi yapısı genellikle şöyledir:
   - Üst Satır: Sınıf Kodu (Örn: "12/C", "12/E", "9/C", "11/A", "12/A", "12/D", "10/B")
   - Alt Satır: Ders Kodu (Örn: "MAT4", "MAT", "SMAT", "REH", "T SOS")

   HER DOLU DERS HÜCRESİ İÇİN:
   - "day": 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz'
   - "period": Ders saati numarası (1, 2, 3, 4, 5, 6, 7, 8...)
   - "className": Sınıf adı (örn: "12/C", "12/E", "9/C", "11/A", "12/A", "12/D")
   - "subjectCode": Ders kodu (örn: "MAT4", "MAT", "SMAT", "REH", "T SOS")
   - "subjectName": Lejanttan eşleşen tam ders adı (örn: "Seçmeli Matematik", "Rehberlik ve Yönlendirme", "Matematik")
   - "title": Sınıf ve ders adını içeren tam başlık (örn: "12/C Seçmeli Matematik" veya "9/C Matematik")
   - "shortName": Tablo kutularında görünen kodlu kısa ad (örn: "12/C MAT4", "11/A SMAT", "9/C MAT")
   - "cleanShortName": Yalnızca sınıf adı olan sade kod (örn: "12/C", "11/A", "9/C", "12/E")
   - "startTime": O periyoda ait başlangıç saati (örn: "08:40")
   - "endTime": O periyoda ait bitiş saati (örn: "09:20")

5. SINIF VE DERS BAZLI AYIRT EDİCİ RENKLENDİRME (uniqueGroups):
   ÖNEMLİ: Renklendirme sadece MAT4 ders adına göre değil, öncelikli olarak SINIF İSİMLERİNE (12/C, 12/E, 9/C, 11/A, 12/A) göre ayırt edici olmalıdır.
   - Her farklı sınıfa (12/C, 12/E, 9/C, 11/A, 12/A) birbirinden tamamen farklı, yüksek kontrastlı ve şık renkler ata (örn: Mavi #3B82F6, Yeşil #10B981, Amber #F59E0B, Mor #8B5CF6, Kırmızı #EF4444 vb.).
   - Eğer aynı sınıfın birden fazla dersi varsa (örn: 12/A'nın hem Matematik hem Rehberlik dersi varsa), rehberlik dersi için de ayrı ve farklı bir renk tanımla (örn: 12/A MAT4 için #EF4444, 12/A REH için #06B6D4).

ÇIKTI FORMATI:
YALNIZCA geçerli bir JSON nesnesi döndür. Markdown etiketleri (\`\`\`json) ekleme veya sade JSON ver:

{
  "schoolName": "Kestel Hasan Aslanoba Anadolu Lisesi",
  "teacherName": "Ahmet Yılmaz",
  "mentorship": "12/A",
  "dutyInfo": "Pazartesi / Zemin Kat",
  "startDate": "01/02/2025",
  "totalWeeklyHours": 24,
  "periodsPerDay": 8,
  "lunchBreakAfterPeriod": 5,
  "lunchBreakMinutes": 50,
  "periodTimes": [
    { "period": 1, "startTime": "08:40", "endTime": "09:20" },
    { "period": 2, "startTime": "09:35", "endTime": "10:15" },
    { "period": 3, "startTime": "10:20", "endTime": "11:00" },
    { "period": 4, "startTime": "11:10", "endTime": "11:50" },
    { "period": 5, "startTime": "12:00", "endTime": "12:40" },
    { "period": 6, "startTime": "13:30", "endTime": "14:10" },
    { "period": 7, "startTime": "14:20", "endTime": "15:00" },
    { "period": 8, "startTime": "15:10", "endTime": "15:50" }
  ],
  "uniqueGroups": [
    { "groupKey": "12/C - MAT4", "className": "12/C", "subjectCode": "MAT4", "subjectName": "Seçmeli Matematik", "color": "#3B82F6", "weeklyHours": 6 },
    { "groupKey": "12/E - MAT4", "className": "12/E", "subjectCode": "MAT4", "subjectName": "Seçmeli Matematik", "color": "#10B981", "weeklyHours": 6 },
    { "groupKey": "9/C - MAT", "className": "9/C", "subjectCode": "MAT", "subjectName": "Matematik", "color": "#F59E0B", "weeklyHours": 6 },
    { "groupKey": "11/A - SMAT", "className": "11/A", "subjectCode": "SMAT", "subjectName": "Seçmeli İleri Matematik", "color": "#8B5CF6", "weeklyHours": 6 },
    { "groupKey": "12/A - MAT4", "className": "12/A", "subjectCode": "MAT4", "subjectName": "Seçmeli Matematik", "color": "#EF4444", "weeklyHours": 6 }
  ],
  "lessons": [
    {
      "day": "Pzt",
      "period": 1,
      "className": "12/C",
      "subjectCode": "MAT4",
      "subjectName": "Seçmeli Matematik",
      "title": "12/C Seçmeli Matematik",
      "shortName": "12/C MAT4",
      "cleanShortName": "12/C",
      "color": "#3B82F6",
      "startTime": "08:40",
      "endTime": "09:20"
    }
  ]
}`;

    const response = await generateWithGeminiFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      ...parsed,
    });
  } catch (err: any) {
    console.error("Gemini Schedule Image Parsing Error:", err);
    res.status(500).json({ error: "Ders programı fotoğrafı ayrıştırılamadı.", details: err.message });
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
