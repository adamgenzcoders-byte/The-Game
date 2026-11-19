'use client';

// ========================================================
// app/play/page.jsx - Player Home (Active Competition)
// ========================================================

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PlayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [multiAnswer, setMultiAnswer] = useState({ ans1: '', ans2: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  // Game Countdown Clock (From Admin Configured Duration)
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState(null);

  // Announcement Pop-up State
  const [dismissedAnnouncementAt, setDismissedAnnouncementAt] = useState(null);
  const lastAlertAtRef = useRef(null);

  // Modals & Popups
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [manualQrToken, setManualQrToken] = useState('');
  const [qrResolving, setQrResolving] = useState(false);
  const [qrResult, setQrResult] = useState(null);

  const [hintLoading, setHintLoading] = useState(false);
  const audioCtxRef = useRef(null);

  const playAlertSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      [659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch (e) {}
  };

  const playFeedbackSound = (isCorrect) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (isCorrect) {
        // Success Chime: C5 -> E5 -> G5 -> C6
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.4);
        });
      } else {
        // Low Tension Buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  // Polling active level
  useEffect(() => {
    async function fetchCurrentLevel() {
      const token = localStorage.getItem('device_token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch('/api/game/current', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          router.replace('/');
          return;
        }

        const data = await res.json();

        // Check if not running (Lock it!)
        if (data.gameState && data.gameState !== 'RUNNING') {
          router.replace('/lobby');
          return;
        }

        // Calculate remaining event time
        if (data.endAtEpoch) {
          const diff = Math.max(0, Math.floor((data.endAtEpoch - Date.now()) / 1000));
          setRemainingTimeSeconds(diff);
        }

        // Check incoming live announcements
        if (data.announcement && data.announcement.text) {
          const targetEra = data.announcement.eraId;
          const isTargeted = !targetEra || targetEra === data.team?.eraId;
          if (isTargeted && data.announcement.at && lastAlertAtRef.current !== data.announcement.at) {
            lastAlertAtRef.current = data.announcement.at;
            playAlertSound();
          }
        }

        setLevelData(data);
      } catch (err) {
        console.error('Error fetching game state:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentLevel();
    const interval = setInterval(fetchCurrentLevel, 3000);
    return () => clearInterval(interval);
  }, [router]);

  // Global game timer tick
  useEffect(() => {
    if (remainingTimeSeconds === null || remainingTimeSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingTimeSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTimeSeconds]);

  function formatDuration(totalSeconds) {
    if (totalSeconds === null || totalSeconds <= 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleSubmitAnswer(e) {
    if (e) e.preventDefault();
    if (submitting) return;

    const token = localStorage.getItem('device_token');
    const isMulti = levelData?.level?.questions && Array.isArray(levelData.level.questions);

    let payloadAnswer = null;
    if (isMulti) {
      if (!multiAnswer.ans1.trim() || !multiAnswer.ans2.trim()) {
        setFeedback({ type: 'error', message: 'يرجى الإجابة على السؤالين معاً' });
        return;
      }
      payloadAnswer = multiAnswer;
    } else {
      if (!answer.trim()) {
        setFeedback({ type: 'error', message: 'يرجى كتابة الإجابة أو الرمز' });
        return;
      }
      payloadAnswer = answer.trim();
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer: payloadAnswer }),
      });

      const data = await res.json();

      if (data.correct) {
        playFeedbackSound(true);
        setFeedback({ type: 'success', message: data.message || 'إجابة صحيحة! أحسنتم يا أبطال 🚀' });
        setAnswer('');
        setMultiAnswer({ ans1: '', ans2: '' });

        // Refresh state
        setTimeout(async () => {
          const freshRes = await fetch('/api/game/current', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const freshData = await freshRes.json();
          setLevelData(freshData);
          setFeedback(null);
        }, 1000);
      } else {
        playFeedbackSound(false);
        setFeedback({ type: 'error', message: data.message || 'إجابة غير صحيحة، حاول مجدداً مع فريقك' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'تعذر التحقق من الإجابة، تفقد الشبكة' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlockHint(hintNumber) {
    const token = localStorage.getItem('device_token');
    setHintLoading(true);

    try {
      const res = await fetch('/api/game/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hintNumber }),
      });

      const data = await res.json();
      if (data.success) {
        setLevelData((prev) => ({
          ...prev,
          team: {
            ...prev.team,
            points: data.points !== undefined ? data.points : prev.team.points,
          },
          hints: {
            ...prev.hints,
            [hintNumber]: {
              ...prev.hints[hintNumber],
              unlocked: true,
              text: data.text,
            },
          },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  }

  async function handleResolveQr(tokenValue) {
    if (!tokenValue.trim()) return;
    setQrResolving(true);
    setQrResult(null);
    const token = localStorage.getItem('device_token');

    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(tokenValue.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setQrResult({ error: data.message || 'رمز QR غير معروف' });
      } else {
        setQrResult(data);
        if (data.matchesCurrentLevel && data.revealedContent) {
          // Pre-fill answer box
          setAnswer(data.revealedContent);
        }
      }
    } catch (err) {
      setQrResult({ error: 'حدث خطأ في قراءة الرمز' });
    } finally {
      setQrResolving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  // ERA FINISHED SCREEN
  if (levelData?.finished) {
    return (
      <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200">
        <header className="flex justify-between items-center py-2 border-b border-slate-900">
          <Link
            href="/progress"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            تقدم الفريق
          </Link>
          <Link
            href="/levels"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            المستويات
          </Link>
        </header>

        <section className="my-auto py-8 text-center space-y-4">
          <div className="text-5xl">🏆</div>
          <h1 className="text-2xl font-black text-amber-400">
            أتممتم جميع مستويات {levelData.eraName}!
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            لقد تم فك رموز العصر وكشف الحقيقة التاريخية بنجاح.
          </p>

          {levelData.isStoryteller ? (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/50 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                ⭐ أنتم رواة العصر على المسرح! ⭐
              </span>
              <p className="text-xs text-slate-300">
                فريقكم كان الأول في إتمام العصر. استعدوا للصعود إلى المسرح وإلقاء النص الرسمي لكسر اللعنة.
              </p>
              <Link
                href="/storyteller"
                className="inline-block w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition"
              >
                افتح نص الراوي للإلقاء على المسرح
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">
                توجهوا إلى المسرح الكبير لحضور فقرة كسر اللعنة مع رواة العصور.
              </p>
            </div>
          )}
        </section>

        <footer className="py-2 text-center text-xs text-slate-500">
          مدرسة السويدي الدولية • لغز مصر عبر الحضارات
        </footer>
      </main>
    );
  }

  const eraColor = levelData?.team?.eraColor || '#d4af37';
  const level = levelData?.level;
  const hints = levelData?.hints || {};
  const isMulti = level?.questions && Array.isArray(level.questions);
  const currentLvl = level?.levelNumber || 1;
  const points = levelData?.team?.points !== undefined ? levelData.team.points : 100;
  const teamNumber = levelData?.team?.teamNumber || 1;

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200 relative">
      {/* GAME MASTER ANNOUNCEMENT POP-UP MODAL */}
      {levelData?.announcement && levelData.announcement.text && levelData.announcement.at !== dismissedAnnouncementAt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#121620] border-2 border-amber-500 shadow-2xl shadow-amber-500/20 text-center space-y-4">
            <div className="text-5xl animate-bounce">📢</div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 text-xs font-black tracking-wider">
              تنبيه عاجل من الجيم ماستر
            </div>
            <h3 className="text-base font-black text-slate-100 leading-snug">
              {levelData.announcement.eraId ? `إعلان خاص بالمسار التاريخي` : `إعلان عام لجميع الفرق`}
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200 leading-relaxed text-right max-h-48 overflow-y-auto">
              {levelData.announcement.text}
            </div>
            <button
              type="button"
              onClick={() => setDismissedAnnouncementAt(levelData.announcement.at)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition shadow-md shadow-amber-600/30"
            >
              فهمت الرسالة (إغلاق) ✓
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP RACING HEADER */}
      <header className="flex items-center justify-between py-2 border-b border-slate-900 gap-2">
        <div className="flex gap-1.5">
          <Link
            href="/progress"
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:border-amber-600 active:scale-95 transition"
          >
            📊 الترتيب
          </Link>
          <Link
            href="/levels"
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:border-amber-600 active:scale-95 transition"
          >
            🗺️ الخريطة
          </Link>
        </div>

        {/* Team Number & Points Badge */}
        <div className="flex items-center gap-1.5">
          <div className="px-2.5 py-1 rounded-lg bg-[#121620] border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1">
            <span>{levelData?.team?.icon}</span>
            <span className="text-amber-400 font-mono">#{teamNumber}</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-600/60 text-xs font-black text-amber-300 flex items-center gap-1 shadow-sm">
            <span>💎</span>
            <span>{points}</span>
            <span className="text-[10px] font-normal text-amber-400/80">نقطة</span>
          </div>

          <div
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
              levelData?.member?.can_submit
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {levelData?.member?.can_submit ? '✍️ كاتب' : '👀 مشاهد'}
          </div>
        </div>
      </header>

      {/* 2. LIVE RACING TRACK STRIP (حلبة السباق الميداني) */}
      <div className="my-2.5 p-3 rounded-xl bg-[#121620] border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-amber-400 flex items-center gap-1">
            <span>🏎️</span>
            <span>المرحلة {currentLvl} من 10</span>
          </span>
          {remainingTimeSeconds !== null && (
            <span className="font-mono text-slate-300 flex items-center gap-1">
              <span>⏱️</span>
              <span>{formatDuration(remainingTimeSeconds)}</span>
            </span>
          )}
        </div>

        {/* 10 Checkpoints Track */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
            const isCompleted = step < currentLvl;
            const isCurrent = step === currentLvl;

            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-slate-950 shadow-sm shadow-emerald-500/40'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 ring-offset-2 ring-offset-[#121620] scale-110 animate-pulse font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CLUE & CHALLENGE CARD (Clean, Reduced Text) */}
      <section className="flex-1 my-1 space-y-3">
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>🎯</span>
              <span>{level?.title}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              مسار {levelData?.team?.variant}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {level?.clueText}
          </p>

          {/* Photo if attached */}
          {level?.photoUrl && (
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="w-full mt-2 text-right group relative overflow-hidden rounded-xl border border-slate-800 hover:border-amber-500 transition"
            >
              <img
                src={level.photoUrl}
                alt="دليل مصور بالمدرسة"
                className="w-full h-36 object-cover object-center group-hover:scale-102 transition duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-xs text-white font-bold backdrop-blur-[1px]">
                🔍 اضغط لتكبير صورة الدليل بالمدرسة
              </div>
            </button>
          )}

          {/* Booth Game info if Booth Challenge */}
          {level?.booth && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-1.5 text-xs">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <span>🎪</span>
                <span>تحدي البوث الميداني: {level.booth.game_name}</span>
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-slate-400">القواعد: </span>
                {level.booth.rules_ar}
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-slate-400">شرط الفوز: </span>
                {level.booth.win_condition}
              </div>
            </div>
          )}
        </div>

        {/* 4. POINT-BASED HINT LADDER */}
        <div className="p-3 rounded-xl bg-[#121620] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 flex items-center gap-1">
              <span>💡</span>
              <span>وسائل المساعدة (تخصم من النقاط)</span>
            </span>
            <span className="text-amber-400 font-mono text-[10px]">
              رصيدك: {points} نقطة
            </span>
          </div>

          <div className="space-y-1.5">
            {[1, 2, 3].map((num) => {
              const h = hints[num] || { unlocked: false, text: null };
              const isLockedByPrior = (num === 2 && !hints[1]?.unlocked) || (num === 3 && !hints[2]?.unlocked);
              const cost = num === 1 ? 10 : num === 2 ? 20 : 30;

              return (
                <div key={num} className="rounded-lg bg-slate-900/60 border border-slate-800/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <span>تلميح {num}</span>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        (-{cost} نقاط)
                      </span>
                    </span>

                    {h.unlocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 font-semibold">
                        مكشوف
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLockedByPrior || hintLoading}
                        onClick={() => handleUnlockHint(num)}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition font-semibold"
                      >
                        كشف (-{cost} نقاط)
                      </button>
                    )}
                  </div>

                  {h.unlocked && h.text && (
                    <p className="mt-2 text-slate-200 text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      💡 {h.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. ANSWER & SUBMISSION SECTION */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800 space-y-3">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-bold text-center animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 shadow-md shadow-emerald-900/30'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800 shadow-md shadow-rose-900/30'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {levelData?.member && !levelData.member.can_submit ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2.5">
              <div className="text-3xl">👀</div>
              <h4 className="text-xs font-bold text-slate-200">أنت في وضع المشاهدة والنقاش</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                السؤال والألغاز معروضة أمامك للمساعدة والتفكير الجماعي. تسليم الإجابة متاح فقط لقائد الفريق والكاتب المعتمد.
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-[10px] text-amber-400 font-semibold border border-slate-700">
                💡 شارك أفكارك وحلولك الميدانية مع كاتب فريقك
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              {isMulti ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {level.questions[0]}
                    </label>
                    <input
                      type="text"
                      value={multiAnswer.ans1}
                      onChange={(e) => setMultiAnswer((p) => ({ ...p, ans1: e.target.value }))}
                      placeholder="الإجابة الأولى..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {level.questions[1]}
                    </label>
                    <input
                      type="text"
                      value={multiAnswer.ans2}
                      onChange={(e) => setMultiAnswer((p) => ({ ...p, ans2: e.target.value }))}
                      placeholder="الإجابة الثانية..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="اكتب الحل الميداني أو الكود هنا..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-600 font-medium placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-black text-xs transition disabled:opacity-50 shadow-md shadow-amber-600/20"
                >
                  {submitting ? 'جاري التحقق...' : 'تأكيد الحل 🚀'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700/60"
                >
                  <span>📷</span>
                  <span>مسح QR</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* PHOTO ZOOM MODAL */}
      {showPhotoModal && level?.photoUrl && (
        <div
          onClick={() => setShowPhotoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <div className="max-w-lg w-full space-y-2">
            <img
              src={level.photoUrl}
              alt="تكبير الدليل"
              className="w-full max-h-[80vh] object-contain rounded-xl border border-slate-800"
            />
            <p className="text-center text-xs text-slate-400">اضغط في أي مكان للإغلاق</p>
          </div>
        </div>
      )}

      {/* QR MODAL / MANUAL CODE ENTRY */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#121620] border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">مسح / إدخال كود الـ QR</h3>
              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setQrResult(null);
                  setManualQrToken('');
                }}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              إذا كنت قد مسحت الرمز بكاميرا هاتفك أو ترغب بإدخال الرمز المكتوب أسفل الـ QR:
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="أدخل رمز الـ QR (مثال: qr_stairs_2)..."
                value={manualQrToken}
                onChange={(e) => setManualQrToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
              />
              <button
                type="button"
                disabled={qrResolving || !manualQrToken.trim()}
                onClick={() => handleResolveQr(manualQrToken)}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {qrResolving ? 'جاري التحقق...' : 'فك شفرة الرمز'}
              </button>
            </div>

            {qrResult && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  qrResult.error
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-900'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900 space-y-1'
                }`}
              >
                {qrResult.error ? (
                  qrResult.error
                ) : (
                  <>
                    <p className="font-bold">{qrResult.label}</p>
                    <p>{qrResult.hintMessage}</p>
                    {qrResult.revealedContent && (
                      <div className="mt-1 pt-1 border-t border-emerald-800 text-amber-300 font-mono text-[11px]">
                        المحتوى المكتشف: {qrResult.revealedContent}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
