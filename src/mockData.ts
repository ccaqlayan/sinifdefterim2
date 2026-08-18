import { ClassRoom, Student, PerformanceLog, Quiz, QuizScore, Homework, HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, NotificationSettingsConfig, ParentFeedbackLog, AuditLog, LessonLogNote } from './types';

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    name: '9-A',
    grade: '9',
    subject: 'Matematik',
    term: '2025-2026 2. Dönem',
    createdAt: '2026-02-01',
  },
  {
    id: 'class-2',
    name: '10-B',
    grade: '10',
    subject: 'Fizik',
    term: '2025-2026 2. Dönem',
    createdAt: '2026-02-01',
  },
  {
    id: 'class-3',
    name: '11-C',
    grade: '11',
    subject: 'Kimya',
    term: '2025-2026 2. Dönem',
    createdAt: '2026-02-01',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  // 9-A Matematik
  {
    id: 'std-101',
    classId: 'class-1',
    number: '101',
    name: 'Ahmet',
    surname: 'Yılmaz',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    parentName: 'Mehmet Yılmaz',
    parentPhone: '5551234567',
    parentEmail: 'mehmet.yilmaz@example.com',
    notes: 'Matematik olimpiyatlarına ilgi duyuyor, parmak kaldırıp derse katılıyor.',
  },
  {
    id: 'std-102',
    classId: 'class-1',
    number: '102',
    name: 'Zeynep',
    surname: 'Kaya',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    parentName: 'Ayşe Kaya',
    parentPhone: '5559876543',
    parentEmail: 'ayse.kaya@example.com',
    notes: 'Defter tutumu çok özenli, ödevlerini aksatmıyor.',
  },
  {
    id: 'std-103',
    classId: 'class-1',
    number: '103',
    name: 'Can',
    surname: 'Demir',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    parentName: 'Mustafa Demir',
    parentPhone: '5553334455',
    parentEmail: 'mustafa.d@example.com',
    notes: 'Soru çözerken dikkati çabuk dağılabiliyor.',
  },
  {
    id: 'std-104',
    classId: 'class-1',
    number: '104',
    name: 'Elif',
    surname: 'Şahin',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    parentName: 'Fatma Şahin',
    parentPhone: '5554445566',
    parentEmail: 'fatma.sahin@example.com',
    notes: 'Grup çalışmalarında liderlik alıyor.',
  },
  {
    id: 'std-105',
    classId: 'class-1',
    number: '105',
    name: 'Burak',
    surname: 'Çelik',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    parentName: 'Hasan Çelik',
    parentPhone: '5557778899',
    parentEmail: 'hasan.celik@example.com',
    notes: 'Defter kontrollerinde eksikleri tespit edildi.',
  },

  // 10-B Fizik
  {
    id: 'std-201',
    classId: 'class-2',
    number: '201',
    name: 'Ece',
    surname: 'Öztürk',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    parentName: 'Selin Öztürk',
    parentPhone: '5552223344',
    parentEmail: 'selin.ozturk@example.com',
    notes: 'Fizik deneylerinde aktif.',
  },
  {
    id: 'std-202',
    classId: 'class-2',
    number: '202',
    name: 'Mert',
    surname: 'Arslan',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    parentName: 'Murat Arslan',
    parentPhone: '5556667788',
    parentEmail: 'murat.a@example.com',
    notes: 'Konu tekrarlarını düzenli yapıyor.',
  },

  // 8-C Fen Bilimleri
  {
    id: 'std-301',
    classId: 'class-3',
    number: '301',
    name: 'Selin',
    surname: 'Yıldız',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    parentName: 'Emine Yıldız',
    parentPhone: '5558889900',
    parentEmail: 'emine.yildiz@example.com',
    notes: 'LGS hazırlığında gayretli.',
  }
];

