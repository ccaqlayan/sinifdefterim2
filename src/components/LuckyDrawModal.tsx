import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Student, ClassRoom, LuckyDrawSettings } from '../types';
import { 
  Sparkles, X, Volume2, VolumeX, RotateCcw, Award, Check, Users, Dices, 
  Settings, Square, Play, UserMinus, Clock, ShieldCheck, ChevronRight,
  Maximize2, Volume1, Eye, CheckCircle2, PanelRightClose, PanelRightOpen,
  PanelRight, History, Sliders, Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playWheelTickSound, playVictoryFanfare, playScoreSound, initAudio } from '../utils/audio';

interface LuckyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  students: Student[];
  onAddPlusPoint?: (studentId: string) => void;
  savedSettings?: LuckyDrawSettings;
  onUpdateSettings?: (settings: LuckyDrawSettings) => void;
}

// 16 carefully curated high-contrast vibrant colors with optimal contrast for dark and light text
const SLICE_COLORS = [
  { bg: '#4F46E5', text: '#FFFFFF' }, // Indigo
  { bg: '#059669', text: '#FFFFFF' }, // Emerald
  { bg: '#D97706', text: '#FFFFFF' }, // Amber
  { bg: '#E11D48', text: '#FFFFFF' }, // Rose
  { bg: '#7C3AED', text: '#FFFFFF' }, // Violet
  { bg: '#0284C7', text: '#FFFFFF' }, // Sky
  { bg: '#D946EF', text: '#FFFFFF' }, // Fuchsia
  { bg: '#0D9488', text: '#FFFFFF' }, // Teal
  { bg: '#EA580C', text: '#FFFFFF' }, // Orange
  { bg: '#4338CA', text: '#FFFFFF' }, // Dark Indigo
  { bg: '#15803D', text: '#FFFFFF' }, // Dark Green
  { bg: '#BE123C', text: '#FFFFFF' }, // Crimson
  { bg: '#6D28D9', text: '#FFFFFF' }, // Deep Purple
  { bg: '#0891B2', text: '#FFFFFF' }, // Cyan
  { bg: '#C026D3', text: '#FFFFFF' }, // Pink/Magenta
  { bg: '#65A30D', text: '#FFFFFF' }, // Lime
];

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  students,
  onAddPlusPoint,
  savedSettings,
  onUpdateSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Eligible students in class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  // States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<{ student: Student; time: string }[]>([]);
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings with teacher profile persistence
  const [soundEnabled, setSoundEnabled] = useState(savedSettings?.soundEnabled ?? true);
  const [autoExcludeWinner, setAutoExcludeWinner] = useState(savedSettings?.autoExcludeWinner ?? false);
  const [spinDurationSeconds, setSpinDurationSeconds] = useState<number>(savedSettings?.spinDurationSeconds ?? 5); // 3, 5, 8, 12
  const [nameFormat, setNameFormat] = useState<'full' | 'short'>(savedSettings?.nameFormat ?? 'full');
  const [showStudentNumber, setShowStudentNumber] = useState(savedSettings?.showStudentNumber ?? true);

  // Sync settings when savedSettings prop changes
  useEffect(() => {
    if (savedSettings) {
      setSoundEnabled(savedSettings.soundEnabled);
      setAutoExcludeWinner(savedSettings.autoExcludeWinner);
      setSpinDurationSeconds(savedSettings.spinDurationSeconds);
      setNameFormat(savedSettings.nameFormat);
      setShowStudentNumber(savedSettings.showStudentNumber);
    }
  }, [savedSettings]);

  // Helper to persist changed settings to teacher profile in Firestore
  const updateAndSaveSetting = (newPartial: Partial<LuckyDrawSettings>) => {
    const nextSettings: LuckyDrawSettings = {
      soundEnabled: newPartial.soundEnabled !== undefined ? newPartial.soundEnabled : soundEnabled,
      autoExcludeWinner: newPartial.autoExcludeWinner !== undefined ? newPartial.autoExcludeWinner : autoExcludeWinner,
      spinDurationSeconds: newPartial.spinDurationSeconds !== undefined ? newPartial.spinDurationSeconds : spinDurationSeconds,
      nameFormat: newPartial.nameFormat !== undefined ? newPartial.nameFormat : nameFormat,
      showStudentNumber: newPartial.showStudentNumber !== undefined ? newPartial.showStudentNumber : showStudentNumber,
    };

    if (newPartial.soundEnabled !== undefined) setSoundEnabled(newPartial.soundEnabled);
    if (newPartial.autoExcludeWinner !== undefined) setAutoExcludeWinner(newPartial.autoExcludeWinner);
    if (newPartial.spinDurationSeconds !== undefined) setSpinDurationSeconds(newPartial.spinDurationSeconds);
    if (newPartial.nameFormat !== undefined) setNameFormat(newPartial.nameFormat);
    if (newPartial.showStudentNumber !== undefined) setShowStudentNumber(newPartial.showStudentNumber);

    if (onUpdateSettings) {
      onUpdateSettings(nextSettings);
    }
  };

  // Active pool of students on the wheel
  const activeStudents = useMemo(() => {
    return classStudents.filter((s) => !excludedStudentIds.includes(s.id));
  }, [classStudents, excludedStudentIds]);

  // Animation State
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [hasAwardedPlus, setHasAwardedPlus] = useState(false);

  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickIndexRef = useRef<number>(-1);
  const wheelDimensionsRef = useRef<{ size: number; dpr: number }>({ size: 400, dpr: 1 });

  // Reset winner state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowWinnerModal(false);
      setWinner(null);
      setHasAwardedPlus(false);
    } else {
      // Clean up any ongoing spin if modal closes
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsSpinning(false);
    }
  }, [isOpen]);

  // Fire confetti celebration effect
  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#38BDF8'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
      });
    }, 400);
  };

  // Helper helper to brighten or darken hex color
  const adjustColorBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };

  // Render the high-resolution canvas wheel at exact angle
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { size, dpr } = wheelDimensionsRef.current;
    if (size <= 0) return;

    const width = size;
    const height = size;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.max(centerX - 24, 60);
    const innerRadius = Math.max(outerRadius * 0.18, 30);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const totalSlices = activeStudents.length;

    if (totalSlices === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Çarkta Öğrenci Kalmadı', centerX, centerY - 14);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Öğrenci Seç veya Ayarlardan Sıfırla', centerX, centerY + 14);
      ctx.restore();
      return;
    }

    const sliceAngle = (2 * Math.PI) / totalSlices;

    // 1. Draw Outer Heavy Bezel / Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 12, 0, 2 * Math.PI);
    const rimGradient = ctx.createLinearGradient(0, 0, width, height);
    rimGradient.addColorStop(0, '#1E293B');
    rimGradient.addColorStop(0.5, '#334155');
    rimGradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = rimGradient;
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = Math.max(3, outerRadius * 0.015);
    ctx.stroke();

    // 2. Draw Glowing LED Bulbs around perimeter
    const numLeds = Math.min(36, Math.max(16, Math.floor(outerRadius / 8)));
    for (let i = 0; i < numLeds; i++) {
      const ledAngle = (i * 2 * Math.PI) / numLeds;
      const ledX = centerX + (outerRadius + 6) * Math.cos(ledAngle);
      const ledY = centerY + (outerRadius + 6) * Math.sin(ledAngle);
      const isLit = (Math.floor(angle * 6) + i) % 2 === 0;

      ctx.beginPath();
      ctx.arc(ledX, ledY, Math.max(3, outerRadius * 0.012), 0, 2 * Math.PI);
      ctx.fillStyle = isLit ? '#FEF08A' : '#475569';
      if (isLit) {
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. Draw Slices with Rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    activeStudents.forEach((student, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const colorScheme = SLICE_COLORS[index % SLICE_COLORS.length];

      // Slice Path
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerRadius, startAngle, endAngle);
      ctx.closePath();

      // Radial gradient for slice richness
      const sliceGradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
      sliceGradient.addColorStop(0, colorScheme.bg);
      sliceGradient.addColorStop(1, adjustColorBrightness(colorScheme.bg, -18));
      ctx.fillStyle = sliceGradient;
      ctx.fill();

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = Math.max(1.5, outerRadius * 0.006);
      ctx.stroke();

      // Slice Text
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorScheme.text;

      // Font calculations tailored for large tablets and landscape mode
      const baseFontSize = Math.max(11, Math.min(22, Math.floor(outerRadius / 16)));
      let fontSize = baseFontSize;
      if (totalSlices > 32) fontSize = Math.max(9, baseFontSize - 4);
      else if (totalSlices > 22) fontSize = Math.max(11, baseFontSize - 2);
      else if (totalSlices < 10) fontSize = Math.min(24, baseFontSize + 3);

      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Text Shadow for contrast
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Format Student Name
      let displayName = '';
      if (nameFormat === 'short') {
        displayName = student.name;
      } else {
        displayName = `${student.name} ${student.surname}`;
      }
      if (showStudentNumber && student.number) {
        displayName = `${student.number}. ${displayName}`;
      }

      // Max chars allowed before truncation
      const maxChars = Math.floor((outerRadius - innerRadius - 20) / (fontSize * 0.58));
      if (displayName.length > maxChars) {
        displayName = displayName.substring(0, maxChars - 1) + '…';
      }

      const textDistance = outerRadius - 16;
      ctx.fillText(displayName, textDistance, 0);

      ctx.restore();
    });

    ctx.restore(); // Restore wheel rotation

    // 4. Draw Center Metallic Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    const hubGradient = ctx.createRadialGradient(centerX - 4, centerY - 4, 2, centerX, centerY, innerRadius);
    hubGradient.addColorStop(0, '#FFFFFF');
    hubGradient.addColorStop(0.3, '#E2E8F0');
    hubGradient.addColorStop(0.7, '#64748B');
    hubGradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = hubGradient;
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = Math.max(2.5, innerRadius * 0.08);
    ctx.stroke();

    // Center Hub Text / Badge - write class name (e.g. 9/A, 11-B, etc.)
    const classNameText = currentClass.name || 'Sınıf';
    const hubTextLen = classNameText.length;
    let hubFontSize = Math.max(10, Math.floor(innerRadius * 0.34));
    if (hubTextLen > 8) {
      hubFontSize = Math.max(9, Math.floor(innerRadius * 0.23));
    } else if (hubTextLen > 5) {
      hubFontSize = Math.max(10, Math.floor(innerRadius * 0.28));
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = `900 ${hubFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(classNameText, centerX, centerY);
    ctx.shadowBlur = 0;

    // 5. Draw Pointer Arrow at 12 o'clock (pointing down)
    ctx.save();
    const pointerWidth = Math.max(24, outerRadius * 0.1);
    const pointerHeight = Math.max(30, outerRadius * 0.13);
    const pointerY = centerY - outerRadius - 2;

    ctx.translate(centerX, pointerY);

    ctx.beginPath();
    ctx.moveTo(-pointerWidth / 2, -pointerHeight + 6);
    ctx.lineTo(pointerWidth / 2, -pointerHeight + 6);
    ctx.lineTo(0, 10);
    ctx.closePath();

    const pointerGradient = ctx.createLinearGradient(0, -pointerHeight, 0, 10);
    pointerGradient.addColorStop(0, '#EF4444');
    pointerGradient.addColorStop(1, '#991B1B');
    ctx.fillStyle = pointerGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Central accent dot on pointer
    ctx.beginPath();
    ctx.arc(0, -pointerHeight / 2 + 2, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }, [activeStudents, nameFormat, showStudentNumber, currentClass.name]);

  // Robust container measurement - strictly prevents shrinking/jitter
  const updateDimensionsAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Compute maximum square size that fits comfortably in the container
    const availableWidth = rect.width - 24;
    const availableHeight = rect.height - 24;
    // Cap minimum 260px, maximum 720px for crystal-clear smartboard / tablet viewing
    const size = Math.floor(Math.min(availableWidth, availableHeight, 720));
    if (size <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // high-DPI support
    wheelDimensionsRef.current = { size, dpr };

    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // Resize listener
  useEffect(() => {
    if (!isOpen) return;

    // Immediate calculation
    updateDimensionsAndDraw();

    // Also observe container size changes cleanly
    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateDimensionsAndDraw();
      });
      observer.observe(containerRef.current);
    }

    const handleResize = () => updateDimensionsAndDraw();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [isOpen, updateDimensionsAndDraw]);

  // Cancel / Stop active spin
  const cancelSpin = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsSpinning(false);
    lastTickIndexRef.current = -1;
    drawWheel(currentAngleRef.current);
  };

  // Main Spin Animation Engine
  const spinTheWheel = () => {
    if (activeStudents.length === 0) return;

    // Unlock/resume AudioContext on direct user gesture
    initAudio();

    // If already spinning, user clicking again STOPS and cancels the spin
    if (isSpinning) {
      cancelSpin();
      return;
    }

    setIsSpinning(true);
    setShowWinnerModal(false);
    setWinner(null);
    setHasAwardedPlus(false);

    // Pick random winner from active pool
    const totalSlices = activeStudents.length;
    const winnerIndex = Math.floor(Math.random() * totalSlices);
    const winningStudent = activeStudents[winnerIndex];

    const sliceAngle = (2 * Math.PI) / totalSlices;
    // Pointer is at 12 o'clock (270 deg / 3*PI/2)
    const pointerAngle = (3 * Math.PI) / 2;
    const sliceCenterAngle = winnerIndex * sliceAngle + sliceAngle / 2;

    // Calculate desired normalized angle
    const desiredNormalizedAngle = (pointerAngle - sliceCenterAngle + 20 * Math.PI) % (2 * Math.PI);

    // Dynamic full rotations based on chosen duration
    const baseSpins = spinDurationSeconds <= 3 ? 4 : spinDurationSeconds <= 5 ? 6 : spinDurationSeconds <= 8 ? 9 : 13;
    const fullSpins = (baseSpins + Math.floor(Math.random() * 2)) * 2 * Math.PI;

    const currentNormalized = (currentAngleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let deltaAngle = desiredNormalizedAngle - currentNormalized;
    if (deltaAngle < 0) deltaAngle += 2 * Math.PI;

    const startAngle = currentAngleRef.current;
    const targetAngle = startAngle + fullSpins + deltaAngle;
    const duration = spinDurationSeconds * 1000 + (Math.random() * 400 - 200);
    const startTime = performance.now();

    lastTickIndexRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Decelerating cubic-bezier curve (easeOutCubic / quartic)
      const easeOut = 1 - Math.pow(1 - progress, 3.6);
      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
      currentAngleRef.current = currentAngle;

      // Audio tick when slice crosses the pointer
      const currentNorm = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const activePointerSlice = Math.floor(
        ((pointerAngle - currentNorm + 20 * Math.PI) % (2 * Math.PI)) / sliceAngle
      );

      if (activePointerSlice !== lastTickIndexRef.current) {
        lastTickIndexRef.current = activePointerSlice;
        if (soundEnabled) {
          playWheelTickSound(0.08 + (1 - progress) * 0.08);
        }
      }

      // Draw updated angle without touching layout/canvas size
      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        setWinner(winningStudent);
        setShowWinnerModal(true);

        if (soundEnabled) {
          playVictoryFanfare();
        }
        triggerConfetti();

        // Record history
        setHistoryList((prev) => [
          { student: winningStudent, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev,
        ]);

        // Auto exclude if option is enabled
        if (autoExcludeWinner) {
          setExcludedStudentIds((prev) => [...prev, winningStudent.id]);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Toggle individual student in wheel
  const toggleStudent = (studentId: string) => {
    setExcludedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllStudents = () => setExcludedStudentIds([]);
  const unselectAllStudents = () => setExcludedStudentIds(classStudents.map((s) => s.id));

  // Plus point handler
  const handleAwardPlusPoint = () => {
    if (!winner || hasAwardedPlus) return;
    if (onAddPlusPoint) {
      onAddPlusPoint(winner.id);
      playScoreSound('plus');
      setHasAwardedPlus(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col text-white select-none animate-in fade-in duration-150 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Dices className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Şans Çarkı / Kura Çek
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {currentClass.name} • <strong className="text-indigo-300 font-extrabold">{activeStudents.length}</strong> / {classStudents.length} Öğrenci Çarkta
            </p>
          </div>
        </div>

        {/* Right Header Action Tools */}
        <div className="flex items-center gap-2">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              setTimeout(updateDimensionsAndDraw, 100);
            }}
            className={`px-3 py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
              isSidebarOpen
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/50'
            }`}
            title={isSidebarOpen ? 'Yan Paneli Gizle' : 'Yan Paneli Göster (Durum & Geçmiş)'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4 text-slate-400" /> : <PanelRightOpen className="w-4 h-4 text-indigo-400" />}
            <span className="hidden sm:inline">{isSidebarOpen ? 'Paneli Gizle' : 'Paneli Aç'}</span>
          </button>

          {/* Student Selection Trigger */}
          <button
            onClick={() => setShowStudentListModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Çarka Dahil Edilecek Öğrencileri Seç"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Öğrenci Listesi</span>
            <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
              {activeStudents.length}
            </span>
          </button>

          {/* Quick Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/50'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Sesleri Kapat' : 'Sesleri Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Modal Trigger (Gear Icon) */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-2xs"
            title="Çark Ayarları"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>

          {/* Close / Exit Fullscreen */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/50 transition-all"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left/Center Stage: Maximized Wheel Canvas */}
        <main
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative"
        >
          <div className="relative flex items-center justify-center flex-1 w-full h-full">
            <canvas
              ref={canvasRef}
              onClick={spinTheWheel}
              className={`rounded-full transition-shadow duration-300 ${
                activeStudents.length > 0
                  ? isSpinning
                    ? 'cursor-pointer shadow-2xl shadow-purple-500/20'
                    : 'cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/30'
                  : ''
              }`}
            />
          </div>

          {/* Floating Bottom Control Bar when Sidebar is Closed */}
          {!isSidebarOpen && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-2 sm:p-2.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
              <button
                onClick={spinTheWheel}
                disabled={activeStudents.length === 0}
                className={`py-3 px-6 sm:px-8 rounded-xl font-black text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isSpinning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : activeStudents.length === 0
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-linear-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSpinning ? (
                  <>
                    <Square className="w-4 h-4 fill-current text-white animate-pulse" />
                    Durdur
                  </>
                ) : activeStudents.length === 0 ? (
                  'Öğrenci Kalmadı'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Çarkı Çevir!
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setTimeout(updateDimensionsAndDraw, 100);
                }}
                className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Paneli Aç (Son Kazananlar & Durum)"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Durum & Geçmiş</span>
                {historyList.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                    {historyList.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </main>

        {/* Right / Bottom Control Dock: Collapsible Sidebar */}
        {isSidebarOpen && (
          <aside className="w-full md:w-84 lg:w-96 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800/90 p-4 sm:p-5 flex flex-col justify-between gap-4 shrink-0 backdrop-blur-md animate-in slide-in-from-right-4 duration-200">
            {/* Upper Info / Status Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PanelRight className="w-4 h-4 text-indigo-400" />
                  Panel Bilgisi
                </span>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setTimeout(updateDimensionsAndDraw, 100);
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1 px-2 transition-all"
                  title="Paneli Kapat"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Kapat</span>
                </button>
              </div>

              <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-300">Aktif Çark Durumu</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-700 text-indigo-300 font-black text-[11px]">
                    {spinDurationSeconds} sn
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/50">
                  <span>Çarkta Kalan:</span>
                  <span className="font-black text-white">{activeStudents.length} Öğrenci</span>
                </div>
                {excludedStudentIds.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-400">
                    <span>Çıkarılanlar:</span>
                    <button
                      onClick={selectAllStudents}
                      className="font-bold underline hover:text-amber-300 text-[11px]"
                    >
                      {excludedStudentIds.length} kişiyi geri al
                    </button>
                  </div>
                )}
              </div>

              {/* Recent History List */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  Son Kurada Çıkanlar
                </span>
                {historyList.length === 0 ? (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    Henüz kura çekilmedi
                  </div>
                ) : (
                  <div className="max-h-36 sm:max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {historyList.map((h, i) => (
                      <div
                        key={i}
                        className="p-2 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs animate-in fade-in"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-indigo-600/50 text-indigo-200 text-[10px] font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-bold text-slate-200 truncate">
                            {h.student.number ? `${h.student.number}. ` : ''}
                            {h.student.name} {h.student.surname}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                          {h.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Button Bar */}
            <div className="space-y-2 pt-2">
              <button
                onClick={spinTheWheel}
                disabled={activeStudents.length === 0}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl flex items-center justify-center gap-2.5 ${
                  isSpinning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.98]'
                    : activeStudents.length === 0
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-linear-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSpinning ? (
                  <>
                    <Square className="w-5 h-5 fill-current text-white animate-pulse" />
                    Durdur / İptal Et
                  </>
                ) : activeStudents.length === 0 ? (
                  'Öğrenci Kalmadı'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    Çarkı Çevir!
                  </>
                )}
              </button>

              {/* Quick Helper Subtext */}
              <p className="text-[11px] text-center text-slate-500">
                {isSpinning ? 'Durdurmak için butona veya çarka tıklayın' : 'Çarka tıklayarak da çevirebilirsiniz'}
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Settings Modal (Ayarlar Penceresi) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">Çark ve Kura Ayarları</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile sync confirmation indicator */}
            <div className="p-3 bg-indigo-950/60 border border-indigo-700/50 rounded-2xl flex items-center gap-2.5 text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-white">Öğretmen Profiline Bağlı:</span> Yaptığınız tüm ayarlar anında profilinize kaydedilir ve sonraki girişlerinizde korunur.
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Spin Duration Selector */}
              <div>
                <label className="font-extrabold text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Çark Dönüş Süresi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 3, label: '3 sn (Hızlı)' },
                    { sec: 5, label: '5 sn (Standart)' },
                    { sec: 8, label: '8 sn (Heyecan)' },
                    { sec: 12, label: '12 sn (Uzun)' },
                  ].map((opt) => (
                    <button
                      key={opt.sec}
                      type="button"
                      onClick={() => updateAndSaveSetting({ spinDurationSeconds: opt.sec })}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                        spinDurationSeconds === opt.sec
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-black">{opt.sec}s</div>
                      <div className="text-[10px] opacity-75">{opt.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Exclude Toggle */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">Seçileni Otomatik Çıkar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Kurada çıkan öğrenci bir sonraki turlarda çarkta yer almaz.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoExcludeWinner}
                    onChange={(e) => updateAndSaveSetting({ autoExcludeWinner: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Sound Effects Toggle */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">Ses Efektleri</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Çark dönüş tık sesleri ve kazanan fanfar melodisi.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => updateAndSaveSetting({ soundEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Name Display Format */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">İsim Formatı</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Çark üzerindeki isim uzunluğu</div>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => updateAndSaveSetting({ nameFormat: 'full' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      nameFormat === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ad Soyad
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAndSaveSetting({ nameFormat: 'short' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      nameFormat === 'short' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sadece Ad
                  </button>
                </div>
              </div>

              {/* Show Student Number Toggle */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">Öğrenci Numarasını Göster</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Çark dilimlerinde öğrenci okul numarasını ismin başında gösterir.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showStudentNumber}
                    onChange={(e) => updateAndSaveSetting({ showStudentNumber: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Reset Excluded Pool */}
              {excludedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    selectAllStudents();
                    setShowSettingsModal(false);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Çıkarılan Tüm Öğrencileri Çarka Geri Ekle ({excludedStudentIds.length})
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Kaydet ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student List Filter Modal */}
      {showStudentListModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-white">Çarka Dahil Edilecek Öğrenciler</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  İstemediğiniz öğrencileri listeden çıkarabilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setShowStudentListModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select/Unselect All */}
            <div className="flex items-center justify-between shrink-0 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-xs font-bold text-slate-300">
                Seçili: <strong className="text-indigo-300">{activeStudents.length}</strong> / {classStudents.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllStudents}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={unselectAllStudents}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  Tümünü Kaldır
                </button>
              </div>
            </div>

            {/* Students Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {classStudents.map((std) => {
                const isIncluded = !excludedStudentIds.includes(std.id);
                return (
                  <button
                    key={std.id}
                    onClick={() => toggleStudent(std.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between gap-1.5 ${
                      isIncluded
                        ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-2xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500 line-through opacity-50'
                    }`}
                  >
                    <span className="truncate">
                      {std.number ? `${std.number}. ` : ''}
                      {std.name} {std.surname}
                    </span>
                    {isIncluded ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 shrink-0">
              <button
                onClick={() => setShowStudentListModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg"
              >
                Tamamla ({activeStudents.length} Öğrenci)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Celebration Modal Overlay */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl text-center space-y-4 relative overflow-hidden ring-4 ring-amber-400/25">
            {/* Confetti Glow Header */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider animate-bounce shadow-lg shadow-amber-500/10">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Kura Sonucu
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>

              {/* Winner Photo & Avatar */}
              <div className="w-28 h-28 mx-auto rounded-full bg-linear-to-tr from-amber-400 via-fuchsia-500 to-indigo-600 p-1.5 shadow-2xl shadow-amber-500/25 ring-4 ring-amber-400/30">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center font-black text-3xl text-amber-300">
                  {winner.photoUrl ? (
                    <img src={winner.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    winner.number || winner.name[0]
                  )}
                </div>
              </div>

              {/* Winner Details */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {winner.name} {winner.surname}
                </h3>
                {winner.number && (
                  <p className="text-sm text-amber-300 font-extrabold mt-1">
                    Okul No: {winner.number}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1 font-medium">{currentClass.name}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-2.5">
                {onAddPlusPoint && (
                  <button
                    onClick={handleAwardPlusPoint}
                    disabled={hasAwardedPlus}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                      hasAwardedPlus
                        ? 'bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Award className="w-4 h-4 text-emerald-200" />
                    {hasAwardedPlus ? 'Artı Puan Verildi (+1)' : 'Öğrenciye +1 Artı Puan Ver'}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setShowWinnerModal(false);
                      spinTheWheel();
                    }}
                    className="py-3 px-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tekrar Çevir
                  </button>

                  <button
                    onClick={() => {
                      setShowWinnerModal(false);
                      if (!excludedStudentIds.includes(winner.id)) {
                        setExcludedStudentIds((prev) => [...prev, winner.id]);
                      }
                    }}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <UserMinus className="w-4 h-4 text-amber-400" />
                    Çıkar & Devam
                  </button>
                </div>

                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
