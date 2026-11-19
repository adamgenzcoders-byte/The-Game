'use strict';
'use client';

// ========================================================
// app/play/page.jsx - Player Home (Calm, Minimal, Arabic RTL)
// ========================================================

import { useState, useEffect } from 'react';
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

  // Lockout timer
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Modals & Popups
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [manualQrToken, setManualQrToken] = useState('');
  const [qrResolving, setQrResolving] = useState(false);
  const [qrResult, setQrResult] = useState(null);

  // Hint confirmation modal
  const [pendingHintNumber, setPendingHintNumber] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

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

        // Check if not running
        if (data.gameState && data.gameState !== 'RUNNING') {
          router.replace('/lobby');
          return;
        }

        if (data.lockedOut) {
          setLockoutRemaining(data.remainingSeconds || 30);
        }

        setLevelData(data);
      } catch (err) {
        console.error('Error fetching game state:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentLevel();
    const interval = setInterval(fetchCurrentLevel, 4000);
    return () => clearInterval(interval);
  }, [router]);

  // Lockout tick
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  async function handleSubmitAnswer(e) {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0 || submitting) return;

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

      if (data.lockedOut) {
        setLockoutRemaining(data.remainingSeconds || 30);
        setFeedback({ type: 'error', message: data.message });
      } else if (data.correct) {
        setFeedback({ type: 'success', message: data.message || 'إجابة صحيحة!' });
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
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: data.message || 'إجابة غير صحيحة، حاول مجدداً' });
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
      setPendingHintNumber(null);
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

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200">
      {/* 1. TOP NAVIGATION: ONLY TWO MAIN BUTTONS + ERA PILL */}
      <header className="flex items-center justify-between py-2 border-b border-slate-900">
        <div className="flex gap-2">
          <Link
            href="/progress"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:border-slate-700 active:scale-95 transition"
          >
            تقدم الفريق
          </Link>
          <Link
            href="/levels"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:border-slate-700 active:scale-95 transition"
          >
            المستويات
          </Link>
        </div>

        <div
          className="text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5"
          style={{
            borderColor: eraColor,
            backgroundColor: `${eraColor}15`,
            color: eraColor,
          }}
        >
          <span>{levelData?.team?.icon}</span>
          <span>المستوى {level?.levelNumber || 1}/10</span>
        </div>
      </header>

      {/* 2. CALM SAFETY BANNER */}
      {levelData?.safetyBanner && (
        <aside className="my-2 py-1.5 px-3 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 text-center">
          {levelData.safetyBanner}
        </aside>
      )}

      {/* 3. MAIN GAME CONTENT */}
      <section className="flex-1 my-2 space-y-3">
        {/* Story Card */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: eraColor }}
            >
              {levelData?.team?.eraName} • {level?.title}
            </span>
            <span className="text-[11px] text-slate-500">
              التفريعة {levelData?.team?.variant}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {level?.storyText}
          </p>
        </div>

        {/* Clue Card */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-200">الدليل واللغز الميداني</h2>
            {level?.safetyWarning && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/60">
                امشِ بهدوء ولا تركض
              </span>
            )}
          </div>

          <p className="text-sm text-slate-100 font-medium leading-relaxed">
            {level?.clueText}
          </p>

          {/* Photo if attached */}
          {level?.photoUrl && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="w-full text-right group relative overflow-hidden rounded-lg border border-slate-800 hover:border-amber-600 transition"
              >
                <img
                  src={level.photoUrl}
                  alt="دليل مصور"
                  className="w-full h-36 object-cover object-center group-hover:scale-102 transition duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-xs text-white font-semibold">
                  🔍 اضغط لتكبير صورة الدليل
                </div>
              </button>
            </div>
          )}

          {/* Booth Game info if Beat 4 */}
          {level?.booth && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-amber-400">
                محطة التحدي: {level.booth.game_name}
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

        {/* 4. HINT LADDER ACCORDION */}
        <div className="p-3 rounded-xl bg-[#121620] border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400">
            سلم التلميحات (استخدمها عند الحاجة)
          </div>

          <div className="space-y-1.5">
            {[1, 2, 3].map((num) => {
              const h = hints[num] || { unlocked: false, text: null, penalty: 0 };
              const isLockedByPrior = (num === 2 && !hints[1]?.unlocked) || (num === 3 && !hints[2]?.unlocked);

              return (
                <div key={num} className="rounded-lg bg-slate-900/60 border border-slate-800/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-300">
                      التلميح {num}{' '}
                      {num === 1 && '(مجاني)'}
                      {num === 2 && '(+60 ثانية جزاء)'}
                      {num === 3 && '(+120 ثانية جزاء)'}
                    </span>

                    {h.unlocked ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">مكشوف</span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLockedByPrior || hintLoading}
                        onClick={() => {
                          if (num === 1) {
                            handleUnlockHint(1);
                          } else {
                            setPendingHintNumber(num);
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition"
                      >
                        كشف
                      </button>
                    )}
                  </div>

                  {h.unlocked && h.text && (
                    <p className="mt-2 text-slate-200 text-xs bg-slate-950/60 p-2 rounded border border-slate-800/60">
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
              className={`p-2.5 rounded-lg text-xs font-semibold text-center ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-900'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Lockout overlay / warning */}
          {lockoutRemaining > 0 ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900 text-center space-y-2">
              <p className="text-xs text-rose-300 font-bold">
                محاولات مقفولة مؤقتاً لتكرار الخطأ
              </p>
              <div className="text-2xl font-black text-rose-400">
                {lockoutRemaining} ثانية
              </div>
              <p className="text-[11px] text-slate-400">
                راجع مع فريقك الدليل وسلّم التلميحات بهدوء.
              </p>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    إجابة المستوى أو الكود الميداني
                  </label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="اكتب الحل أو الكلمة أو الرقم هنا..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {submitting ? 'جاري التحقق...' : 'تأكيد الحل'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>📷</span>
                  <span>مسح QR</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CONFIRM HINT PENALTY MODAL */}
      {pendingHintNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#121620] border border-slate-800 p-5 rounded-2xl max-w-xs w-full text-center space-y-3">
            <h3 className="text-sm font-bold text-amber-400">
              تأكيد كشف التلميح {pendingHintNumber}
            </h3>
            <p className="text-xs text-slate-300">
              كشف هذا التلميح سيضيف غرامة زمنية قدرها{' '}
              <span className="font-bold text-rose-400">
                +{pendingHintNumber === 2 ? '60' : '120'} ثانية
              </span>{' '}
              إلى وقت فريقكم الكلي في سباق العصر.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleUnlockHint(pendingHintNumber)}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
              >
                موافق، اكشف التلميح
              </button>
              <button
                type="button"
                onClick={() => setPendingHintNumber(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder="أدخل رمز الـ QR (مثال: QR-PHAR-02)..."
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