export const INITIAL_PLUS_MINUS_LOGS: PerformanceLog[] = [
  // 1. Dönem Kayıtları (2025 Sonbahar / Kış)
  { id: 'pm-101', studentId: 'std-101', classId: 'class-1', date: '2025-10-14', type: 'plus', category: 'Ders Katılımı', note: '1. Dönem: Denklem çözümlerinde çok aktifti' },
  { id: 'pm-102', studentId: 'std-101', classId: 'class-1', date: '2025-11-20', type: 'plus', category: 'Soru Çözümü', note: '1. Dönem: Çözülmesi zor soruyu doğru yaptı' },
  { id: 'pm-103', studentId: 'std-102', classId: 'class-1', date: '2025-10-15', type: 'plus', category: 'Ödev Hazırlığı', note: '1. Dönem: Ödevini eksiksiz hazırlamış' },
  { id: 'pm-104', studentId: 'std-103', classId: 'class-1', date: '2025-11-12', type: 'minus', category: 'Sınıf Kuralları', note: '1. Dönem: Derse geç kaldı' },
  { id: 'pm-105', studentId: 'std-104', classId: 'class-1', date: '2025-12-04', type: 'plus', category: 'Grup Çalışması', note: '1. Dönem: Proje sunumu başarılı' },

  // 2. Dönem Kayıtları (2026 Bahar)
  { id: 'pm-1', studentId: 'std-101', classId: 'class-1', date: '2026-02-10', type: 'plus', category: 'Ders Katılımı', note: 'Derste tahtaya kalkıp soru çözdü' },
  { id: 'pm-2', studentId: 'std-101', classId: 'class-1', date: '2026-02-11', type: 'plus', category: 'Soru Çözümü', note: 'Ekstra problemleri doğru tamamladı' },
  { id: 'pm-3', studentId: 'std-102', classId: 'class-1', date: '2026-02-10', type: 'plus', category: 'Ders Katılımı', note: 'Aktif katılım' },
  { id: 'pm-4', studentId: 'std-102', classId: 'class-1', date: '2026-02-11', type: 'plus', category: 'Ödev Hazırlığı', note: 'Zamanında teslim' },
  { id: 'pm-5', studentId: 'std-103', classId: 'class-1', date: '2026-02-10', type: 'minus', category: 'Ödev Hazırlığı', note: 'Ödevini evde unutmuş' },
  { id: 'pm-6', studentId: 'std-103', classId: 'class-1', date: '2026-02-11', type: 'plus', category: 'Soru Çözümü', note: 'Problem çözümüne katıldı' },
  { id: 'pm-7', studentId: 'std-104', classId: 'class-1', date: '2026-02-10', type: 'plus', category: 'Grup Çalışması', note: 'Grup lideri olarak çok iyi çalıştı' },
  { id: 'pm-8', studentId: 'std-105', classId: 'class-1', date: '2026-02-10', type: 'minus', category: 'Sınıf Kuralları', note: 'Söz almadan konuştu' },
  { id: 'pm-9', studentId: 'std-105', classId: 'class-1', date: '2026-02-11', type: 'minus', category: 'Ders Katılımı', note: 'Ders materyali eksik' },
];

export const INITIAL_QUIZ_DEFINITIONS: Quiz[] = [
  // 1. Dönem
  {
    id: 'quiz-def-term1-1',
    classId: 'class-1',
    title: '1. Dönem Quiz 1: Kümeler ve Mantık',
    date: '2025-10-22',
    description: 'Kümelerde birleşim, kesişim ve sembolik mantık',
  },
  {
    id: 'quiz-def-term1-2',
    classId: 'class-1',
    title: '1. Dönem Quiz 2: Sayı Basamakları',
    date: '2025-12-10',
    description: 'Basamak analizi ve bölünebilme kuralları',
  },
  // 2. Dönem
  {
    id: 'quiz-def-1',
    classId: 'class-1',
    title: 'Quiz 1: Üslü Sayılar',
    date: '2026-02-05',
    description: 'Üslü ifadelerde temel kavramlar, çarpma ve bölme kuralları',
  },
  {
    id: 'quiz-def-2',
    classId: 'class-1',
    title: 'Quiz 2: Köklü İfadeler',
    date: '2026-02-12',
    description: 'Kareköklü ifadeler ve toplama/çıkarma uygulamaları',
  },
  {
    id: 'quiz-def-urgent-1',
    classId: 'class-1',
    title: 'Quiz 3: Çarpanlara Ayırma & Özdeşlikler',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    description: '10 soruluk kısa kazanım tarama sınavı (Not girişi bekleniyor)',
  },
];

