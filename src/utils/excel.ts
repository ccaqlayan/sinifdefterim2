import * as XLSX from 'xlsx';
import { OverallTermScore, Student } from '../types';

export function exportTermScoresToExcel(className: string, subject: string, scores: OverallTermScore[], termLabel?: string) {
  const data = scores.map((s, idx) => ({
    'Sıra': idx + 1,
    'Okul No': s.studentNumber,
    'Ad Soyad': s.studentName,
    'Dönem': termLabel || 'Dönem Sonu',
    'Artı Sayısı': s.plusCount,
    'Eksi Sayısı': s.minusCount,
    'Katılım Puanı (100)': s.plusMinusNormalized !== null ? s.plusMinusNormalized : '-',
    'Quiz Ortalaması (100)': s.quizAverage !== null ? s.quizAverage : '-',
    'Ödev Başarısı (100)': s.homeworkScore !== null ? s.homeworkScore : '-',
    'Defter Kontrolü (%/100)': s.notebookAverage !== null ? s.notebookAverage : '-',
    'Dönem Sonu Performans Notu': s.finalScore !== null ? s.finalScore : '-',
    'Derece / Derecelendirme': s.letterGrade,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  const safeSheetName = `${className.replace(/[^a-zA-Z0-9_-]/g, '_')}_Performans`.slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // Download trigger
  const safeTerm = termLabel ? `_${termLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  const fileName = `${className}_${subject}${safeTerm}_Performans_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportStudentListToExcel(className: string, students: Student[]) {
  const data = students.map((std) => ({
    'Okul No': std.number,
    'Ad': std.name,
    'Soyad': std.surname,
    'Veli Adı': std.parentName,
    'Veli Telefon': std.parentPhone,
    'Veli E-posta': std.parentEmail,
    'Öğretmen Notu': std.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Öğrenci Listesi');

  XLSX.writeFile(workbook, `${className}_Ogrenci_Listesi.xlsx`);
}

export type StudentTargetField =
  | 'number'
  | 'name'
  | 'surname'
  | 'parentName'
  | 'parentPhone'
  | 'parentEmail'
  | 'notes'
  | 'ignore';

export interface ExcelColumnScanResult {
  headers: string[];
  rows: Record<string, any>[];
  initialMapping: Record<string, StudentTargetField>;
}

export function autoDetectFieldMapping(headers: string[]): Record<string, StudentTargetField> {
  const mapping: Record<string, StudentTargetField> = {};
  
  headers.forEach((header) => {
    const h = header.trim().toLowerCase();
    
    if (h.includes('veli telefon') || h.includes('veli tel') || h.includes('gsm') || h.includes('veli gsm') || h.includes('veli cep')) {
      mapping[header] = 'parentPhone';
    } else if (h.includes('veli ad') || h.includes('veli ismi') || h.includes('veli ad soyad') || (h.includes('veli') && !h.includes('telefon') && !h.includes('mail') && !h.includes('eposta'))) {
      mapping[header] = 'parentName';
    } else if (h.includes('veli e-posta') || h.includes('veli email') || h.includes('veli mail') || h.includes('parent email')) {
      mapping[header] = 'parentEmail';
    } else if (h.includes('okul no') || h.includes('numara') || h.includes('öğrenci no') || h.includes('ogrenci no') || h.includes('no') || h.includes('std no')) {
      mapping[header] = 'number';
    } else if (h.includes('soyad') || h.includes('soyadı') || h.includes('last name')) {
      mapping[header] = 'surname';
    } else if (h.includes('ad soyad') || h.includes('adı soyadı') || h.includes('isim soyisim')) {
      mapping[header] = 'name';
    } else if (h.includes('ad') || h.includes('adı') || h.includes('isim') || h.includes('first name') || h.includes('öğrenci adı')) {
      mapping[header] = 'name';
    } else if (h.includes('not') || h.includes('açıklama') || h.includes('bilgi')) {
      mapping[header] = 'notes';
    } else {
      mapping[header] = 'ignore';
    }
  });

  return mapping;
}

export function scanExcelFile(file: File): Promise<ExcelColumnScanResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        let headers: string[] = [];
        if (rawRows.length > 0) {
          headers = Object.keys(rawRows[0]);
        }

        const initialMapping = autoDetectFieldMapping(headers);

        resolve({
          headers,
          rows: rawRows,
          initialMapping,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function splitFullName(fullName: string): { name: string; surname: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { name: '', surname: '' };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { name: parts[0], surname: '' };
  }

  const surname = parts.pop() || '';
  const name = parts.join(' ');
  return { name, surname };
}

export function mapRowsToStudents(
  rows: Record<string, any>[],
  mapping: Record<string, StudentTargetField>
): Partial<Student>[] {
  return rows.map((row, idx) => {
    let rawName = '';
    let rawSurname = '';
    let number = '';
    let parentName = '';
    let parentPhone = '';
    let parentEmail = '';
    let notes = '';

    Object.entries(mapping).forEach(([colHeader, targetField]) => {
      if (targetField === 'ignore') return;
      const val = row[colHeader] !== undefined ? String(row[colHeader]).trim() : '';
      if (!val) return;

      if (targetField === 'name') {
        rawName = val;
      } else if (targetField === 'surname') {
        rawSurname = val;
      } else if (targetField === 'number') {
        number = val;
      } else if (targetField === 'parentName') {
        parentName = val;
      } else if (targetField === 'parentPhone') {
        parentPhone = val;
      } else if (targetField === 'parentEmail') {
        parentEmail = val;
      } else if (targetField === 'notes') {
        notes = val;
      }
    });

    let finalName = rawName;
    let finalSurname = rawSurname;

    // If surname is empty or if name contains combined full name, split automatically
    if (!finalSurname && finalName) {
      const split = splitFullName(finalName);
      finalName = split.name;
      finalSurname = split.surname;
    } else if (finalName && finalSurname) {
      // Clean extra spaces
      finalName = finalName.trim();
      finalSurname = finalSurname.trim();
    }

    if (!finalName && !finalSurname) {
      finalName = `Öğrenci ${idx + 1}`;
    }

    return {
      number: number || String(100 + idx),
      name: finalName,
      surname: finalSurname,
      parentName: parentName || '-',
      parentPhone: parentPhone || '-',
      parentEmail: parentEmail || '',
      notes: notes || '',
    };
  });
}

export function parseStudentListFromExcel(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedStudents: Partial<Student>[] = json.map((row) => ({
          number: String(row['Okul No'] || row['No'] || row['Numara'] || Math.floor(100 + Math.random() * 899)),
          name: String(row['Ad'] || row['İsim'] || row['Adı'] || 'Öğrenci'),
          surname: String(row['Soyad'] || row['Soyadı'] || ''),
          parentName: String(row['Veli Adı'] || row['Veli'] || '-'),
          parentPhone: String(row['Veli Telefon'] || row['Telefon'] || '-'),
          parentEmail: String(row['Veli E-posta'] || row['E-posta'] || ''),
          notes: String(row['Not'] || row['Öğretmen Notu'] || ''),
        }));

        resolve(parsedStudents);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
