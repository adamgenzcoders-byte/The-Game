'use client';

// ========================================================
// app/storyteller/page.jsx - Stage Storyteller Script Screen
// ========================================================

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function StorytellerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminEraId = searchParams.get('eraId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadScript() {
      const token = localStorage.getItem('device_token');
      const adminToken = localStorage.getItem('admin_token');

      let url = '/api/storyteller';
      const headers = {};

      if (adminEraId && adminToken) {
        url += `?eraId=${adminEraId}`;
        headers['x-admin-key'] = adminToken;
      } else if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch(url, { headers });
        const json = await res.json();

        if (!res.ok) {
          setError(json.message || json.error || 'غير مصرح لك بقراءة نص الراوي');
        } else {
          setData(json);
        }
      } catch (err) {
        setError('تعذر تحميل نص الراوي');
      } finally {
        setLoading(false);
      }
    }

    loadScript();
  }, [adminEraId, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0c10] text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-lg font-bold text-slate-200">{error}</h1>
        <Link
          href="/play"
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl hover:bg-slate-700"
        >
          العودة للعبة
        </Link>
      </main>
    );
  }

  const era = data?.era;
  const eraColor = era?.color || '#d4af37';

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 max-w-lg mx-auto bg-[#0a0c10] text-slate-100">
      {/* Stage Header */}
      <header className="text-center pt-4 pb-2 border-b border-slate-900 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/60 text-xs text-amber-400 font-bold">
          <span>🎤</span>
          <span>راوي العصر على خشبة المسرح</span>
        </div>

        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: eraColor }}
        >
          {era?.name}
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          المتحدث: {era?.ruler} {data?.teamName ? `• إلقاء فريق ${data.teamName}` : ''}
        </p>
      </header>

      {/* Main Large Stage Script Card */}
      <section className="my-auto py-8">
        <div
          className="p-6 rounded-2xl border bg-[#121620] shadow-xl space-y-4 relative"
          style={{ borderColor: `${eraColor}60` }}
        >
          <div className="text-center">
            <span className="text-[11px] text-slate-400 block mb-1">
              اقرأ هذا النص بوضوح وثقة عبر الميكروفون
            </span>
          </div>

          <p className="text-base sm:text-lg text-slate-100 font-serif leading-relaxed text-center sm:text-justify px-2">
            «{era?.scriptText}»
          </p>

          <div className="pt-2 text-center">
            <span className="text-[10px] text-slate-500">
              بمجرد انتهائك من الإلقاء، سيظهر هذا الجزء على شاشة العرض الكبرى أمام المدرسة.
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-2 text-center">
        <Link
          href="/play"
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          ← العودة للوحة التحكم
        </Link>
      </footer>
    </main>
  );
}

export default function StorytellerPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <StorytellerContent />
    </Suspense>
  );
}