export const INITIAL_QUIZZES: QuizScore[] = [
  // 1. Dönem Notları
  { id: 'qz-101', quizId: 'quiz-def-term1-1', studentId: 'std-101', classId: 'class-1', quizTitle: '1. Dönem Quiz 1: Kümeler ve Mantık', score: 92, date: '2025-10-22' },
  { id: 'qz-102', quizId: 'quiz-def-term1-2', studentId: 'std-101', classId: 'class-1', quizTitle: '1. Dönem Quiz 2: Sayı Basamakları', score: 88, date: '2025-12-10' },
  { id: 'qz-103', quizId: 'quiz-def-term1-1', studentId: 'std-102', classId: 'class-1', quizTitle: '1. Dönem Quiz 1: Kümeler ve Mantık', score: 96, date: '2025-10-22' },
  { id: 'qz-104', quizId: 'quiz-def-term1-2', studentId: 'std-102', classId: 'class-1', quizTitle: '1. Dönem Quiz 2: Sayı Basamakları', score: 94, date: '2025-12-10' },
  { id: 'qz-105', quizId: 'quiz-def-term1-1', studentId: 'std-103', classId: 'class-1', quizTitle: '1. Dönem Quiz 1: Kümeler ve Mantık', score: 72, date: '2025-10-22' },
  { id: 'qz-106', quizId: 'quiz-def-term1-2', studentId: 'std-103', classId: 'class-1', quizTitle: '1. Dönem Quiz 2: Sayı Basamakları', score: 68, date: '2025-12-10' },

  // 2. Dönem Notları
  { id: 'qz-1', quizId: 'quiz-def-1', studentId: 'std-101', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 95, date: '2026-02-05' },
  { id: 'qz-2', quizId: 'quiz-def-2', studentId: 'std-101', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 90, date: '2026-02-12' },
  { id: 'qz-3', quizId: 'quiz-def-1', studentId: 'std-102', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 88, date: '2026-02-05' },
  { id: 'qz-4', quizId: 'quiz-def-2', studentId: 'std-102', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 92, date: '2026-02-12' },
  { id: 'qz-5', quizId: 'quiz-def-1', studentId: 'std-103', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 65, date: '2026-02-05' },
  { id: 'qz-6', quizId: 'quiz-def-2', studentId: 'std-103', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 70, date: '2026-02-12' },
  { id: 'qz-7', quizId: 'quiz-def-1', studentId: 'std-104', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 82, date: '2026-02-05' },
  { id: 'qz-8', quizId: 'quiz-def-1', studentId: 'std-105', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 55, date: '2026-02-05' },
];

