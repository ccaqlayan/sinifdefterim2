import { ClassRoom, Student, PerformanceLog, QuizScore, Homework, HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, ParentFeedbackLog } from './types';

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
    name: '8-C',
    grade: '8',
    subject: 'Fen Bilimleri',
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

export const INITIAL_QUIZZES: QuizScore[] = [
  { id: 'qz-1', studentId: 'std-101', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 95, date: '2026-02-05' },
  { id: 'qz-2', studentId: 'std-101', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 90, date: '2026-02-12' },
  { id: 'qz-3', studentId: 'std-102', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 88, date: '2026-02-05' },
  { id: 'qz-4', studentId: 'std-102', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 92, date: '2026-02-12' },
  { id: 'qz-5', studentId: 'std-103', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 65, date: '2026-02-05' },
  { id: 'qz-6', studentId: 'std-103', classId: 'class-1', quizTitle: 'Quiz 2: Köklü İfadeler', score: 70, date: '2026-02-12' },
  { id: 'qz-7', studentId: 'std-104', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 82, date: '2026-02-05' },
  { id: 'qz-8', studentId: 'std-105', classId: 'class-1', quizTitle: 'Quiz 1: Üslü Sayılar', score: 55, date: '2026-02-05' },
];

export const INITIAL_HOMEWORKS: Homework[] = [
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
];

export const INITIAL_HOMEWORK_RECORDS: HomeworkRecord[] = [
  { id: 'hwr-1', homeworkId: 'hw-1', studentId: 'std-101', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-2', homeworkId: 'hw-1', studentId: 'std-102', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-3', homeworkId: 'hw-1', studentId: 'std-103', status: 'missing', updatedAt: '2026-02-08' },
  { id: 'hwr-4', homeworkId: 'hw-1', studentId: 'std-104', status: 'completed', updatedAt: '2026-02-08' },
  { id: 'hwr-5', homeworkId: 'hw-1', studentId: 'std-105', status: 'late', updatedAt: '2026-02-09' },
];

export const INITIAL_NOTEBOOK_CONTROLS: NotebookControl[] = [
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
