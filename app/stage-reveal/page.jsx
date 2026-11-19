'use client';

// ========================================================
// app/stage-reveal/page.jsx - 4-Slot Stage Projector Finale
// ========================================================

import { useState, useEffect } from 'react';

export default function StageRevealPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStage() {
      try {
        const res = await fetch('/api/stage-reveal');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStage();
    const interval = setInterval(fetchStage, 2500);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const slots = data?.slots || [];
  const allRevealed = data?.allRevealed;
  const curseText = data?.curseText;

  return (
    <main className="min-h-screen flex flex-col justify-between p-8 bg-[#0a0c10] text-slate-100 overflow-hidden select-none">
      {/* Top Banner */}
      <header className="text-center space-y-2 border-b border-slate-900 pb-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-amber-500 uppercase tracking-widest">
          مدرسة السويدي الدولية للتكنولوجيا التطبيقية • المنصة الكبرى
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
          كشف الحقيقة وكسر لعنة العصور
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          استمعوا إلى شهادة الرواة من كل عصر لإعادة كتابة التاريخ المحذوف
        </p>
      </header>

      {/* 4 SLOTS GRID */}
      <section className="my-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map((slot, index) => {
            const isRevealed = slot.isRevealed;

            return (
              <div
                key={slot.eraId}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-700 min-h-[280px] ${
                  isRevealed
                    ? 'bg-[#121620] shadow-lg'
                    : 'bg-slate-950/60 border-slate-900/80 opacity-60'
                }`}
                style={{
                  borderColor: isRevealed ? slot.color : '#1e293b',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: slot.color }}
                    >
                      العصر {index + 1}: {slot.eraName}
                    </span>
                    <span className="text-xl">{slot.icon}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-200 mb-1">
                    {slot.ruler}
                  </h3>
                  <p className="text-[11px] text-amber-500/90 font-medium mb-3">
                    فريق: {slot.winningTeamIcon} {slot.winningTeamName}
                  </p>

                  {isRevealed ? (
                    <p className="text-xs text-slate-300 font-serif leading-relaxed line-clamp-6">
                      «{slot.scriptText}»
                    </p>
                  ) : (
                    <div className="py-12 text-center text-slate-600 space-y-2">
                      <div className="text-2xl">🔒</div>
                      <p className="text-xs">بانتظار إلقاء الراوي...</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/60 text-center">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isRevealed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900'
                        : 'bg-slate-900 text-slate-600'
                    }`}
                  >
                    {isRevealed ? 'تم كشف الحقيقة' : 'مغلق في انتظار المنصة'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CURSE BREAKING BANNER */}
      {allRevealed ? (
        <section className="p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500 text-center space-y-3 animate-fade-in shadow-2xl">
          <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider">
            انكسرت اللعنة واكتملت الحقيقة
          </div>
          <p className="text-lg sm:text-2xl font-serif font-bold text-amber-300 max-w-3xl mx-auto leading-relaxed">
            «{curseText}»
          </p>
          <p className="text-xs text-slate-400">
            عادت الروح لمصر الخالدة بفضل تحريات طلاب مدرسة السويدي الدولية.
          </p>
        </section>
      ) : (
        <footer className="text-center text-xs text-slate-600">
          تظهر التعويذة الكاملة بعد انتهاء الرواة الأربعة من إلقاء شهاداتهم.
        </footer>
      )}
    </main>
  );
}