export const INITIAL_HOMEWORKS: Homework[] = [
  // 1. Dönem
  {
    id: 'hw-term1-1',
    classId: 'class-1',
    title: '1. Dönem: Mantık Önermeler Testi',
    description: 'Sayfa 15-18 arası sorular tamamlanacak',
    assignedDate: '2025-10-10',
    dueDate: '2025-10-17',
  },
  // 2. Dönem
  {
    id: 'hw-1',
    classId: 'class-1',
    title: 'Üslü Sayılar Test 3-4 Solüsyonu',
    description: 'Ders kitabından sayfa 42-45 arasındaki sorular çözülecek.',
    assignedDate: '2026-02-02',
    dueDate: '2026-02-08',
  },
  {
    id: 'hw-2',
    classId: 'class-1',
    title: 'Köklü İfadeler Çalışma Kağıdı',
    description: 'A4 kağıdındaki 10 adet karmaşık soru çözülecek.',
    assignedDate: '2026-02-09',
    dueDate: '2026-02-15',
  },
  {
    id: 'hw-urgent-1',
    classId: 'class-1',
    title: 'Üslü & Köklü Sayılar Peş Pekiştirme Ödevi',
    description: 'Ders kitabı sayfa 52-55 arası sorular çözülüp kontrol edilecek.',
    assignedDate: new Date(Date.now() - 12 * 3600000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 16 * 3600000).toISOString().slice(0, 10),
  },
  {
    id: 'hw-urgent-2',
    classId: 'class-2',
    title: 'Fizik: Vektörler ve Kuvvet Dengesi',
    description: 'Problem seti 2.1 - 2.8 arası 8 soru deftere çözülecek.',
    assignedDate: new Date(Date.now() - 18 * 3600000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  },
];

export const INITIAL_HOMEWORK_RECORDS: HomeworkRecord[] = [
  // 1. Dönem
  { id: 'hwr-101', homeworkId: 'hw-term1-1', studentId: 'std-101', status: 'completed', updatedAt: '2025-10-16' },
  { id: 'hwr-102', homeworkId: 'hw-term1-1', studentId: 'std-102', status: 'completed', updatedAt: '2025-10-16' },
  { id: 'hwr-103', homeworkId: 'hw-term1-1', studentId: 'std-103', status: 'completed', updatedAt: '2025-10-17' },
  { id: 'hwr-104', homeworkId: 'hw-term1-1', studentId: 'std-104', status: 'completed', updatedAt: '2025-10-17' },
  // 2. Dönem
  { id: 'hwr-1', homeworkId: 'hw-1', studentId: 'std-101', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-2', homeworkId: 'hw-1', studentId: 'std-102', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-3', homeworkId: 'hw-1', studentId: 'std-103', status: 'missing', updatedAt: '2026-02-08' },
  { id: 'hwr-4', homeworkId: 'hw-1', studentId: 'std-104', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-5', homeworkId: 'hw-1', studentId: 'std-105', status: 'late', updatedAt: '2026-02-09' },
];

export const INITIAL_NOTEBOOK_CONTROLS: NotebookControl[] = [
  // 1. Dönem
  { id: 'nb-101', studentId: 'std-101', classId: 'class-1', date: '2025-11-15', status: 'full', percentage: 95, note: '1. Dönem defteri eksiksiz' },
  { id: 'nb-102', studentId: 'std-102', classId: 'class-1', date: '2025-11-15', status: 'full', percentage: 100, note: '1. Dönem harika tertip' },
  { id: 'nb-103', studentId: 'std-103', classId: 'class-1', date: '2025-11-15', status: 'partial', percentage: 75, note: '1. Dönem birkaç sayfa eksik' },

  // 2. Dönem
  { id: 'nb-1', studentId: 'std-101', classId: 'class-1', date: '2026-02-10', status: 'full', percentage: 100, note: 'Tüm konu özetleri ve çizimler tam.' },
  { id: 'nb-2', studentId: 'std-102', classId: 'class-1', date: '2026-02-10', status: 'full', percentage: 95, note: 'Çok temiz ve tertipli.' },
  { id: 'nb-3', studentId: 'std-103', classId: 'class-1', date: '2026-02-10', status: 'partial', percentage: 60, note: 'Son 2 haftalık formüller eksik.' },
  { id: 'nb-4', studentId: 'std-104', classId: 'class-1', date: '2026-02-10', status: 'full', percentage: 90, note: 'Tamamlanmış.' },
  { id: 'nb-5', studentId: 'std-105', classId: 'class-1', date: '2026-02-10', status: 'missing', percentage: 35, note: 'Defterde büyük boşluklar var.' },
];

export const INITIAL_WEIGHT_SETTINGS: WeightSettings = {
  classId: 'global',
  quizWeight: 30,      // %30 Sınav / Quiz
  plusMinusWeight: 25, // %25 Derse Katılım (+/-)
  homeworkWeight: 25,  // %25 Ödev Takibi
  notebookWeight: 20,  // %20 Defter Kontrolü
};

export const DEFAULT_NOTIFICATION_CONFIG: NotificationSettingsConfig = {
  homeworkDeadlineEnabled: true,
  homeworkDeadlineDays: 2, // Son 2 gün kala teslim uyarısı
  quizUngradedAlertEnabled: true,
  quizUngradedDays: 2, // Quiz üzerinden 2 gün geçmesine rağmen not girilmemişse
  notebookUngradedAlertEnabled: true,
  notebookUngradedDays: 3, // Defter kontrolü üzerinden 3 gün geçmesine rağmen not girilmemişse
  soundEnabled: true,
  showOnDashboard: true,
};

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'notif-1',
    name: 'Düşük Defter Kontrolü Uyarısı',
    enabled: true,
    type: 'notebook_low',
    threshold: 50,
    template: 'Defter kontrolü %{threshold} altında kalan öğrenciler velilerine otomatik bildirilsin.',
  },
  {
    id: 'notif-2',
    name: 'Eksik Ödev Bildirimi',
    enabled: true,
    type: 'homework_missing',
    threshold: 1,
    template: 'Üst üste {threshold} ödev teslim etmeyen öğrenci velilerine mesaj taslağı hazırlansın.',
  },
  {
    id: 'notif-3',
    name: 'Negatif Katılım / Performans',
    enabled: true,
    type: 'negative_plusminus',
    threshold: -2,
    template: 'Net eksi sayısı {threshold} değerine ulaşan öğrenciler için uyarı verilsin.',
  },
];

