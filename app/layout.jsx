import './globals.css';

export const metadata = {
  title: 'لغز ختم العصور - مدرسة السويدي الدولية',
  description: 'لعبة تحقيق تفاعلية لمصر عبر الحضارات في اليوم المفتوح لمدرسة السويدي',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic min-h-screen bg-[#0a0c10] text-slate-100 antialiased selection:bg-amber-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
