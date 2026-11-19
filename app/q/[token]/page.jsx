'use strict';
'use client';

// ========================================================
// app/q/[token]/page.jsx - Camera QR Direct URL Resolver
// ========================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QrDirectScanPage({ params }) {
  const router = useRouter();
  const token = params.token;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function resolve() {
      if (!token) return;
      const deviceToken = localStorage.getItem('device_token');

      try {
        const res = await fetch(`/api/qr/${encodeURIComponent(token)}`, {
          headers: deviceToken ? { Authorization: `Bearer ${deviceToken}` } : {},
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'رمز QR غير معروف');
        } else {
          setData(json);
        }
      } catch (err) {
        setError('تعذر قراءة رمز QR');
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 flex flex-col justify-between bg-[#0a0c10] text-slate-100">
      <header className="text-center pt-6 space-y-1">
        <div className="text-4xl">📷</div>
        <h1 className="text-lg font-bold">كاشف الرموز الميدانية</h1>
        <p className="text-xs text-slate-400">مدرسة السويدي الدولية</p>
      </header>

      <section className="my-auto py-6">
        {error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900 text-center space-y-2">
            <p className="text-xs text-rose-300 font-bold">{error}</p>
            <Link
              href="/play"
              className="inline-block px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg"
            >
              العودة للعبة
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#121620] border border-slate-800 space-y-4">
            <div className="border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400 block">
                {data?.label}
              </span>
              <span className="text-[11px] text-slate-400">
                الموقع: {data?.location}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data?.hintMessage || 'تم العثور على الرمز الميداني بنجاح.'}
            </p>

            {data?.revealedContent && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-800/40 space-y-2">
                <span className="text-[11px] text-amber-500 font-semibold block">
                  البيانات المكتشفة:
                </span>
                <span className="text-xs text-amber-200 block leading-relaxed">
                  {(data.revealedContent || '').replace(/<[^>]*>/g, '')}
                </span>
                {data.code && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      كود الحل المطلوب إدخاله في اللعبة:
                    </span>
                    <span className="text-base font-extrabold text-emerald-300 font-mono select-all tracking-wider block mt-0.5">
                      {data.code}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/play"
              className="block w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs text-center transition"
            >
              الذهاب إلى لغز الفريق وإدخال الحل
            </Link>
          </div>
        )}
      </section>

      <footer className="text-center text-[11px] text-slate-500 py-2">
        لغز مصر عبر الحضارات
      </footer>
    </main>
  );
}

