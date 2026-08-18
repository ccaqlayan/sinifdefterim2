import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Mic, MicOff, BookOpen, CheckCircle2, Clock, Calendar, 
  ListPlus, Plus, Trash2, HelpCircle, ArrowRight, Loader2, AlertCircle, 
  Volume2, Check, MessageSquare, ChevronDown, ChevronUp, Edit3, Bookmark, 
  BookMarked, Layers, RotateCcw, Settings, Wrench
} from 'lucide-react';
import { ClassRoom, LessonLogNote } from '../../types';
import { Storage } from '../../utils/storage';

interface QuickLessonLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  selectedClassId?: string;
  defaultClassId?: string;
  onSaveLog: (log: LessonLogNote) => void;
  initialLog?: LessonLogNote | null;
  editLog?: LessonLogNote | null;
  teacherName?: string;
  userId?: string;
}

export const QuickLessonLogModal: React.FC<QuickLessonLogModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  defaultClassId,
  onSaveLog,
  initialLog = null,
  editLog = null,
  teacherName,
  userId,
}) => {
  const targetInitialLog = editLog || initialLog;
  const initialClassId = defaultClassId || selectedClassId || classes[0]?.id || '';

  const [classId, setClassId] = useState<string>(initialClassId);
  const [date, setDate] = useState<string>(
    targetInitialLog?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(
    targetInitialLog?.time || new Date().toTimeString().slice(0, 5)
  );

  // Derste kullanılan kaynak (Kitap, Föy, Soru Bankası vb.)
  const [resourcesList, setResourcesList] = useState<string[]>([]);
  const [resourceName, setResourceName] = useState<string>(targetInitialLog?.resourceName || '');
  const [isAddingNewResource, setIsAddingNewResource] = useState<boolean>(false);
  const [newResourceInput, setNewResourceInput] = useState<string>('');
  
  // Kaynak Yönetimi & Düzenleme Paneli
  const [showResourceManager, setShowResourceManager] = useState<boolean>(false);
  const [editingResourceIdx, setEditingResourceIdx] = useState<number | null>(null);
  const [editingResourceText, setEditingResourceText] = useState<string>('');

  // 2. İşlenen Konu & Gelecek Derste Yapılacak Eylemler (Varsayılan olarak kapalı)
  const [showTopicAndActionsPanel, setShowTopicAndActionsPanel] = useState<boolean>(false);
  const [lastTopic, setLastTopic] = useState<string>(targetInitialLog?.lastTopic || '');
  const [lastPageAndQuestion, setLastPageAndQuestion] = useState<string>(targetInitialLog?.lastPageAndQuestion || '');
  const [nextLessonActions, setNextLessonActions] = useState<string[]>(targetInitialLog?.nextLessonActions || []);
  const [newActionInput, setNewActionInput] = useState<string>('');
  const [classAtmosphereNote, setClassAtmosphereNote] = useState<string>(targetInitialLog?.classAtmosphereNote || '');
  const [summary, setSummary] = useState<string>(targetInitialLog?.summary || '');

  // Freeform / Voice input (Optional quick helper)
  const [rawText, setRawText] = useState<string>(targetInitialLog?.rawInputText || '');

  // Quick Expressions / Templates (Collapsible & Customizable, varsayılan kapalı)
  const [showTemplatesPanel, setShowTemplatesPanel] = useState<boolean>(false);
  const [templatesList, setTemplatesList] = useState<string[]>([]);
  const [isAddingNewTemplate, setIsAddingNewTemplate] = useState<boolean>(false);
  const [newTemplateInput, setNewTemplateInput] = useState<string>('');
  const [editingTemplateIdx, setEditingTemplateIdx] = useState<number | null>(null);
  const [editingTemplateText, setEditingTemplateText] = useState<string>('');

  // UI state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Recognition ref
  const recognitionRef = useRef<any>(null);

  // Load resources & templates on open
  useEffect(() => {
    if (isOpen) {
      const loadedResources = Storage.getLessonResources(userId);
      setResourcesList(loadedResources);

      const loadedTemplates = Storage.getLessonTemplates(userId);
      setTemplatesList(loadedTemplates);

      const activeLog = editLog || initialLog;
      if (activeLog) {
        setClassId(activeLog.classId);
        setDate(activeLog.date);
        setTime(activeLog.time || new Date().toTimeString().slice(0, 5));
        setResourceName(activeLog.resourceName || (loadedResources[0] || 'MEB Ders Kitabı'));
        setRawText(activeLog.rawInputText);
        setLastTopic(activeLog.lastTopic || '');
        setLastPageAndQuestion(activeLog.lastPageAndQuestion || '');
        setNextLessonActions(activeLog.nextLessonActions || []);
        setClassAtmosphereNote(activeLog.classAtmosphereNote || '');
        setSummary(activeLog.summary || '');
        // If there are existing actions or topic, open panel
        if (activeLog.lastTopic || (activeLog.nextLessonActions && activeLog.nextLessonActions.length > 0)) {
          setShowTopicAndActionsPanel(true);
        } else {
          setShowTopicAndActionsPanel(false);
        }
      } else {
        const initialClsId = defaultClassId || selectedClassId || classes[0]?.id || '';
        setClassId(initialClsId);
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setResourceName(loadedResources[0] || 'MEB Ders Kitabı');
        setRawText('');
        setLastTopic('');
        setLastPageAndQuestion('');
        setNextLessonActions([]);
        setClassAtmosphereNote('');
        setSummary('');
        setShowTopicAndActionsPanel(false);
      }

      setErrorMessage(null);
      setAiSuccessMessage(null);
      setIsRecording(false);
      setIsAddingNewResource(false);
      setShowResourceManager(false);
      setEditingResourceIdx(null);
      setIsAddingNewTemplate(false);
      setEditingTemplateIdx(null);
      setShowTemplatesPanel(false);
    }
  }, [isOpen, selectedClassId, defaultClassId, initialLog, editLog, classes, userId]);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        if (transcript.trim()) {
          setRawText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Mikrofon erişim izni verilmedi. Lütfen tarayıcı ayarlarından mikrofon iznini açın.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition setup failed:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) {
      setErrorMessage('Tarayıcınız sesle yazmayı desteklemiyor. Lütfen klavye ile alanları doldurunuz.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsRecording(false);
      }
    }
  };

  // Resources Management
  const handleAddNewResource = () => {
    const trimmed = newResourceInput.trim();
    if (!trimmed) return;

    if (!resourcesList.includes(trimmed)) {
      const updated = [...resourcesList, trimmed];
      setResourcesList(updated);
      Storage.setLessonResources(userId, updated);
    }
    setResourceName(trimmed);
    setNewResourceInput('');
    setIsAddingNewResource(false);
  };

  const handleSaveEditedResource = (index: number) => {
    const trimmed = editingResourceText.trim();
    if (!trimmed) return;

    const oldName = resourcesList[index];
    const updated = [...resourcesList];
    updated[index] = trimmed;
    setResourcesList(updated);
    Storage.setLessonResources(userId, updated);

    if (resourceName === oldName) {
      setResourceName(trimmed);
    }

    setEditingResourceIdx(null);
    setEditingResourceText('');
  };

  const handleDeleteResource = (resToDelete: string) => {
    const updated = resourcesList.filter((r) => r !== resToDelete);
    setResourcesList(updated);
    Storage.setLessonResources(userId, updated);
    if (resourceName === resToDelete) {
      setResourceName(updated[0] || '');
    }
  };

  const handleResetDefaultResources = () => {
    const defaultResources = [
      'MEB Ders Kitabı',
      'Kazanım Kavrama Testi',
      'Soru Bankası',
      'Ders Defteri / Notları',
      'Fasikül / Föy',
      'Deneme Sınavı',
      'Çalışma Yaprağı',
    ];
    setResourcesList(defaultResources);
    Storage.setLessonResources(userId, defaultResources);
    if (!defaultResources.includes(resourceName)) {
      setResourceName(defaultResources[0]);
    }
  };

  // Templates Management
  const handleAddNewTemplate = () => {
    const trimmed = newTemplateInput.trim();
    if (!trimmed) return;

    if (!templatesList.includes(trimmed)) {
      const updated = [...templatesList, trimmed];
      setTemplatesList(updated);
      Storage.setLessonTemplates(userId, updated);
    }
    setNewTemplateInput('');
    setIsAddingNewTemplate(false);
  };

  const handleSaveEditedTemplate = (index: number) => {
    const trimmed = editingTemplateText.trim();
    if (!trimmed) return;

    const updated = [...templatesList];
    updated[index] = trimmed;
    setTemplatesList(updated);
    Storage.setLessonTemplates(userId, updated);
    setEditingTemplateIdx(null);
    setEditingTemplateText('');
  };

  const handleDeleteTemplate = (index: number) => {
    const updated = templatesList.filter((_, i) => i !== index);
    setTemplatesList(updated);
    Storage.setLessonTemplates(userId, updated);
  };

  const handleApplyTemplate = (template: string) => {
    // If it's an action-like template, also add to actions and open panel
    if (template.toLowerCase().includes('ödev') || template.toLowerCase().includes('kontrol') || template.toLowerCase().includes('çözülecek')) {
      if (!nextLessonActions.includes(template)) {
        setNextLessonActions((prev) => [...prev, template]);
      }
      setShowTopicAndActionsPanel(true);
    }
    setRawText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${template}` : template;
    });
  };

  const currentSelectedClass = classes.find((c) => c.id === classId);

  // Trigger Gemini AI Parsing to auto-populate form fields
  const handleAnalyzeWithAI = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Lütfen önce sesle bir not söyleyin veya kutucuğa serbest bir ifade yazın.');
      return;
    }

    setIsAiProcessing(true);
    setErrorMessage(null);
    setAiSuccessMessage(null);

    // Stop recording if active
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
    }

    try {
      const res = await fetch('/api/gemini/parse-lesson-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawText.trim(),
          className: currentSelectedClass?.name || 'Sınıf',
          subject: currentSelectedClass?.subject || 'Ders',
        }),
      });

      if (!res.ok) {
        throw new Error(`AI sunucu yanıt vermedi: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.lastTopic) setLastTopic(data.lastTopic);
      if (data.lastPageAndQuestion) setLastPageAndQuestion(data.lastPageAndQuestion);
      if (Array.isArray(data.nextLessonActions) && data.nextLessonActions.length > 0) {
        setNextLessonActions(data.nextLessonActions);
      }
      if (data.classAtmosphereNote) setClassAtmosphereNote(data.classAtmosphereNote);
      if (data.summary) setSummary(data.summary);

      // Check if text mentioned a resource
      const lower = rawText.toLowerCase();
      const matchedRes = resourcesList.find((r) => lower.includes(r.toLowerCase()));
      if (matchedRes) {
        setResourceName(matchedRes);
      }

      // Auto-open panel so user sees extracted actions/topic
      setShowTopicAndActionsPanel(true);
      setAiSuccessMessage('✨ Yapay Zeka notunuzu başarıyla ayrıştırıp ilgili alanlara yerleştirdi!');
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn('AI parse fallback triggered:', err);
      // Smart Turkish local heuristic fallback
      const text = rawText.trim();
      const pageMatch = text.match(/(?:sayfa|sf\.?)\s*(\d+)/i);
      const questionMatch = text.match(/(?:soru|soruda|örnek|etkinlik|test)\s*(\d+[\w-]*)/i);
      
      let detectedPageAndQ = lastPageAndQuestion || 'Ders İşlendi';
      if (pageMatch && questionMatch) {
        detectedPageAndQ = `Sayfa ${pageMatch[1]}, Soru ${questionMatch[1]}`;
      } else if (pageMatch) {
        detectedPageAndQ = `Sayfa ${pageMatch[1]}`;
      } else if (questionMatch) {
        detectedPageAndQ = `Soru ${questionMatch[1]}`;
      }

      const actions: string[] = [...nextLessonActions];
      if (text.match(/ödev/i) && !actions.some((a) => a.includes('Ödev'))) {
        actions.push('Ödev kontrolü yapılacak');
      }
      if ((pageMatch || text.match(/devam/i)) && !actions.some((a) => a.includes('soru') || a.includes('Sayfa'))) {
        actions.push(pageMatch ? `Sayfa ${pageMatch[1]} kalan sorular çözülecek` : 'Kaldığımız yerden soru çözümüne devam edilecek');
      }
      if (actions.length === 0) {
        actions.push('Ders tekrarı ve soru çözümü yapılacak');
      }

      setLastTopic(lastTopic || currentSelectedClass?.subject || 'Ders Konusu');
      setLastPageAndQuestion(detectedPageAndQ);
      setNextLessonActions(actions);
      if (text.match(/gürültü|ses|konuşan/i)) {
        setClassAtmosphereNote('Sınıf içi ses seviyesi zaman zaman yükseldi.');
      } else if (text.match(/katılım|harika|canlı|aktif/i)) {
        setClassAtmosphereNote('Sınıfın derse katılımı ve motivasyonu oldukça iyiydi.');
      }
      setSummary(`${currentSelectedClass?.subject || 'Ders'} işlendi, ${detectedPageAndQ} noktasında kalındı.`);
      setShowTopicAndActionsPanel(true);
      setAiSuccessMessage('✨ Akıllı ayrıştırıcı notunuzu ilgili alanlara aktardı.');
      setTimeout(() => setAiSuccessMessage(null), 4000);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAddActionItem = () => {
    if (!newActionInput.trim()) return;
    setNextLessonActions((prev) => [...prev, newActionInput.trim()]);
    setNewActionInput('');
  };

  const handleRemoveActionItem = (index: number) => {
    setNextLessonActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const targetClass = classes.find((c) => c.id === classId);
    const finalTopic = lastTopic.trim() || targetClass?.subject || 'Ders Konusu';
    const finalPageAndQ = lastPageAndQuestion.trim() || 'Ders İşlendi';
    const finalResource = resourceName.trim() || 'Ders Materyali';

    // Formulate a clean summary if empty
    const finalSummary = summary.trim() || 
      `${finalResource ? `[${finalResource}] ` : ''}${finalTopic} işlendi, ${finalPageAndQ} noktasında kalındı.`;

    const finalRaw = rawText.trim() || `${finalResource} - ${finalPageAndQ} (${finalTopic})`;

    const newLog: LessonLogNote = {
      id: initialLog?.id || editLog?.id || `log-ll-${Date.now()}`,
      classId,
      className: targetClass?.name || 'Sınıf',
      subject: targetClass?.subject || 'Ders',
      date,
      time,
      resourceName: finalResource,
      rawInputText: finalRaw,
      lastTopic: finalTopic,
      lastPageAndQuestion: finalPageAndQ,
      nextLessonActions,
      completedActions: (editLog?.completedActions || initialLog?.completedActions) || [],
      classAtmosphereNote: classAtmosphereNote.trim(),
      summary: finalSummary,
      isResolved: false,
      createdAt: (editLog?.createdAt || initialLog?.createdAt) || new Date().toISOString(),
    };

    onSaveLog(newLog);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="quick-lesson-log-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-4 sm:px-5 py-3.5 border-b border-indigo-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/50 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {editLog || initialLog ? 'Ders Seyir Notunu Düzenle' : 'Ders Sonu Hızlı Notu & Seyir Defteri'}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Pratik Giriş
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Kaynak seçin, sayfa yazın veya sesli not alın; bir sonraki derste karşınıza gelsin!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}

          {/* Sınıf, Tarih ve Saat Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Sınıf Seçimi</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Ders Tarihi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Ders Saati</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 1. BÖLÜM: DERSTE KULLANILAN KAYNAK & KALINAN SAYFA/SORU */}
          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-amber-400" />
                1. Kullanılan Kaynak & Kaldığımız Yer (Sayfa / Soru No)
              </span>
              <button
                type="button"
                onClick={() => setShowResourceManager(!showResourceManager)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-lg"
                title="Kayıtlı kaynakları düzenle, yeni kaynak ekle veya sil"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kaynakları Yönet {showResourceManager ? '(Kapat)' : ''}</span>
              </button>
            </div>

            {/* Kaynak Yönetimi & Düzenleme Paneli (Açılır Kapanır) */}
            {showResourceManager && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    Kayıtlı Kaynak Kütüphanesi Düzenleme ({resourcesList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDefaultResources}
                    className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    title="Varsayılan MEB ve test kaynaklarını geri yükle"
                  >
                    <RotateCcw className="w-3 h-3" /> Varsayılana Sıfırla
                  </button>
                </div>

                {/* Yeni Kaynak Ekleme Formu */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newResourceInput}
                    onChange={(e) => setNewResourceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewResource();
                      }
                    }}
                    placeholder="Yeni kaynak adı yazın (Örn: Apotemi Türev Fasikülü)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewResource}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kaynağı Ekle
                  </button>
                </div>

                {/* Kaynaklar Listesi (Düzenle & Sil) */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {resourcesList.map((res, idx) => {
                    const isEditing = editingResourceIdx === idx;
                    if (isEditing) {
                      return (
                        <div key={idx} className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/50 p-1.5 rounded-lg">
                          <input
                            type="text"
                            value={editingResourceText}
                            onChange={(e) => setEditingResourceText(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedResource(idx)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                            title="Kaydet"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingResourceIdx(null)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="İptal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs"
                      >
                        <span className="text-slate-200 font-semibold truncate flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{res}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingResourceIdx(idx);
                              setEditingResourceText(res);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded cursor-pointer"
                            title="Kaynağı Yeniden Adlandır / Düzenle"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(res)}
                            className="p-1 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Kaynağı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Kaynak Seçimi */}
              <div className="sm:col-span-6 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-300">
                    📖 Derste Kullanılan Kaynak / Kitap:
                  </label>
                  {!isAddingNewResource && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewResource(true)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Hızlı Ekle
                    </button>
                  )}
                </div>

                {isAddingNewResource ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newResourceInput}
                      onChange={(e) => setNewResourceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewResource();
                        }
                      }}
                      placeholder="Yeni kaynak adı (Örn: Apotemi Fasikülü)..."
                      className="flex-1 bg-slate-900 border border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewResource}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewResource(false)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={resourceName}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewResource(true);
                        } else if (e.target.value === '__manage__') {
                          setShowResourceManager(true);
                        } else {
                          setResourceName(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {resourcesList.map((res, idx) => (
                        <option key={idx} value={res}>
                          {res}
                        </option>
                      ))}
                      <option value="__add_new__" className="text-amber-400 font-bold">
                        ➕ Yeni Kaynak Ekle...
                      </option>
                      <option value="__manage__" className="text-indigo-400 font-bold">
                        ⚙️ Kaynakları Düzenle & Sil...
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Kaldığımız Yer / Sayfa & Soru */}
              <div className="sm:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-amber-300">
                  📍 Bu Kaynakta Kalınan Yer / Sayfa & Soru:
                </label>
                <input
                  type="text"
                  value={lastPageAndQuestion}
                  onChange={(e) => setLastPageAndQuestion(e.target.value)}
                  placeholder="Örn: Sayfa 48, Soru 3 (veya Test 4)"
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-black text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 2. BÖLÜM: İŞLENEN KONU VE GELECEK DERS YAPILACAKLAR (İstek: Varsayılan Kapalı, Göster/Gizle Butonlu) */}
          <div className="border border-slate-800 rounded-2xl bg-slate-950/50 overflow-hidden">
            {/* Akordiyon Başlığı */}
            <button
              type="button"
              onClick={() => setShowTopicAndActionsPanel(!showTopicAndActionsPanel)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-slate-200">
                  2. İşlenen Konu & Gelecek Derste Yapılacak Eylemler
                </span>
                {(nextLessonActions.length > 0 || lastTopic) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {nextLessonActions.length > 0 ? `${nextLessonActions.length} Eylem` : ''} {lastTopic ? `• ${lastTopic.slice(0, 20)}...` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px] font-semibold">{showTopicAndActionsPanel ? 'Gizle' : 'Göster'}</span>
                {showTopicAndActionsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Açılır / Kapanır İçerik */}
            {showTopicAndActionsPanel && (
              <div className="p-3.5 sm:p-4 border-t border-slate-800 space-y-3.5 animate-in slide-in-from-top-1 duration-200">
                {/* Konu Başlığı */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    📚 İşlenen / Kalınan Konu Başlığı:
                  </label>
                  <input
                    type="text"
                    value={lastTopic}
                    onChange={(e) => setLastTopic(e.target.value)}
                    placeholder="Örn: Türev ve Teğet Denklemi (veya Trigonometrik Denklemler)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Gelecek Derste Yapılacaklar (Action Items) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-indigo-300">
                      📌 Gelecek Derste Yapılacaklar / Hatırlatma Maddeleri:
                    </label>
                    <span className="text-[10px] text-slate-400">{nextLessonActions.length} Eylem</span>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {nextLessonActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 animate-in fade-in duration-150"
                      >
                        <span className="flex items-center gap-2 min-w-0 truncate">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          <span className="truncate font-medium">{action}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveActionItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Hızlı Eylem Çipleri */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      '📋 Ödev kontrolü yapılacak',
                      '🎯 Kaldığımız yerden soru çözümüne devam',
                      '🌟 Kazanım testi uygulanacak',
                      '👥 Grup etkinliği tamamlanacak',
                    ].map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (!nextLessonActions.includes(act)) {
                            setNextLessonActions((prev) => [...prev, act]);
                          }
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        + {act}
                      </button>
                    ))}
                  </div>

                  {/* Yeni Aksiyon Ekle Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newActionInput}
                      onChange={(e) => setNewActionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddActionItem();
                        }
                      }}
                      placeholder="Yeni yapılacak madde yazın ve Enter'a basın..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddActionItem}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ekle
                    </button>
                  </div>
                </div>

                {/* Sınıf İklimi & Öğretmen Gözlemi (Opsiyonel) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    💬 Sınıf İklimi / Öğretmen Gözlemi (Opsiyonel):
                  </label>
                  <input
                    type="text"
                    value={classAtmosphereNote}
                    onChange={(e) => setClassAtmosphereNote(e.target.value)}
                    placeholder="Örn: Sınıfın katılımı ve ilgisi yüksekti, soru çözümüne aktif katıldılar."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. BÖLÜM: SESLİ / SERBEST METİN NOT GİRİŞİ & YAPAY ZEKA AYRIŞTIRICI (İsteğe Bağlı Hızlı Asistan) */}
          <div className="bg-slate-950/50 border border-indigo-500/20 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                İsteğe Bağlı: Sesle Konuşun veya Serbest Not Yazın
              </label>

              {/* Mikrofon Butonu */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400/50'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40'
                }`}
                title={speechSupported ? 'Mikrofonla konuşarak serbest not al' : 'Tarayıcı ses desteği yok'}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Durdur</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Mikrofonla Söyle</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={2}
                placeholder="Örn: 'MEB kitabında sayfa 48 soru 3te kaldık, haftaya ödevleri kontrol edelim. Sınıfın motivasyonu iyiydi.'"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none font-medium"
              />
              {isRecording && (
                <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-500/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Ses Dinleniyor...
                </div>
              )}
            </div>

            {/* AI Ayrıştırma Butonu */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={isAiProcessing || !rawText.trim()}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Gemini AI Alanlara Dağıtıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>🤖 Yapay Zekayla Ayrıştır & Alanları Doldur</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. BÖLÜM: HIZLI İFADELER VE ŞABLONLAR (Gizli Başlar, Butonla Açılır) */}
          <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
            {/* Hızlı İfadeler Akordiyon Başlığı */}
            <button
              type="button"
              onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">
                  ⚡ Hızlı İfadeler & Not Şablonları ({templatesList.length})
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Tıkla ve Özelleştir)
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px] font-semibold">{showTemplatesPanel ? 'Gizle' : 'Göster'}</span>
                {showTemplatesPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Açılır / Özelleştirilebilir Panel */}
            {showTemplatesPanel && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Notunuza eklemek için ifadeye tıklayın. Kalem ile düzenleyebilir veya kendi ifadelerinizi ekleyebilirsiniz:
                  </p>
                  {!isAddingNewTemplate && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewTemplate(true)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Yeni İfade Ekle
                    </button>
                  )}
                </div>

                {/* Yeni İfade Ekleme Formu */}
                {isAddingNewTemplate && (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-indigo-500/40 rounded-xl">
                    <input
                      type="text"
                      value={newTemplateInput}
                      onChange={(e) => setNewTemplateInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewTemplate();
                        }
                      }}
                      placeholder="Yeni hızlı ifade yazın (Örn: Kazanım 3.2 pekiştirilecek)..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewTemplate}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewTemplate(false)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Şablon Listesi */}
                <div className="flex flex-wrap gap-2">
                  {templatesList.map((tpl, idx) => {
                    const isEditing = editingTemplateIdx === idx;
                    if (isEditing) {
                      return (
                        <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-amber-500/50 p-1 rounded-xl">
                          <input
                            type="text"
                            value={editingTemplateText}
                            onChange={(e) => setEditingTemplateText(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedTemplate(idx)}
                            className="text-emerald-400 p-1 hover:bg-slate-800 rounded"
                            title="Kaydet"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTemplateIdx(null)}
                            className="text-slate-400 p-1 hover:bg-slate-800 rounded"
                            title="İptal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="group flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="hover:text-indigo-200 text-left font-medium cursor-pointer"
                          title="Nota / Eylemlere ekle"
                        >
                          {tpl}
                        </button>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 ml-1 border-l border-slate-700/60 pl-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplateIdx(idx);
                              setEditingTemplateText(tpl);
                            }}
                            className="text-slate-400 hover:text-amber-300 p-0.5 rounded cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(idx)}
                            className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Action Buttons */}
        <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            İptal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ders Seyir Notunu Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
