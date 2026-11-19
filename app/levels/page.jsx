'use client';

// ========================================================
// app/levels/page.jsx - Levels Beat List (1 to 10)
// ========================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LevelsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSolvedLevel, setSelectedSolvedLevel] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function fetchLevels() {
      const token = localStorage.getItem('device_token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch('/api/levels', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.replace('/play');
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLevels();
  }, [router]);

  function handleLevelClick(lvl) {
    if (lvl.status === 'LOCKED') {
      setToastMessage(`المستوى ${lvl.levelNumber} مغلق. يجب حل المستويات السابقة أولاً.`);
      setTimeout(() => setToastMessage(''), 2500);
    } else if (lvl.status === 'CURRENT') {
      router.push('/play');
    } else if (lvl.status === 'SOLVED') {
      setSelectedSolvedLevel(lvl);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const era = data?.era;
  const levels = data?.levels || [];

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-slate-900">
        <Link
          href="/play"
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:text-white transition"
        >
          ← العودة للغز الحالي
        </Link>

        <div
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{
            borderColor: era?.color || '#d4af37',
            backgroundColor: `${era?.color || '#d4af37'}15`,
            color: era?.color || '#d4af37',
          }}
        >
          {era?.name} ({era?.ruler})
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Levels 1 to 10 List */}
      <section className="flex-1 my-3 space-y-2 overflow-y-auto max-h-[78vh]">
        <div className="text-center pb-2">
          <h1 className="text-base font-bold text-slate-100">سجل مسار التحقيق (1-10)</h1>
          <p className="text-xs text-slate-400">
            اضغط على المستوى المحلول لمراجعة أجزاء القصة المكتشفة
          </p>
        </div>

        {levels.map((lvl) => {
          const isSolved = lvl.status === 'SOLVED';
          const isCurrent = lvl.status === 'CURRENT';
          const isLocked = lvl.status === 'LOCKED';

          return (
            <div
              key={lvl.levelNumber}
              onClick={() => handleLevelClick(lvl)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                isCurrent
                  ? 'bg-amber-950/20 border-amber-600/80 shadow-sm ring-1 ring-amber-600/40'
                  : isSolved
                  ? 'bg-[#121620] border-emerald-900/40 hover:border-emerald-700/60'
                  : 'bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCurrent
                      ? 'bg-amber-600 text-slate-950'
                      : isSolved
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  {isSolved ? '✓' : lvl.levelNumber}
                </div>

                <div>
                  <h3
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-amber-400'
                        : isSolved
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {lvl.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {isSolved && 'تم الحل بنجاح • اضغط لقراءة القصة'}
                    {isCurrent && 'المستوى النشط حالياً • اضغط للحل'}
                    {isLocked && 'مغلق حتى حل المستويات السابقة'}
                  </p>
                </div>
              </div>

              <div>
                {isSolved && <span className="text-emerald-400 text-xs">📖</span>}
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-600 text-slate-950 font-bold">
                    الآن
                  </span>
                )}
                {isLocked && <span className="text-slate-600 text-xs">🔒</span>}
              </div>
            </div>
          );
        })}
      </section>

      {/* Solved Story Modal */}
      {selectedSolvedLevel && (
        <div
          onClick={() => setSelectedSolvedLevel(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121620] border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-emerald-400">
                المستوى {selectedSolvedLevel.levelNumber}: {selectedSolvedLevel.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSolvedLevel(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">جزء القصة المكتشف:</p>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedSolvedLevel.storyUnlocked}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSolvedLevel(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-2 text-center text-[11px] text-slate-500">
        تكتمل الحقيقة التاريخية بالوصول إلى المستوى العاشر وكسر اللعنة.
      </footer>
    </main>
  );
}