export const INITIAL_FEEDBACK_LOGS: ParentFeedbackLog[] = [
  {
    id: 'fb-1',
    studentId: 'std-103',
    parentPhone: '5553334455',
    message: 'Sayın Velimiz, Can\'ın Matematik defter kontrolünde %60 tamamlanma görülmüştür. Eksikleri tamamlaması için desteğinizi rica ederiz.',
    channel: 'whatsapp',
    sentAt: '2026-02-11 14:30',
    sentBy: 'Mert Öğretmen',
  },
  {
    id: 'fb-2',
    studentId: 'std-105',
    parentPhone: '5557778899',
    message: 'Sayın Velimiz, Burak\'ın ders araç gereçleri eksiktir ve defter kontrolü %35 durumundadır. Görüşmek dileğiyle.',
    channel: 'sms',
    sentAt: '2026-02-10 16:15',
    sentBy: 'Mert Öğretmen',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-02-12T14:45:00.000Z',
    date: '2026-02-12',
    time: '14:45',
    category: 'quiz',
    actionType: 'create',
    title: 'Yeni Quiz Tanımlandı',
    description: '9-A sınıfı için "Quiz 2: Köklü İfadeler" sınavı oluşturuldu.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: false,
    affectedCount: 1,
    metadata: { quizTitle: 'Quiz 2: Köklü İfadeler', maxScore: 100 },
  },
  {
    id: 'log-2',
    timestamp: '2026-02-12T11:20:00.000Z',
    date: '2026-02-12',
    time: '11:20',
    category: 'plusminus',
    actionType: 'bulk_save',
    title: 'Toplu Artı / Eksi Değerlendirmesi Yapıldı',
    description: '9-A sınıfından 4 öğrenciye derse katılım ve soru çözümü kapsamında artı/eksi puan verildi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: true,
    affectedCount: 4,
    studentDetails: [
      { studentId: 'std-101', studentName: 'Ahmet Yılmaz', studentNumber: '101', actionSummary: '+1 Artı eklendi (Soru Çözümü)', badgeType: 'success' },
      { studentId: 'std-102', studentName: 'Ayşe Kaya', studentNumber: '102', actionSummary: '+1 Artı eklendi (Ders Katılımı)', badgeType: 'success' },
      { studentId: 'std-104', studentName: 'Elif Demir', studentNumber: '104', actionSummary: '+1 Artı eklendi (Grup Çalışması)', badgeType: 'success' },
      { studentId: 'std-105', studentName: 'Burak Şahin', studentNumber: '105', actionSummary: '-1 Eksi verildi (Sınıf Kuralları)', badgeType: 'danger' },
    ],
  },
  {
    id: 'log-3',
    timestamp: '2026-02-11T14:30:00.000Z',
    date: '2026-02-11',
    time: '14:30',
    category: 'parent',
    actionType: 'send_message',
    title: 'Veliye WhatsApp Bildirimi Gönderildi',
    description: 'Can Özdemir (No: 103) velisine defter eksikliği bildirimi iletildi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: false,
    affectedCount: 1,
    studentDetails: [
      { studentId: 'std-103', studentName: 'Can Özdemir', studentNumber: '103', actionSummary: 'WhatsApp Mesajı: "Defter kontrolünde %60 tamamlanma görülmüştür..."', badgeType: 'info' }
    ],
  },
  {
    id: 'log-4',
    timestamp: '2026-02-10T15:10:00.000Z',
    date: '2026-02-10',
    time: '15:10',
    category: 'notebook',
    actionType: 'bulk_save',
    title: '9-A Sınıfı Defter Kontrolü Kaydedildi',
    description: '5 öğrencinin defter kontrol sonuçları ve puanları sisteme işlendi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: true,
    affectedCount: 5,
    studentDetails: [
      { studentId: 'std-101', studentName: 'Ahmet Yılmaz', studentNumber: '101', actionSummary: 'Defter: Tam (%100) - "Tüm konu özetleri ve çizimler tam."', badgeType: 'success' },
      { studentId: 'std-102', studentName: 'Ayşe Kaya', studentNumber: '102', actionSummary: 'Defter: Tam (%95) - "Çok temiz ve tertipli."', badgeType: 'success' },
      { studentId: 'std-103', studentName: 'Can Özdemir', studentNumber: '103', actionSummary: 'Defter: Yarım (%60) - "Son 2 haftalık formüller eksik."', badgeType: 'warning' },
      { studentId: 'std-104', studentName: 'Elif Demir', studentNumber: '104', actionSummary: 'Defter: Tam (%90) - "Tamamlanmış."', badgeType: 'success' },
      { studentId: 'std-105', studentName: 'Burak Şahin', studentNumber: '105', actionSummary: 'Defter: Eksik (%35) - "Defterde büyük boşluklar var."', badgeType: 'danger' },
    ],
  },
  {
    id: 'log-5',
    timestamp: '2026-02-09T09:00:00.000Z',
    date: '2026-02-09',
    time: '09:00',
    category: 'homework',
    actionType: 'create',
    title: 'Yeni Ödev Atandı',
    description: '"Köklü İfadeler Çalışma Kağıdı" ödevi 9-A sınıfına atandı (Son Teslim: 15 Şubat).',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: false,
    affectedCount: 1,
    metadata: { title: 'Köklü İfadeler Çalışma Kağıdı', dueDate: '2026-02-15' },
  },
  {
    id: 'log-6',
    timestamp: '2026-02-08T16:00:00.000Z',
    date: '2026-02-08',
    time: '16:00',
    category: 'homework',
    actionType: 'bulk_save',
    title: 'Ödev Teslim Durumları Güncellendi',
    description: '"Üslü Sayılar Test 3-4 Solüsyonu" ödevi için 5 öğrencinin teslim kaydı işlendi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: true,
    affectedCount: 5,
    studentDetails: [
      { studentId: 'std-101', studentName: 'Ahmet Yılmaz', studentNumber: '101', actionSummary: 'Ödev: Eksiksiz Teslim Edildi', badgeType: 'success' },
      { studentId: 'std-102', studentName: 'Ayşe Kaya', studentNumber: '102', actionSummary: 'Ödev: Eksiksiz Teslim Edildi', badgeType: 'success' },
      { studentId: 'std-103', studentName: 'Can Özdemir', studentNumber: '103', actionSummary: 'Ödev: Teslim Edilmedi (Eksik)', badgeType: 'danger' },
      { studentId: 'std-104', studentName: 'Elif Demir', studentNumber: '104', actionSummary: 'Ödev: Eksiksiz Teslim Edildi', badgeType: 'success' },
      { studentId: 'std-105', studentName: 'Burak Şahin', studentNumber: '105', actionSummary: 'Ödev: Geç Teslim Edildi', badgeType: 'warning' },
    ],
  },
  {
    id: 'log-7',
    timestamp: '2026-02-05T10:30:00.000Z',
    date: '2026-02-05',
    time: '10:30',
    category: 'quiz',
    actionType: 'bulk_save',
    title: 'Quiz Puanları Girildi',
    description: '"Quiz 1: Üslü Sayılar" sınavı için sınıf notları kaydedildi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: true,
    affectedCount: 5,
    studentDetails: [
      { studentId: 'std-101', studentName: 'Ahmet Yılmaz', studentNumber: '101', actionSummary: 'Quiz Puanı: 95 / 100', badgeType: 'success' },
      { studentId: 'std-102', studentName: 'Ayşe Kaya', studentNumber: '102', actionSummary: 'Quiz Puanı: 88 / 100', badgeType: 'success' },
      { studentId: 'std-103', studentName: 'Can Özdemir', studentNumber: '103', actionSummary: 'Quiz Puanı: 65 / 100', badgeType: 'warning' },
      { studentId: 'std-104', studentName: 'Elif Demir', studentNumber: '104', actionSummary: 'Quiz Puanı: 82 / 100', badgeType: 'success' },
      { studentId: 'std-105', studentName: 'Burak Şahin', studentNumber: '105', actionSummary: 'Quiz Puanı: 55 / 100', badgeType: 'danger' },
    ],
  },
  {
    id: 'log-8',
    timestamp: '2026-02-02T08:30:00.000Z',
    date: '2026-02-02',
    time: '08:30',
    category: 'schedule',
    actionType: 'update',
    title: 'Haftalık Ders Programı Güncellendi',
    description: 'Pazartesi 1-2. saatlere 9-A Matematik dersi yerleştirildi.',
    classId: 'class-1',
    className: '9-A (Matematik)',
    isBulk: false,
    affectedCount: 1,
  },
];

