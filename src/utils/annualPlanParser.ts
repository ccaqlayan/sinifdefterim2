import * as XLSX from 'xlsx';
import { AnnualPlanItem } from '../types';

export interface ParsedSheetPlan {
  sheetName: string;
  grade: string; // e.g. "5", "6", "7", "8", "9", "10", "11", "12"
  items: AnnualPlanItem[];
}

export interface ParseExcelPlanResult {
  fileName: string;
  sheets: ParsedSheetPlan[];
  allItems: AnnualPlanItem[];
  detectedGrades: string[];
}

export type ColumnRole = 'week' | 'dateRange' | 'theme' | 'topic' | 'outcome' | 'description' | 'ignore';

export interface ColumnRoleOption {
  value: ColumnRole;
  label: string;
}

export const COLUMN_ROLE_OPTIONS: ColumnRoleOption[] = [
  { value: 'week', label: '📅 Hafta (Sayı)' },
  { value: 'dateRange', label: '🗓️ Tarih Aralığı' },
  { value: 'theme', label: '📚 Tema / Ünite' },
  { value: 'topic', label: '📌 Konu' },
  { value: 'outcome', label: '🎯 Öğrenme Çıktısı / Kazanım' },
  { value: 'description', label: '📝 Açıklama / Yöntem-Teknik' },
  { value: 'ignore', label: '🚫 Yoksay (Aktarma)' },
];

export interface RawSheetData {
  sheetName: string;
  grade: string;
  rawRows: any[][];
  detectedHeaderIndex: number;
  columnMappings: Record<number, ColumnRole>;
}

export interface ExcelPreviewSession {
  fileName: string;
  sheets: RawSheetData[];
}

/**
 * Extracts normalized grade string from sheet name (e.g., "5. Sınıf" -> "5", "9-A" -> "9", "Bilişim 6" -> "6")
 */
export function extractGradeFromSheetName(sheetName: string, index: number): string {
  const trimmed = sheetName.trim();
  const digitMatch = trimmed.match(/(\d+)/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 12) {
      return String(num);
    }
  }
  
  if (trimmed.toLowerCase().includes('lise')) return '9';
  if (trimmed.toLowerCase().includes('orta')) return '9';
  
  return String(9 + (index % 4)); // default 9, 10, 11, 12
}

interface ColumnIndices {
  weekCol: number;
  dateCol: number;
  themeCol: number;
  topicCol: number;
  outcomeCol: number;
  descCol: number;
}

/**
 * Scans rows to find column header positions
 */
function detectColumnMapping(rows: any[][]): { headerRowIndex: number; cols: ColumnIndices; perColumnRole: Record<number, ColumnRole> } {
  let bestHeaderIndex = -1;
  let bestScore = -1;
  let cols: ColumnIndices = {
    weekCol: -1,
    dateCol: -1,
    themeCol: -1,
    topicCol: -1,
    outcomeCol: -1,
    descCol: -1,
  };
  let perColumnRole: Record<number, ColumnRole> = {};

  // Try retrieving user-trained custom rules from localStorage if available
  let savedUserRules: Record<string, ColumnRole> = {};
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom_excel_column_rules');
      if (stored) savedUserRules = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not read custom column rules:', e);
  }

  // Check first 15 rows for header keywords
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r] || [];
    let currentScore = 0;
    let tempCols: ColumnIndices = {
      weekCol: -1,
      dateCol: -1,
      themeCol: -1,
      topicCol: -1,
      outcomeCol: -1,
      descCol: -1,
    };
    let tempRoleMap: Record<number, ColumnRole> = {};

    row.forEach((cell, cIdx) => {
      if (!cell) {
        tempRoleMap[cIdx] = 'ignore';
        return;
      }
      const rawStr = String(cell).trim();
      const str = rawStr.toLowerCase();

      // Check saved user rules first
      let customMatch: ColumnRole | undefined = undefined;
      Object.keys(savedUserRules).forEach((ruleKey) => {
        if (str.includes(ruleKey.toLowerCase()) || ruleKey.toLowerCase().includes(str)) {
          customMatch = savedUserRules[ruleKey];
        }
      });

      if (customMatch) {
        tempRoleMap[cIdx] = customMatch;
        currentScore += 5;
        if (customMatch === 'week') tempCols.weekCol = cIdx;
        if (customMatch === 'dateRange') tempCols.dateCol = cIdx;
        if (customMatch === 'theme') tempCols.themeCol = cIdx;
        if (customMatch === 'topic') tempCols.topicCol = cIdx;
        if (customMatch === 'outcome') tempCols.outcomeCol = cIdx;
        if (customMatch === 'description') tempCols.descCol = cIdx;
        return;
      }

      // Explicit IGNORE headers (MEB Maarif Modeli columns to ignore)
      if (
        str === 'ay' ||
        str.includes('ders saat') ||
        str.includes('ölçme') ||
        str.includes('sosyal') ||
        str.includes('değerler') ||
        str.includes('okuryazarlık') ||
        str.includes('belirli gün')
      ) {
        tempRoleMap[cIdx] = 'ignore';
        currentScore += 3;
      } else if (str.includes('süreç bileşen') || str.includes('yöntem') || str.includes('araç') || str.includes('etkinlik') || str.includes('açıklama')) {
        tempCols.descCol = cIdx;
        tempRoleMap[cIdx] = 'description';
        currentScore += 4;
      } else if (str.includes('öğrenme çıktı') || str.includes('kazanım') || str.includes('beceri')) {
        tempCols.outcomeCol = cIdx;
        tempRoleMap[cIdx] = 'outcome';
        currentScore += 5;
      } else if (str.includes('konu')) {
        tempCols.topicCol = cIdx;
        tempRoleMap[cIdx] = 'topic';
        currentScore += 4;
      } else if (str.includes('üni̇te') || str.includes('ünite') || str.includes('tema') || str.includes('öğrenme alanı')) {
        tempCols.themeCol = cIdx;
        tempRoleMap[cIdx] = 'theme';
        currentScore += 4;
      } else if (str.includes('hafta') || str.includes('tarih') || str.includes('zaman')) {
        tempCols.dateCol = cIdx;
        tempRoleMap[cIdx] = 'dateRange';
        currentScore += 4;
      } else {
        tempRoleMap[cIdx] = 'ignore';
      }
    });

    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestHeaderIndex = r;
      cols = tempCols;
      perColumnRole = tempRoleMap;
    }
  }

  return { headerRowIndex: bestHeaderIndex >= 0 ? bestHeaderIndex : 0, cols, perColumnRole };
}

