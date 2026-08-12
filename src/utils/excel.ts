import * as XLSX from 'xlsx';
import { OverallTermScore, Student } from '../types';

export function exportTermScoresToExcel(className: string, subject: string, scores: OverallTermScore[]) {
  const data = scores.map((s, idx) => ({
    'Sıra': idx + 1,
    'Okul No': s.studentNumber,
    'Ad Soyad': s.studentName,
    'Artı Sayısı': s.plusCount,
    'Eksi Sayısı': s.minusCount,
    'Katılım Puanı (100)': s.plusMinusNormalized,
    'Quiz Ortalaması (100)': s.quizAverage,
    'Ödev Başarısı (100)': s.homeworkScore,
    'Defter Kontrolü (%/100)': s.notebookAverage,
    'Dönem Sonu Performans Notu': s.finalScore,
    'Derece / Derecelendirme': s.letterGrade,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${className} Performans`);

  // Download trigger
  const fileName = `${className}_${subject}_Performans_Raporu_${new Date().toISOString().slice(0,10)}.xlsx`;
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
          parentName: String(row['Veli Adı'] || row['Veli'] || 'Veli'),
          parentPhone: String(row['Veli Telefon'] || row['Telefon'] || '5550000000'),
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
