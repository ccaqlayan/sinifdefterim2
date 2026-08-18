import XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, Homework, HomeworkRecord } from '../types';

export interface HomeworkChecklistConfig {
  schoolName: string;
  academicYear: string;
  subject: string;
  className: string;
  columnCount: number; // e.g. 20, 25, 30
  totalRowCount: number; // e.g. 30, 35 or classStudents.length
  fillExistingData: boolean;
}

export interface HomeworkChecklistStudentRow {
  index: number;
  studentNumber: string;
  studentName: string;
  statuses: string[]; // array of strings e.g. '+', '⊥', '-', 'G', 'G+', ''
}

// Convert homework status to chart symbol matching the photo
export function getStatusSymbol(status?: string): string {
  switch (status) {
    case 'completed':
      return '+';
    case 'partial':
      return '⊥';
    case 'missing':
      return '-';
    case 'excused':
      return 'G';
    case 'late':
      return 'G+';
    default:
      return '';
  }
}

// Prepare Rows
export function prepareChecklistRows(
  students: Student[],
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  config: HomeworkChecklistConfig
): {
  headers: string[];
  dateHeaders: string[];
  rows: HomeworkChecklistStudentRow[];
} {
  // Sort students by number if possible, or name
  const sortedStudents = [...students].sort((a, b) => {
    const numA = parseInt(a.number.replace(/\D/g, ''), 10);
    const numB = parseInt(b.number.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.name.localeCompare(b.name, 'tr-TR');
  });

  const sortedHws = [...homeworks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Generate Date Headers
  const dateHeaders: string[] = [];
  for (let i = 0; i < config.columnCount; i++) {
    if (config.fillExistingData && sortedHws[i]) {
      const d = sortedHws[i].dueDate;
      if (d && d.includes('-')) {
        const parts = d.split('-');
        if (parts.length === 3) {
          dateHeaders.push(`${parts[2]}.${parts[1]}`);
        } else {
          dateHeaders.push(d);
        }
      } else {
        dateHeaders.push(sortedHws[i].title || `${i + 1}`);
      }
    } else {
      dateHeaders.push('');
    }
  }

  const rows: HomeworkChecklistStudentRow[] = [];

  // 1. Add existing students
  sortedStudents.forEach((std, idx) => {
    const fullName = `${std.name} ${std.surname}`.trim().toLocaleUpperCase('tr-TR');
    const statuses: string[] = [];

    for (let c = 0; c < config.columnCount; c++) {
      if (config.fillExistingData && sortedHws[c]) {
        const hw = sortedHws[c];
        const record = homeworkRecords.find((r) => r.homeworkId === hw.id && r.studentId === std.id);
        statuses.push(record ? getStatusSymbol(record.status) : '');
      } else {
        statuses.push('');
      }
    }

    rows.push({
      index: idx + 1,
      studentNumber: std.number,
      studentName: fullName,
      statuses,
    });
  });

  // 2. Add blank rows up to totalRowCount
  const targetTotal = Math.max(config.totalRowCount, rows.length);
  for (let i = rows.length; i < targetTotal; i++) {
    rows.push({
      index: i + 1,
      studentNumber: '',
      studentName: '',
      statuses: Array(config.columnCount).fill(''),
    });
  }

  return {
    headers: ['Sıra', 'Öğr. No', 'ADI SOYADI', 'TARİH/SAYFA', ...dateHeaders],
    dateHeaders,
    rows,
  };
}

// -------------------------------------------------------------
// 1. EXECUTIVE-GRADE EXCEL EXPORT (.xlsx)
// -------------------------------------------------------------
export function exportHomeworkChecklistToExcel(
  students: Student[],
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  config: HomeworkChecklistConfig
) {
  const { dateHeaders, rows } = prepareChecklistRows(students, homeworks, homeworkRecords, config);

  const totalCols = 4 + config.columnCount;
  const wsData: any[][] = [];

  // Row 0: Top School Name + Legend "Yaptı"
  const row0 = Array(totalCols).fill('');
  row0[0] = `${config.academicYear} EĞİTİM-ÖĞRETİM YILI ${config.schoolName.toLocaleUpperCase('tr-TR')}`;
  row0[totalCols - 3] = 'Yaptı';
  row0[totalCols - 2] = ':';
  row0[totalCols - 1] = '+';
  wsData.push(row0);

  // Row 1: Title + Legend "Yarım yaptı"
  const row1 = Array(totalCols).fill('');
  row1[0] = `${config.subject.toLocaleUpperCase('tr-TR')} DERSİ ${config.className.toLocaleUpperCase('tr-TR')} SINIFI ÖDEV TAKİP ÇİZELGESİ`;
  row1[totalCols - 3] = 'Yarım yaptı';
  row1[totalCols - 2] = ':';
  row1[totalCols - 1] = '⊥';
  wsData.push(row1);

  // Row 2: Legend "Yapmadı"
  const row2 = Array(totalCols).fill('');
  row2[totalCols - 3] = 'Yapmadı';
  row2[totalCols - 2] = ':';
  row2[totalCols - 1] = '-';
  wsData.push(row2);

  // Row 3: Legend "Gelmedi"
  const row3 = Array(totalCols).fill('');
  row3[totalCols - 3] = 'Gelmedi';
  row3[totalCols - 2] = ':';
  row3[totalCols - 1] = 'G';
  wsData.push(row3);

  // Row 4: Legend "Geç Gösterdi"
  const row4 = Array(totalCols).fill('');
  row4[totalCols - 3] = 'Geç Gösterdi';
  row4[totalCols - 2] = ':';
  row4[totalCols - 1] = 'G+';
  wsData.push(row4);

  // Row 5: Blank separator
  wsData.push(Array(totalCols).fill(''));

  // Row 6: Main Header (Table Columns)
  const headerRow = ['Sıra', 'Öğr. No', 'ADI SOYADI', 'TARİH/SAYFA', ...dateHeaders];
  wsData.push(headerRow);

  // Student Data Rows (Row 7+)
  rows.forEach((r) => {
    wsData.push([r.index, r.studentNumber, r.studentName, '', ...r.statuses]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 1. Merged Cells for Titles
  ws['!merges'] = [
    // Top Title 1 merged across left-to-legend
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 4 } },
    // Top Title 2 merged across left-to-legend
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 4 } },
  ];

  // 2. Dynamic Column Widths Optimization
  const maxNameLength = rows.reduce((max, r) => Math.max(max, (r.studentName || '').length), 0);
  const calculatedNameWidth = Math.min(36, Math.max(26, maxNameLength + 3));

  const maxNoLength = rows.reduce((max, r) => Math.max(max, (r.studentNumber || '').length), 0);
  const calculatedNoWidth = Math.max(10, maxNoLength + 2.5);

  const dateColWidth = config.columnCount > 25 ? 4.3 : (config.columnCount > 20 ? 4.8 : 5.4);

  const colWidths: any[] = [
    { wch: 6 },                   // Sıra
    { wch: calculatedNoWidth },   // Öğr. No
    { wch: calculatedNameWidth }, // ADI SOYADI
    { wch: 11.5 },                // TARİH/SAYFA
  ];
  for (let i = 0; i < config.columnCount; i++) {
    colWidths.push({ wch: dateColWidth });
  }
  ws['!cols'] = colWidths;

  // 3. Row Heights Optimization (Comfortable breathing room & vertical orientation)
  const rowHeights: any[] = [
    { hpt: 30 }, // Row 0 (Title 1)
    { hpt: 26 }, // Row 1 (Title 2)
    { hpt: 16 }, // Row 2 (Legend)
    { hpt: 16 }, // Row 3 (Legend)
    { hpt: 16 }, // Row 4 (Legend)
    { hpt: 6 },  // Row 5 (Separator)
    { hpt: 62 }, // Row 6 (Header Row - 90deg text)
  ];
  for (let i = 0; i < rows.length; i++) {
    rowHeights.push({ hpt: 22 }); // Student Data Rows
  }
  ws['!rows'] = rowHeights;

  // 4. Freeze Panes (Dondurma: Dikeyde ilk 3 sütun + Yatayda başlık satırları)
  // When scrolling down, headers stay visible; when scrolling right, student names stay visible!
  ws['!views'] = [
    {
      state: 'frozen',
      xSplit: 3, // Freeze Sıra, Öğr. No, ADI SOYADI columns
      ySplit: 7, // Freeze Rows 0-6 (Titles + Header row)
      topLeftCell: 'D8',
      activeCell: 'D8',
    },
  ];
  ws['!freeze'] = {
    state: 'frozen',
    xSplit: 3,
    ySplit: 7,
    topLeftCell: 'D8',
    activeCell: 'D8',
  };

  // 5. Page Setup & Printing Options (Auto-fit to 1 Landscape A4 Page)
  ws['!pageSetup'] = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    fitToPage: true,
  };
  ws['!margins'] = {
    left: 0.3,
    right: 0.3,
    top: 0.4,
    bottom: 0.4,
    header: 0.15,
    footer: 0.15,
  };

  // 6. Professional Borders & Styles
  const borderThinBlack = {
    top: { style: 'thin', color: { rgb: '334155' } },
    bottom: { style: 'thin', color: { rgb: '334155' } },
    left: { style: 'thin', color: { rgb: '334155' } },
    right: { style: 'thin', color: { rgb: '334155' } },
  };

  const borderMediumBlack = {
    top: { style: 'medium', color: { rgb: '0F172A' } },
    bottom: { style: 'medium', color: { rgb: '0F172A' } },
    left: { style: 'medium', color: { rgb: '0F172A' } },
    right: { style: 'medium', color: { rgb: '0F172A' } },
  };

  const borderDoubleBottom = {
    top: { style: 'medium', color: { rgb: '0F172A' } },
    bottom: { style: 'double', color: { rgb: '0F172A' } },
    left: { style: 'thin', color: { rgb: '334155' } },
    right: { style: 'thin', color: { rgb: '334155' } },
  };

  // Style Title 1 (Row 0, Col 0..totalCols-4)
  for (let c = 0; c <= totalCols - 4; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = {
      font: { name: 'Arial', sz: 13, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Style Title 2 (Row 1, Col 0..totalCols-4)
  for (let c = 0; c <= totalCols - 4; c++) {
    const ref = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = {
      font: { name: 'Arial', sz: 12, bold: true, underline: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Style Legend Box (Rows 0-4, cols totalCols-3 to totalCols-1)
  const symbolColors: Record<number, string> = {
    0: '047857', // + emerald
    1: 'B45309', // ⊥ amber
    2: 'B91C1C', // - rose/red
    3: '4338CA', // G indigo
    4: '1D4ED8', // G+ blue
  };

  for (let r = 0; r <= 4; r++) {
    for (let c = totalCols - 3; c < totalCols; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };

      const isSymbol = c === totalCols - 1;
      const isColon = c === totalCols - 2;

      ws[ref].s = {
        font: {
          name: 'Arial',
          sz: isSymbol ? 11.5 : 9,
          bold: true,
          color: isSymbol ? { rgb: symbolColors[r] || '0F172A' } : { rgb: '1E293B' },
        },
        alignment: {
          horizontal: isSymbol || isColon ? 'center' : 'left',
          vertical: 'center',
        },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        border: {
          top: r === 0 ? { style: 'thin', color: { rgb: '334155' } } : undefined,
          bottom: r === 4 ? { style: 'thin', color: { rgb: '334155' } } : undefined,
          left: c === totalCols - 3 ? { style: 'thin', color: { rgb: '334155' } } : undefined,
          right: c === totalCols - 1 ? { style: 'thin', color: { rgb: '334155' } } : undefined,
        },
      };
    }
  }

  // Style Table Header (Row 6) - Executive Highlighting with Double Bottom Border
  for (let C = 0; C < totalCols; C++) {
    const ref = XLSX.utils.encode_cell({ r: 6, c: C });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };

    const isFirstCol = C === 0;
    const isLastCol = C === totalCols - 1;

    ws[ref].s = {
      font: {
        name: 'Arial',
        sz: 9.5,
        bold: true,
        color: { rgb: '0F172A' },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
        textRotation: C >= 3 ? 90 : 0,
      },
      fill: { fgColor: { rgb: 'CBD5E1' } }, // Professional slate
      border: {
        top: borderMediumBlack.top,
        bottom: borderDoubleBottom.bottom,
        left: isFirstCol ? borderMediumBlack.left : borderThinBlack.left,
        right: isLastCol ? borderMediumBlack.right : borderThinBlack.right,
      },
    };
  }

  // Style Table Data Rows (Row 7+)
  const lastRowIdx = wsData.length - 1;
  for (let R = 7; R <= lastRowIdx; R++) {
    const isEven = R % 2 === 0;
    const isLastRow = R === lastRowIdx;

    for (let C = 0; C < totalCols; C++) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };

      const isSira = C === 0;
      const isOgrNo = C === 1;
      const isName = C === 2;
      const isTarihSayfa = C === 3;
      const isCheckStatus = C >= 4;
      const isFirstCol = C === 0;
      const isLastCol = C === totalCols - 1;

      // Determine symbol text color if present
      let cellColor = '0F172A';
      const cellVal = String(ws[ref].v || '');
      if (cellVal === '+') cellColor = '047857';
      else if (cellVal === '⊥') cellColor = 'B45309';
      else if (cellVal === '-') cellColor = 'B91C1C';
      else if (cellVal === 'G') cellColor = '4338CA';
      else if (cellVal === 'G+') cellColor = '1D4ED8';

      ws[ref].s = {
        font: {
          name: 'Arial',
          sz: isCheckStatus ? 11 : 9.5,
          bold: isName || isCheckStatus || isSira || isOgrNo,
          color: { rgb: cellColor },
        },
        alignment: {
          horizontal: isName ? 'left' : 'center',
          vertical: 'center',
          wrapText: false,
          indent: isName ? 1 : 0,
        },
        fill: isTarihSayfa
          ? { fgColor: { rgb: 'F1F5F9' } }
          : isEven
          ? { fgColor: { rgb: 'FFFFFF' } }
          : { fgColor: { rgb: 'F8FAFC' } },
        border: {
          top: borderThinBlack.top,
          bottom: isLastRow ? borderMediumBlack.bottom : borderThinBlack.bottom,
          left: isFirstCol ? borderMediumBlack.left : borderThinBlack.left,
          right: isLastCol ? borderMediumBlack.right : borderThinBlack.right,
        },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  const safeSheetName = `${config.className.replace(/[^a-zA-Z0-9_-]/g, '_')}_Odev_Cizelgesi`.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Odev_Takip');

  const fileName = `${config.className}_Odev_Takip_Cizelgesi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// -------------------------------------------------------------
// 2. HIGH-DEFINITION SINGLE-PAGE PDF EXPORT (OKLCH-safe & Full Turkish UTF-8)
// -------------------------------------------------------------
export async function exportHomeworkChecklistToPdf(
  elementId: string,
  config: HomeworkChecklistConfig
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export PDF element #${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      onclone: (clonedDoc) => {
        // Strip Tailwind OKLCH styles to prevent html2canvas color error
        const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleSheets.forEach((s) => s.remove());

        const customStyle = clonedDoc.createElement('style');
        customStyle.textContent = `
          * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          #${elementId} {
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 16px 20px !important;
            border: 1px solid #cbd5e1 !important;
            width: 1040px !important;
          }
          .sheet-header-container {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            margin-bottom: 8px !important;
            width: 100% !important;
          }
          .sheet-titles {
            flex: 1 !important;
            text-align: center !important;
            padding-left: 90px !important;
            padding-right: 10px !important;
          }
          .sheet-title-1 {
            font-size: 13px !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.3px !important;
            color: #0f172a !important;
            margin-bottom: 3px !important;
          }
          .sheet-title-2 {
            font-size: 12px !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            text-decoration: underline !important;
            letter-spacing: 0.2px !important;
            color: #0f172a !important;
          }
          .sheet-legend-box {
            flex-shrink: 0 !important;
            border: 1px solid #334155 !important;
            background-color: #f8fafc !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-size: 8px !important;
            font-weight: 700 !important;
            text-align: left !important;
            margin-top: -2px !important;
          }
          .sheet-legend-box table {
            border-collapse: collapse !important;
          }
          .sheet-legend-box td {
            padding: 0.5px 2px !important;
            color: #1e293b !important;
            white-space: nowrap !important;
            font-size: 8px !important;
            line-height: 1.15 !important;
          }
          .sym-plus { color: #047857 !important; font-weight: 900 !important; font-size: 9.5px !important; text-align: center !important; }
          .sym-partial { color: #b45309 !important; font-weight: 900 !important; font-size: 9.5px !important; text-align: center !important; }
          .sym-minus { color: #b91c1c !important; font-weight: 900 !important; font-size: 9.5px !important; text-align: center !important; }
          .sym-absent { color: #4338ca !important; font-weight: 900 !important; font-size: 9.5px !important; text-align: center !important; }
          .sym-late { color: #1d4ed8 !important; font-weight: 900 !important; font-size: 9.5px !important; text-align: center !important; }

          table.sheet-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 2px solid #0f172a !important;
            table-layout: fixed !important;
          }
          table.sheet-table th, table.sheet-table td {
            border: 1px solid #475569 !important;
            padding: 2px 3px !important;
            font-size: 8.5px !important;
            height: 20px !important;
            vertical-align: middle !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          table.sheet-table th {
            background-color: #f1f5f9 !important;
            font-weight: 900 !important;
            text-align: center !important;
            vertical-align: middle !important;
            color: #0f172a !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          table.sheet-table th.col-vert {
            height: 55px !important;
            padding: 0 !important;
            vertical-align: middle !important;
            text-align: center !important;
            overflow: visible !important;
          }
          table.sheet-table th.col-vert > div {
            transform: rotate(-90deg) !important;
            white-space: nowrap !important;
            font-size: 8px !important;
            font-weight: 800 !important;
            color: #1e293b !important;
            display: inline-block !important;
          }
          table.sheet-table td.col-sira { text-align: center !important; font-weight: 700 !important; }
          table.sheet-table td.col-no { text-align: center !important; font-weight: 700 !important; }
          table.sheet-table td.col-name { text-align: left !important; padding-left: 5px !important; font-weight: 800 !important; font-size: 8.5px !important; line-height: 1.1 !important; }
          table.sheet-table td.col-check { text-align: center !important; font-weight: 900 !important; font-size: 10px !important; }
          table.sheet-table tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
        `;
        clonedDoc.head.appendChild(customStyle);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 5;

    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);

    const targetWidth = imgWidth * ratio;
    const targetHeight = imgHeight * ratio;

    const posX = margin + (usableWidth - targetWidth) / 2;
    const posY = margin + (usableHeight - targetHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, targetWidth, targetHeight, undefined, 'FAST');

    const fileName = `${config.className}_Odev_Takip_Cizelgesi_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('PDF oluşturulurken bir hata meydana geldi. Lütfen doğrudan yazdır butonunu veya Excel seçeneğini deneyiniz.');
  }
}

// -------------------------------------------------------------
// 3. DIRECT PRINT (A4 Landscape, Single-Page Fit with Rotated Vertical Dates & Turkish Font)
// -------------------------------------------------------------
export function triggerDirectPrintHomeworkChecklist(
  students: Student[],
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  config: HomeworkChecklistConfig
) {
  const { dateHeaders, rows } = prepareChecklistRows(students, homeworks, homeworkRecords, config);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen yazdırma penceresine izin verin.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${config.className} - ÖDEV TAKİP ÇİZELGESİ</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 4mm 5mm 4mm 5mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000;
      background: #fff;
    }
    .page-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5px;
      padding-top: 1px;
      width: 100%;
    }
    .titles-box {
      flex: 1;
      text-align: center;
      padding-left: 90px;
      padding-right: 10px;
    }
    .main-title-1 {
      font-size: 11pt;
      font-weight: 900;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #0f172a;
    }
    .main-title-2 {
      font-size: 10pt;
      font-weight: 900;
      margin: 2px 0 0 0;
      text-transform: uppercase;
      text-decoration: underline;
      letter-spacing: 0.2px;
      color: #0f172a;
    }
    .legend-box {
      flex-shrink: 0;
      font-size: 6.5pt;
      line-height: 1.15;
      text-align: left;
      font-weight: 700;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 1.5px 5px;
      background-color: #f8fafc;
    }
    .legend-box table {
      border-collapse: collapse;
    }
    .legend-box td {
      padding: 0.5px 2px;
      white-space: nowrap;
    }
    .legend-box td.symbol {
      font-weight: 900;
      font-size: 7.5pt;
      text-align: center;
    }
    .legend-box td.sym-plus { color: #047857; }
    .legend-box td.sym-partial { color: #b45309; }
    .legend-box td.sym-minus { color: #b91c1c; }
    .legend-box td.sym-absent { color: #4338ca; }
    .legend-box td.sym-late { color: #1d4ed8; }

    table.checklist-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      table-layout: fixed;
    }
    table.checklist-table th, table.checklist-table td {
      border: 1px solid #333;
      padding: 1px 2px;
      font-size: 7.5pt;
      height: 18px;
      vertical-align: middle;
    }
    table.checklist-table th {
      background-color: #f1f5f9;
      font-weight: 800;
      text-align: center;
      vertical-align: middle;
      border: 1px solid #000;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: nowrap !important;
    }
    table.checklist-table th.col-sira { width: 28px; font-size: 7pt; }
    table.checklist-table th.col-no { width: 54px; font-size: 7.5pt; }
    table.checklist-table th.col-name { width: 175px; text-align: left; padding-left: 5px; font-size: 7.5pt; }
    table.checklist-table th.col-tarih { 
      width: 36px;
      font-size: 6.8pt;
      font-weight: 900;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      height: 56px;
      text-align: center;
      padding: 1px 0;
      overflow: visible !important;
      text-overflow: clip !important;
    }
    table.checklist-table th.col-date-header {
      font-size: 7pt;
      font-weight: 800;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      height: 56px;
      text-align: center;
      padding: 1px 0;
      line-height: 1;
      overflow: visible !important;
      text-overflow: clip !important;
    }
    table.checklist-table td.col-sira { text-align: center; font-weight: 700; white-space: nowrap; }
    table.checklist-table td.col-no { text-align: center; font-weight: 700; white-space: nowrap; }
    table.checklist-table td.col-name { 
      text-align: left; 
      padding-left: 4px; 
      font-weight: 800; 
      font-size: 7.5pt; 
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    table.checklist-table td.col-check { text-align: center; font-weight: 900; font-size: 8.5pt; }
    table.checklist-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header-container">
      <div class="titles-box">
        <h1 class="main-title-1">${config.academicYear} EĞİTİM-ÖĞRETİM YILI ${config.schoolName.toLocaleUpperCase('tr-TR')}</h1>
        <h2 class="main-title-2">${config.subject.toLocaleUpperCase('tr-TR')} DERSİ ${config.className.toLocaleUpperCase('tr-TR')} SINIFI ÖDEV TAKİP ÇİZELGESİ</h2>
      </div>
      
      <div class="legend-box">
        <table>
          <tr><td>Yaptı</td><td>:</td><td class="symbol sym-plus">+</td></tr>
          <tr><td>Yarım yaptı</td><td>:</td><td class="symbol sym-partial">⊥</td></tr>
          <tr><td>Yapmadı</td><td>:</td><td class="symbol sym-minus">-</td></tr>
          <tr><td>Gelmedi</td><td>:</td><td class="symbol sym-absent">G</td></tr>
          <tr><td>Geç Gösterdi</td><td>:</td><td class="symbol sym-late">G+</td></tr>
        </table>
      </div>
    </div>

    <table class="checklist-table">
      <thead>
        <tr>
          <th class="col-sira">Sıra</th>
          <th class="col-no">Öğr. No</th>
          <th class="col-name">ADI SOYADI</th>
          <th class="col-tarih">TARİH/SAYFA</th>
          ${dateHeaders.map((d) => `<th class="col-date-header">${d}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td class="col-sira">${r.index}</td>
            <td class="col-no">${r.studentNumber}</td>
            <td class="col-name">${r.studentName}</td>
            <td></td>
            ${r.statuses.map((s) => `<td class="col-check">${s}</td>`).join('')}
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