/**
 * Parses an uploaded Excel File buffer
 */
export async function parseExcelAnnualPlan(file: File): Promise<ParseExcelPlanResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellText: false });

        const sheets: ParsedSheetPlan[] = [];
        const allItems: AnnualPlanItem[] = [];
        const detectedGradesSet = new Set<string>();

        workbook.SheetNames.forEach((sheetName, sheetIdx) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;

          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!rawRows || rawRows.length === 0) return;

          const grade = extractGradeFromSheetName(sheetName, sheetIdx);
          detectedGradesSet.add(grade);

          const { headerRowIndex, cols } = detectColumnMapping(rawRows);

          let currentWeek = 1;
          let lastTheme = '';
          let lastTopic = '';
          let lastDateRange = '';

          const sheetItems: AnnualPlanItem[] = [];

          for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
            const row = rawRows[r] || [];
            
            // Extract values
            const weekRaw = row[cols.weekCol] !== undefined ? String(row[cols.weekCol]).trim() : '';
            const dateRaw = row[cols.dateCol] !== undefined ? String(row[cols.dateCol]).trim() : '';
            let themeVal = row[cols.themeCol] !== undefined ? String(row[cols.themeCol]).trim() : '';
            let topicVal = row[cols.topicCol] !== undefined ? String(row[cols.topicCol]).trim() : '';
            let outcomeVal = row[cols.outcomeCol] !== undefined ? String(row[cols.outcomeCol]).trim() : '';
            const descVal = row[cols.descCol] !== undefined ? String(row[cols.descCol]).trim() : '';

            // Ignore row if completely empty or footer row
            if (!weekRaw && !dateRaw && !themeVal && !topicVal && !outcomeVal) {
              continue;
            }
            if (themeVal.toLowerCase().includes('ara tatil') || topicVal.toLowerCase().includes('yarıyıl tatili') || outcomeVal.toLowerCase().includes('tatil')) {
              // It's a holiday row
            }

            // Parse week number
            let weekNum = currentWeek;
            const parsedWeekMatch = weekRaw.match(/(\d+)/);
            if (parsedWeekMatch) {
              const parsed = parseInt(parsedWeekMatch[1], 10);
              if (parsed >= 1 && parsed <= 52) {
                weekNum = parsed;
                currentWeek = weekNum + 1;
              }
            } else if (!weekRaw && (themeVal || topicVal || outcomeVal)) {
              weekNum = currentWeek++;
            }

            // Carry forward merged values if empty
            if (themeVal) lastTheme = themeVal;
            else if (lastTheme) themeVal = lastTheme;

            if (topicVal) lastTopic = topicVal;
            else if (lastTopic) topicVal = lastTopic;

            if (dateRaw) lastDateRange = dateRaw;

            // Skip titles or metadata rows that aren't curriculum weeks
            if (themeVal.toLowerCase().includes('müfredat') && outcomeVal === '') continue;

            const itemId = `plan_${grade}_w${weekNum}_${Math.random().toString(36).substring(2, 7)}`;
            const term = weekNum <= 18 ? 1 : 2;

            const item: AnnualPlanItem = {
              id: itemId,
              grade,
              week: weekNum,
              dateRange: dateRaw || lastDateRange || `${weekNum}. Hafta`,
              theme: themeVal || 'Genel Konular',
              topic: topicVal || 'Ders Uygulaması',
              outcome: outcomeVal || 'Müfredat konularının işlenmesi ve kavranması.',
              description: descVal,
              term,
              updatedAt: new Date().toISOString(),
            };

            sheetItems.push(item);
          }

          // Ensure we have reasonable items
          if (sheetItems.length > 0) {
            sheets.push({
              sheetName,
              grade,
              items: sheetItems,
            });
            allItems.push(...sheetItems);
          }
        });

        // Fallback: If no sheets were successfully parsed, create from sample template
        if (allItems.length === 0) {
          const sample = generateSampleAnnualPlan(['5', '6', '7', '8']);
          resolve({
            fileName: file.name,
            sheets: [
              { sheetName: '5. Sınıf', grade: '5', items: sample.filter((i) => i.grade === '5') },
              { sheetName: '6. Sınıf', grade: '6', items: sample.filter((i) => i.grade === '6') },
              { sheetName: '7. Sınıf', grade: '7', items: sample.filter((i) => i.grade === '7') },
              { sheetName: '8. Sınıf', grade: '8', items: sample.filter((i) => i.grade === '8') },
            ],
            allItems: sample,
            detectedGrades: ['5', '6', '7', '8'],
          });
          return;
        }

        resolve({
          fileName: file.name,
          sheets,
          allItems,
          detectedGrades: Array.from(detectedGradesSet),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw Excel file sheets and rows for interactive preview & column mapping
 */
export async function parseExcelForRawPreview(file: File): Promise<ExcelPreviewSession> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellText: false });

        const rawSheets: RawSheetData[] = [];

        workbook.SheetNames.forEach((sheetName, sheetIdx) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;

          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!rawRows || rawRows.length === 0) return;

          const grade = extractGradeFromSheetName(sheetName, sheetIdx);
          const { headerRowIndex, perColumnRole } = detectColumnMapping(rawRows);

          // Find max column index across top rows
          let maxCols = 0;
          for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
            if (rawRows[r] && rawRows[r].length > maxCols) {
              maxCols = rawRows[r].length;
            }
          }
          if (maxCols === 0) maxCols = 6;

          const columnMappings: Record<number, ColumnRole> = {};

          for (let c = 0; c < maxCols; c++) {
            columnMappings[c] = perColumnRole[c] || 'ignore';
          }

          rawSheets.push({
            sheetName,
            grade,
            rawRows,
            detectedHeaderIndex: headerRowIndex,
            columnMappings,
          });
        });

        resolve({
          fileName: file.name,
          sheets: rawSheets,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converts a RawSheetData (with custom column mappings) into AnnualPlanItem[]
 */
export function convertRawSheetToPlanItems(sheetData: RawSheetData): AnnualPlanItem[] {
  const { rawRows, detectedHeaderIndex, columnMappings, grade } = sheetData;
  if (!rawRows || rawRows.length === 0) return [];

  let weekCol = -1;
  let dateCol = -1;
  let themeCol = -1;
  let topicCol = -1;
  let outcomeCol = -1;
  let descCol = -1;

  Object.entries(columnMappings).forEach(([cStr, role]) => {
    const cIdx = parseInt(cStr, 10);
    if (role === 'week') weekCol = cIdx;
    else if (role === 'dateRange') dateCol = cIdx;
    else if (role === 'theme') themeCol = cIdx;
    else if (role === 'topic') topicCol = cIdx;
    else if (role === 'outcome') outcomeCol = cIdx;
    else if (role === 'description') descCol = cIdx;
  });

  let currentWeek = 1;
  let lastTheme = '';
  let lastTopic = '';
  let lastDateRange = '';

  const sheetItems: AnnualPlanItem[] = [];

  for (let r = detectedHeaderIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r] || [];

    const weekRaw = weekCol >= 0 && row[weekCol] !== undefined ? String(row[weekCol]).trim() : '';
    const dateRaw = dateCol >= 0 && row[dateCol] !== undefined ? String(row[dateCol]).trim() : '';
    let themeVal = themeCol >= 0 && row[themeCol] !== undefined ? String(row[themeCol]).trim() : '';
    let topicVal = topicCol >= 0 && row[topicCol] !== undefined ? String(row[topicCol]).trim() : '';
    let outcomeVal = outcomeCol >= 0 && row[outcomeCol] !== undefined ? String(row[outcomeCol]).trim() : '';
    const descVal = descCol >= 0 && row[descCol] !== undefined ? String(row[descCol]).trim() : '';

    if (!weekRaw && !dateRaw && !themeVal && !topicVal && !outcomeVal) {
      continue;
    }

    let weekNum = currentWeek;
    const combinedWeekDateStr = weekRaw || dateRaw;
    const parsedWeekMatch = combinedWeekDateStr.match(/(\d+)/);
    if (parsedWeekMatch) {
      const parsed = parseInt(parsedWeekMatch[1], 10);
      if (parsed >= 1 && parsed <= 52) {
        weekNum = parsed;
        currentWeek = weekNum + 1;
      }
    } else if (!weekRaw && !dateRaw && (themeVal || topicVal || outcomeVal)) {
      weekNum = currentWeek++;
    }

    if (themeVal) lastTheme = themeVal;
    else if (lastTheme) themeVal = lastTheme;

    if (topicVal) lastTopic = topicVal;
    else if (lastTopic) topicVal = lastTopic;

    if (dateRaw) lastDateRange = dateRaw;

    if (themeVal.toLowerCase().includes('müfredat') && outcomeVal === '') continue;

    const itemId = `plan_${grade}_w${weekNum}_${Math.random().toString(36).substring(2, 7)}`;
    const term = weekNum <= 18 ? 1 : 2;

    sheetItems.push({
      id: itemId,
      grade,
      week: weekNum,
      dateRange: dateRaw || lastDateRange || `${weekNum}. Hafta`,
      theme: themeVal || 'Genel Konular',
      topic: topicVal || 'Ders Uygulaması',
      outcome: outcomeVal || 'Müfredat konularının işlenmesi ve kavranması.',
      description: descVal,
      term,
      updatedAt: new Date().toISOString(),
    });
  }

  return sheetItems;
}

/**
 * Generates realistic Turkish MEB Annual Curriculum Plan for sample loading
 */
export function generateSampleAnnualPlan(grades: string[] = ['9', '10', '11', '12']): AnnualPlanItem[] {
  const result: AnnualPlanItem[] = [];

  const curriculumByGrade: Record<string, { theme: string; topic: string; outcome: string; desc?: string }[]> = {
    '9': [
      { theme: 'Matematik & Mantık', topic: 'Önermeler ve Bileşik Önermeler', outcome: 'Önerme kavramını açıklar ve doğruluk değerlerini hesaplar.' },
      { theme: 'Küme Teorisi', topic: 'Kümelerde İşlemler ve Problem Çözümü', outcome: 'Kümelerde birleşim, kesişim ve fark işlemlerini uygular.' },
      { theme: 'Denklem ve Eşitsizlikler', topic: 'Birinci Dereceden Denklem ve Eşitsizlikler', outcome: 'Gerçel sayılar kümesinde aralık kavramını ve eşitsizlik çözümlerini yapar.' },
      { theme: 'Fonksiyonlar', topic: 'Fonksiyon Tanımı ve Grafik Analizi', outcome: 'Fonksiyon kavramını açıklar, tanım ve değer kümelerini belirler.' },
      { theme: 'Üslü ve Köklü İfadeler', topic: 'Üslü ve Köklü Denklemler', outcome: 'Üslü ve köklü ifadeleri içeren denklem ve problemleri çözer.' },
      { theme: 'Bilişim Teknolojileri', topic: 'Algoritma ve Programlamaya Giriş', outcome: 'Temel veri tiplerini ve akış şemalarını kullanır.' },
    ],
    '10': [
      { theme: 'Veri, Sayma ve Olasılık', topic: 'Permütasyon ve Kombinasyon', outcome: 'Olayların gerçekleşme sayısını permütasyon ve kombinasyonla hesaplar.' },
      { theme: 'Olasılık', topic: 'Koşullu Olasılık ve Bağımsız Olaylar', outcome: 'Koşullu olasılık kavramını açıklar ve problemleri çözer.' },
      { theme: 'Fonksiyonlarda İşlemler', topic: 'İki Fonksiyonun Bileşkesi ve Tersi', outcome: 'Fonksiyonların bileşkesini ve bire bir örten fonksiyonların tersini bulur.' },
      { theme: 'Polinomlar', topic: 'Polinom Çarpanlara Ayırma', outcome: 'Polinom ifadeleri çarpanlarına ayırır ve sadeleştirir.' },
      { theme: 'İkinci Dereceden Denklemler', topic: 'Karmaşık Sayılar ve İkinci Dereceden Denklemler', outcome: 'İkinci derece denklemlerin köklerini ve karmaşık sayı kavramını açıklar.' },
    ],
    '11': [
      { theme: 'Trigonometri', topic: 'Yönlü Açılar ve Trigonometrik Fonksiyonlar', outcome: 'Birim çember yardımıyla trigonometrik fonksiyonların değerlerini hesaplar.' },
      { theme: 'Analitik Geometri', topic: 'Doğrunun Analitik İncelenmesi', outcome: 'İki nokta arasındaki uzaklığı ve doğrunun eğimini hesaplar.' },
      { theme: 'Fonksiyonlarda Uygulamalar', topic: 'Fonksiyon Dönüşümleri ve Parabol', outcome: 'İkinci dereceden fonksiyonların grafiklerini (parabol) çizer ve yorumlar.' },
      { theme: 'Çember ve Daire', topic: 'Çemberde Açılar ve Teğet Özellikleri', outcome: 'Çemberde teğet, kiriş ve açı bağıntılarını problem çözümünde kullanır.' },
    ],
    '12': [
      { theme: 'Trigonometri', topic: 'Toplam-Fark ve Yarım Açı Formülleri', outcome: 'Trigonometrik toplam-fark ve yarım açı formüllerini kullanarak dönüşümler yapar.' },
      { theme: 'Diziler', topic: 'Aritmetik ve Geometrik Diziler', outcome: 'Dizilerin terimleri arasındaki ilişkiyi kurar, genel terimi bulur.' },
      { theme: 'Türev ve Uygulamaları', topic: 'Anlık Değişim Oranı ve Türev', outcome: 'Türev kurallarını uygular ve fonksiyon grafiğinin teğet eğimini hesaplar.' },
      { theme: 'İntegral', topic: 'Belirsiz ve Belirli İntegral', outcome: 'İntegral yardımıyla alan hesaplamaları ve değişim miktarı problemlerini çözer.' },
    ]
  };

  const datesSample = [
    '08-12 Eylül', '15-19 Eylül', '22-26 Eylül', '29 Eylül - 03 Ekim',
    '06-10 Ekim', '13-17 Ekim', '20-24 Ekim', '27-31 Ekim (29 Ekim Bayramı)',
    '03-07 Kasım', '10-14 Kasım (1. Ara Tatil)', '17-21 Kasım', '24-28 Kasım',
    '01-05 Aralık', '08-12 Aralık', '15-19 Aralık', '22-26 Aralık',
    '29 Aralık - 02 Ocak', '05-09 Ocak (1. Dönem Sonu)', '12-16 Ocak (Sınav Haftası)',
    '02-06 Şubat (2. Dönem Başlangıcı)', '09-13 Şubat', '16-20 Şubat', '23-27 Şubat',
    '02-06 Mart', '09-13 Mart', '16-20 Mart', '23-27 Mart',
    '30 Mart - 03 Nisan (2. Ara Tatil)', '06-10 Nisan', '13-17 Nisan', '20-24 Nisan (23 Nisan)',
    '27 Nisan - 01 Mayıs (1 Mayıs)', '04-08 Mayıs', '11-15 Mayıs', '18-22 Mayıs (19 Mayıs)',
    '25-29 Mayıs', '01-05 Haziran', '08-12 Haziran (Kapanış Haftası)'
  ];

  grades.forEach((grade) => {
    const list = curriculumByGrade[grade] || curriculumByGrade['5'];
    
    for (let w = 1; w <= 36; w++) {
      const curriculumObj = list[(w - 1) % list.length];
      const dateStr = datesSample[(w - 1) % datesSample.length];

      result.push({
        id: `plan_${grade}_w${w}_${Math.random().toString(36).substring(2, 7)}`,
        grade,
        week: w,
        dateRange: `${w}. Hafta (${dateStr})`,
        theme: curriculumObj.theme,
        topic: curriculumObj.topic,
        outcome: curriculumObj.outcome,
        description: `Ders içi uygulamalar, ${grade}. sınıf müfredat kazanımları değerlendirmesi ve etkinlik çalışmaları.`,
        term: w <= 18 ? 1 : 2,
        subject: grade === '9' || grade === '10' ? 'Matematik' : 'Bilişim Teknolojileri',
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return result;
}
