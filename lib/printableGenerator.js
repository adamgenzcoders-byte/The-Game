// ========================================================
// lib/printableGenerator.js - Printable A4/A5 Sheets Generator
// ========================================================

const QRCode = require('qrcode');

/**
 * Generates Printable A4 QR Sheets
 */
async function generateQrSheetsHtml(qrList, baseUrl = 'https://sewedy-chronicle.vercel.app', isAdminCopy = false) {
  const cards = [];
  for (const item of qrList) {
    const targetUrl = `${baseUrl}/q/${item.token}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });

    cards.push({
      token: item.token,
      label: item.label,
      location: item.location_name,
      eraId: item.era_id,
      levelNum: item.level_number,
      variant: item.variant,
      qrDataUrl,
    });
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شيت ملصقات الـ QR - مدرسة السويدي</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; }
    .no-print { background: #1e293b; color: #fff; padding: 10px; text-align: center; }
    .btn { background: #c59b27; color: #000; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 20px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .card { border: 2px dashed #444; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; background: #fafafa; }
    .card img { width: 170px; height: 170px; margin: 4px auto; display: block; }
    .card .loc { font-size: 13px; font-weight: bold; color: #991b1b; }
    .card h3 { margin: 4px 0; font-size: 15px; }
    .card .admin-meta { font-size: 11px; background: #fef3c7; color: #92400e; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة ملصقات الـ QR (A4)</button>
  </div>
  <div class="header">
    <h1>مدرسة السويدي الدولية • ملصقات الـ QR الميدانية</h1>
    <p>لغز مصر عبر الحضارات - عدد الملصقات: ${cards.length} ${isAdminCopy ? '(نسخة المنظمين مع أرقام المراحل)' : ''}</p>
  </div>
  <div class="grid">
    ${cards
      .map(
        (c) => `
      <div class="card">
        <div class="loc">${c.location || 'المبنى المدرسي'}</div>
        <h3>${c.label}</h3>
        <img src="${c.qrDataUrl}" alt="${c.token}" />
        <div style="font-family: monospace; font-size: 11px; color: #666;">Token: ${c.token}</div>
        ${
          isAdminCopy && (c.eraId || c.levelNum)
            ? `<div class="admin-meta">خاص بالمنظم: العصر ${c.eraId || 'الكل'} - المستوى ${c.levelNum || 'الكل'} ${c.variant ? `(تفريعة ${c.variant})` : ''}</div>`
            : ''
        }
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
}

/**
 * Generates Printable A5 Booth Script Sheets with 3 Colored Variant Cards
 */
function generateBoothScriptsHtml(boothsList) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كروت محطات البوثات - A5 - مدرسة السويدي</title>
  <style>
    @page { size: A5 landscape; margin: 8mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; font-size: 12px; }
    .no-print { background: #1e293b; color: #fff; padding: 8px; text-align: center; }
    .btn { background: #059669; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .page-break { page-break-after: always; padding: 8px; border: 2px solid #334155; border-radius: 8px; margin-bottom: 20px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; color: #0f172a; border-bottom: 2px solid #c59b27; padding-bottom: 4px; }
    .meta { font-size: 11px; color: #475569; margin-bottom: 8px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin-bottom: 6px; }
    .box-title { font-weight: bold; color: #0f172a; margin-bottom: 2px; }
    .variants-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .v-card { border-radius: 6px; padding: 8px; text-align: center; border: 2px solid #000; }
    .v-a { background: #fef3c7; border-color: #d97706; }
    .v-b { background: #e0f2fe; border-color: #0284c7; }
    .v-c { background: #dcfce7; border-color: #16a34a; }
    .code { font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة كروت البوثات (A5)</button>
  </div>
  ${boothsList
    .map(
      (b) => `
    <div class="page-break">
      <h1>بوث لعبة: ${b.game_name} (العصر ${b.era_id} - المستوى ${b.level_number})</h1>
      <div class="meta">وقت التحدي: حوالي دقيقتين | إشراف منظم البوث</div>

      <div class="box">
        <div class="box-title">قواعد اللعبة وطريقة الفوز:</div>
        <div>${b.rules_ar}</div>
        <div style="font-weight:bold; margin-top:3px; color:#166534;">شرط الفوز: ${b.win_condition}</div>
      </div>

      <div class="box">
        <div class="box-title">ماذا تقول للفريق بصوت القصة:</div>
        <div style="font-style:italic;">"${b.organizer_script}"</div>
      </div>

      ${b.safety_notes ? `<div style="font-size:10px; color:#b91c1c; font-weight:bold;">ملاحظات السلامة: ${b.safety_notes}</div>` : ''}

      <div style="font-weight:bold; margin-top:6px;">كروت المكافأة للمنظم (اسأل الفريق عن تفريعته A أو B أو C وسلمه الكود الخاص به فقط):</div>
      <div class="variants-grid">
        <div class="v-card v-a">
          <strong>تفريعة A (الصفراء)</strong>
          <div class="code">${b.reward_variant_a}</div>
        </div>
        <div class="v-card v-b">
          <strong>تفريعة B (الزرقاء)</strong>
          <div class="code">${b.reward_variant_b}</div>
        </div>
        <div class="v-card v-c">
          <strong>تفريعة C (الخضراء)</strong>
          <div class="code">${b.reward_variant_c}</div>
        </div>
      </div>
    </div>`
    )
    .join('')}
</body>
</html>`;
}

/**
 * Generates Printable Emergency Backup Sheet
 */
function generateEmergencyBackupSheet(levelsList) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شيت أكواد الطوارئ الميدانية - مدرسة السويدي</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; font-size: 11px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #94a3b8; padding: 4px 6px; text-align: right; }
    th { background: #1e293b; color: #fff; }
    tr:nth-child(even) { background: #f8fafc; }
    .code { font-family: monospace; font-weight: bold; color: #047857; }
    .no-print { background: #334155; color: #fff; padding: 8px; text-align: center; }
    .btn { background: #dc2626; color: #fff; border: none; padding: 5px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة كود الطوارئ الورقي</button>
  </div>
  <h1>مدرسة السويدي الدولية • شيت حلول الطوارئ لجميع المستويات (سري للمنظمين)</h1>
  <table>
    <thead>
      <tr>
        <th>العصر</th>
        <th>المستوى</th>
        <th>العنوان</th>
        <th>نوع اللغز</th>
        <th>إجابة تفريعة A</th>
        <th>إجابة تفريعة B</th>
        <th>إجابة تفريعة C</th>
      </tr>
    </thead>
    <tbody>
      ${levelsList
        .map(
          (l) => `
        <tr>
          <td><strong>${l.era_name}</strong></td>
          <td style="text-align:center;">${l.level_number}</td>
          <td>${l.title}</td>
          <td>${l.clue_type}</td>
          <td class="code">${l.ans_a || '---'}</td>
          <td class="code">${l.ans_b || '---'}</td>
          <td class="code">${l.ans_c || '---'}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Generates QR Location Guide — QR code image paired side-by-side with school photo
 * Shows organizers exactly where to stick each QR sticker
 */
const QR_PHOTO_MAP = {
  // Era 1
  'qr_e1_l2_a': 'PXL_20261118_125930095.jpg',
  'qr_e1_l2_b': 'PXL_20261118_125930095.jpg',
  'qr_e1_l2_c': 'PXL_20261118_125930095.jpg',
  'qr_stairs_2': 'PXL_20261118_125930095.jpg',
  'qr_food_court': 'PXL_20261118_130004639.jpg',
  'qr_grand_hall': 'PXL_20261118_130245965.jpg',

  // Era 2
  'qr_e2_l2_a': 'PXL_20261118_130512501.jpg',
  'qr_e2_l2_b': 'PXL_20261118_130512501.jpg',
  'qr_e2_l2_c': 'PXL_20261118_130512501.jpg',
  'qr_stairs_3': 'PXL_20261118_130512501.jpg',
  'qr_electrometer': 'PXL_20261118_131609366.jpg',
  'qr_music_corner': 'PXL_20261118_130814993.jpg',

  // Era 3
  'qr_e3_l2_a': 'PXL_20261118_131951162.MP.jpg',
  'qr_e3_l2_b': 'PXL_20261118_131951162.MP.jpg',
  'qr_e3_l2_c': 'PXL_20261118_131951162.MP.jpg',
  'qr_stairs_4': 'PXL_20261118_131951162.MP.jpg',

  // Era 4
  'qr_e4_l2_a': 'PXL_20261118_131442919.jpg',
  'qr_e4_l2_b': 'PXL_20261118_131442919.jpg',
  'qr_e4_l2_c': 'PXL_20261118_131442919.jpg',
  'qr_stairs_archive': 'PXL_20261118_131442919.jpg',
};

async function generateQrGuideHtml(qrList, levelsWithPhotos = [], baseUrl = '') {
  // Build fallback map: era_lvl -> photo_filename
  const photoMap = {};
  for (const lv of levelsWithPhotos) {
    if (lv.photo_filename) {
      const key = `${lv.era_id}_${lv.level_number}`;
      if (!photoMap[key]) photoMap[key] = lv.photo_filename;
    }
  }

  const cards = [];
  for (const item of qrList) {
    const targetUrl = `${baseUrl}/q/${item.token}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const photoKey = `${item.era_id}_${item.level_number}`;
    const photoFilename = QR_PHOTO_MAP[item.token] || photoMap[photoKey] || null;
    const cleanContent = (item.revealed_content || '').replace(/<[^>]*>/g, '').trim();

    let extractedCode = '';
    const strongMatch = (item.revealed_content || '').match(/<strong[^>]*>(.*?)<\/strong>/i);
    if (strongMatch) {
      extractedCode = strongMatch[1].trim();
    } else {
      const colonMatch = cleanContent.match(/:\s*([A-Za-z0-9\-]+)/);
      if (colonMatch) extractedCode = colonMatch[1].trim();
    }

    cards.push({
      token: item.token,
      label: item.label,
      location: item.location_name,
      eraId: item.era_id,
      levelNum: item.level_number,
      variant: item.variant,
      qrDataUrl,
      photoFilename,
      cleanContent,
      extractedCode,
    });
  }

  const rows = cards.map((c, index) => `
  <div class="guide-card">
    <div class="card-header">
      <div class="header-right">
        <span class="num-badge">#${index + 1}</span>
        <span class="era-badge">العصر ${c.eraId || '-'} • مستوى ${c.levelNum || '-'}${c.variant ? ` • تفريعة [${c.variant}]` : ''}</span>
        <span class="card-title">${c.label}</span>
      </div>
      <div class="location-badge">📍 ${c.location || 'المبنى المدرسي'}</div>
    </div>
    <div class="card-body">
      <!-- عمود كود الـ QR -->
      <div class="qr-col">
        <div class="col-title">ملصق كود الـ QR المطلوب طباعته ولصقه</div>
        <img src="${c.qrDataUrl}" alt="${c.token}" class="qr-img" />
        <div class="token-tag">رمز الكود: <code>${c.token}</code></div>
        ${c.extractedCode ? `
        <div class="code-box">
          <span class="code-title">🔑 كود الحل الذي يظهر للمتسابق:</span>
          <span class="code-val">${c.extractedCode}</span>
        </div>` : ''}
        <div class="content-preview">${c.cleanContent}</div>
      </div>

      <!-- مؤشر سهم الربط -->
      <div class="arrow-col">
        <div class="arrow-text">يُلصق هنا</div>
        <div class="arrow-icon">👈</div>
      </div>

      <!-- عمود صورة الموقع الحقيقي بالمدرسة -->
      <div class="photo-col">
        <div class="col-title">📸 موقع اللصق في المدرسة (ألصق الـ QR بجوار هذا المكان)</div>
        ${c.photoFilename
          ? `
          <div class="photo-wrapper">
            <img src="/media/catalog/${c.photoFilename}" onerror="this.onerror=null; this.src='media/catalog/${c.photoFilename}';" alt="موقع الملصق الميداني" class="photo-img" />
            <div class="photo-meta">اسم ملف الصورة: <code>${c.photoFilename}</code> • الموقع: ${c.location}</div>
          </div>`
          : `<div class="no-photo">⚠️ لا توجد صورة مرفوعة لهذا المعلم حالياً</div>`}
      </div>
    </div>
  </div>`).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>دليل تركيب ملصقات الـ QR الميدانية مع الصور - مدرسة السويدي</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Arial, sans-serif; margin: 0; background: #f1f5f9; color: #0f172a; font-size: 13px; }
    .no-print { background: #0f172a; color: #fff; padding: 12px 20px; text-align: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #f59e0b; color: #000; border: none; padding: 8px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; transition: 0.2s; }
    .btn:hover { background: #d97706; }
    .container { max-width: 1000px; margin: 0 auto; padding: 16px; }
    .page-header { text-align: center; background: #fff; padding: 20px; border-radius: 12px; border: 2px solid #e2e8f0; margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
    .page-header p { margin: 0; font-size: 14px; color: #64748b; }
    .guide-card { background: #fff; border: 2px solid #cbd5e1; border-radius: 10px; margin-bottom: 20px; overflow: hidden; page-break-inside: avoid; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .card-header { background: #1e293b; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .num-badge { background: #475569; color: #fff; font-weight: bold; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
    .era-badge { background: #f59e0b; color: #000; font-weight: bold; font-size: 12px; padding: 2px 10px; border-radius: 4px; }
    .card-title { font-weight: bold; font-size: 14px; color: #f8fafc; }
    .location-badge { background: #334155; color: #fcd34d; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid #475569; }
    .card-body { display: flex; align-items: stretch; padding: 14px; gap: 12px; }
    .qr-col { flex: 0 0 260px; display: flex; flex-direction: column; align-items: center; text-align: center; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; }
    .col-title { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 8px; }
    .qr-img { width: 180px; height: 180px; display: block; margin: 0 auto 6px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; padding: 4px; }
    .token-tag { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .token-tag code { font-family: monospace; background: #e2e8f0; padding: 1px 6px; border-radius: 4px; color: #0f172a; font-weight: bold; }
    .code-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 6px 10px; width: 100%; margin-bottom: 6px; text-align: center; }
    .code-title { display: block; font-size: 10px; color: #065f46; font-weight: 600; }
    .code-val { font-family: monospace; font-size: 14px; font-weight: 800; color: #047857; letter-spacing: 0.5px; }
    .content-preview { font-size: 11px; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; width: 100%; text-align: center; line-height: 1.4; }
    .arrow-col { flex: 0 0 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #d97706; }
    .arrow-text { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
    .arrow-icon { font-size: 24px; animation: bounce 1.5s infinite; }
    .photo-col { flex: 1; display: flex; flex-direction: column; }
    .photo-wrapper { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #000; height: 100%; display: flex; flex-direction: column; }
    .photo-img { width: 100%; max-height: 240px; object-fit: cover; display: block; background: #1e293b; }
    .photo-meta { background: #1e293b; color: #94a3b8; font-size: 10px; padding: 6px 10px; font-family: monospace; border-top: 1px solid #334155; }
    .photo-meta code { color: #f59e0b; }
    .no-photo { height: 180px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; color: #94a3b8; font-size: 13px; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .container { max-width: 100%; padding: 0; }
      .guide-card { border: 1.5px solid #000; margin-bottom: 15px; page-break-inside: avoid; }
      .card-header { background: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="color:#f59e0b;">مدرسة السويدي الدولية للتكنولوجيا التطبيقية</strong> • دليل تركيب ملصقات QR الميدانية
    </div>
    <button class="btn" onclick="window.print()">🖨️ طباعة الدليل الميداني الكامل (A4)</button>
  </div>

  <div class="container">
    <div class="page-header">
      <h1>دليل تركيب ملصقات الـ QR الميدانية • لغز مصر عبر الحضارات</h1>
      <p>كتالوج يوضح كل كود QR مع صورة المعلم الحقيقي بالمدرسة الذي يُلصق بجانبه مباشرة • عدد الملصقات: ${cards.length}</p>
    </div>

    ${rows}
  </div>
</body>
</html>`;
}

module.exports = {
  generateQrSheetsHtml,
  generateBoothScriptsHtml,
  generateEmergencyBackupSheet,
  generateQrGuideHtml,
};

