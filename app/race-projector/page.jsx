'use strict';
'use client';

// ========================================================
// app/race-projector/page.jsx - 4-Lane Live Race Projector
// ========================================================

import { useState, useEffect } from 'react';

export default function RaceProjectorPage() {
  const [data, setData] = useState(null);
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRace() {
      try {
        const res = await fetch('/api/race-projector');
        const json = await res.json();
        setData(json);

        // Fetch journey end_at_epoch
        const jRes = await fetch('/api/journey');
        const jData = await jRes.json();
        if (jData.endAtEpoch) {
          const diff = Math.max(0, Math.floor((jData.endAtEpoch - Date.now()) / 1000));
          setRemainingTimeSeconds(diff);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRace();
    const interval = setInterval(fetchRace, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (remainingTimeSeconds === null || remainingTimeSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingTimeSeconds((prev) => Math.max(0, prev - 1));
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const lanes = data?.lanes || [];
  const gameState = data?.gameState;

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 bg-[#0a0c10] text-slate-100 select-none">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1">
            مدرسة السويدي الدولية للتكنولوجيا التطبيقية
          </div>
          <h1 className="text-2xl font-black text-slate-100">
            شاشة السباق الميداني المباشر • مصر عبر الحضارات
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {remainingTimeSeconds !== null && (
            <div className="bg-[#121620] border border-amber-600/50 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                الوقت المتبقي في السباق
              </span>
              <span className="font-mono text-base font-black text-amber-400">
                {formatDuration(remainingTimeSeconds)}
              </span>
            </div>
          )}

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">حالة اللعبة</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                gameState === 'RUNNING'
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-600 text-amber-400'
              }`}
            >
              {gameState === 'RUNNING' && 'المنافسة جارية'}
              {gameState === 'LOBBY' && 'تسجيل الفرق'}
              {gameState === 'LOCKED' && 'تم توزيع المسارات'}
              {gameState === 'COUNTDOWN' && 'العد التنازلي'}
              {gameState === 'PAUSED' && 'توقف مؤقت'}
              {gameState === 'ENDED' && 'انتهت الرحلة'}
            </span>
          </div>
        </div>
      </header>

      {/* 4 LANES SECTION */}
      <section className="flex-1 my-4 space-y-4 overflow-y-auto">
        {lanes.map((lane) => (
          <div
            key={lane.eraId}
            className="p-4 rounded-2xl bg-[#121620] border space-y-3"
            style={{ borderColor: `${lane.color}50` }}
          >
            {/* Lane Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{lane.icon}</span>
                <div>
                  <h2
                    className="text-base font-bold tracking-tight"
                    style={{ color: lane.color }}
                  >
                    مسار: {lane.eraName} ({lane.ruler})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    عدد الفرق: {lane.teams.length}
                  </p>
                </div>
              </div>

              {/* Steps markers 1 to 10 */}
              <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                <span>المستويات: 1</span>
                <span>•</span>
                <span>3</span>
                <span>•</span>
                <span>5</span>
                <span>•</span>
                <span>7</span>
                <span>•</span>
                <span>10 (النهاية)</span>
              </div>
            </div>

            {/* Teams Track in this Lane */}
            <div className="space-y-2">
              {lane.teams.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">
                  بانتظار توزيع الفرق على هذا العصر...
                </p>
              ) : (
                lane.teams.map((t, idx) => {
                  const percent = (t.currentLevel / 10) * 100;

                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs"
                    >
                      {/* Rank Badge */}
                      <span className="w-5 text-center font-bold text-slate-400">
                        #{idx + 1}
                      </span>

                      {/* Team Name */}
                      <div className="w-32 flex items-center gap-1.5 truncate">
                        <span>{t.icon}</span>
                        <span className="font-bold text-slate-200 truncate">
                          {t.name}
                        </span>
                      </div>

                      {/* Track Bar */}
                      <div className="flex-1 bg-slate-950 h-5 rounded-lg overflow-hidden relative border border-slate-800/80">
                        <div
                          className="h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2"
                          style={{
                            width: `${Math.max(8, percent)}%`,
                            backgroundColor: `${lane.color}`,
                          }}
                        >
                          <span className="text-[10px] font-black text-slate-950">
                            {t.isFinished ? '🏆' : `L${t.currentLevel}`}
                          </span>
                        </div>
                      </div>

                      {/* Stat Metrics */}
                      <div className="w-24 text-left font-mono text-[11px] text-slate-400">
                        {t.isFinished ? (
                          <span className="text-amber-400 font-bold">مكتمل 🏆</span>
                        ) : (
                          `${Math.floor(t.elapsedSeconds / 60)}د ${t.elapsedSeconds % 60}ث`
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 border-t border-slate-900 pt-3">
        يتم تحديث شاشة السباق الميداني لحظياً وبشكل حي عبر أجهزة الطلاب وشبكة المدرسة.
      </footer>
    </main>
  );
}