export const INITIAL_LESSON_LOGS: LessonLogNote[] = [
  {
    id: 'log-ll-1',
    classId: 'class-1',
    className: '9-A',
    subject: 'Matematik',
    date: '2026-02-13',
    time: '11:40',
    rawInputText: 'Bugün mutlak değerde sayfa 48 soru 3te kaldık ahmetin sorusunu çözemedik haftaya 5. sorudan devam edip ödevleri kontrol edelim sınıf biraz gürültülüydü',
    lastTopic: 'Mutlak Değerli Eşitsizlikler',
    lastPageAndQuestion: 'Sayfa 48, Soru 3',
    nextLessonActions: [
      'Sayfa 48 Soru 5\'ten itibaren çözüme devam edilecek',
      'Geçen haftaki mutlak değer test ödevi kontrol edilecek',
      'Ahmet\'in tahtada sorulan sorusu detaylı açıklanacak'
    ],
    completedActions: [],
    classAtmosphereNote: 'Katılım canlıydı fakat son 10 dakikada sınıf içi ses seviyesi biraz yükseldi.',
    summary: 'Mutlak Değerli Eşitsizlikler işlendi, sayfa 48 soru 3\'te kalındı. Gelecek derste 5. sorudan devam edilip ödevler kontrol edilecek.',
    isResolved: false,
    createdAt: '2026-02-13T11:42:00.000Z',
  },
  {
    id: 'log-ll-2',
    classId: 'class-2',
    className: '10-B',
    subject: 'Fizik',
    date: '2026-02-12',
    time: '14:20',
    rawInputText: 'Basınç ünitesinde sıvı basıncı formülü çıkarıldı sayfa 72deki örnek 4 bitti sıra sende 2 ödev verildi gelecek ders katı sıvı basıncı karşılaştırması yapılacak',
    lastTopic: 'Sıvı Basıncı ve Sıvıların Basınç İletimi',
    lastPageAndQuestion: 'Sayfa 72, Örnek 4 (Bitti)',
    nextLessonActions: [
      'Sayfa 72 "Sıra Sende 2" ödevi kontrol edilecek',
      'Katı ve Sıvı Basıncı karşılaştırma etkinlikleri yapılacak',
      'U borulu manometre deney düzeneği incelenecek'
    ],
    completedActions: [
      'Sayfa 72 "Sıra Sende 2" ödevi kontrol edilecek'
    ],
    classAtmosphereNote: 'Öğrenciler soru çözümüne ve derse çok ilgiliydi, motivasyon yüksekti.',
    summary: 'Sıvı basıncı formülü işlendi, Sayfa 72 Örnek 4 tamamlandı. Sıra sende 2 ödevi kontrol edilip manometrelere geçilecek.',
    isResolved: false,
    createdAt: '2026-02-12T14:22:00.000Z',
  }
];


