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
 * Shows organizers exactly where to stick each QR sticker with full hint progression
 */
const QR_TARGET_CONFIG = {
  // Era 1 (سلم الدور الثالث)
  'qr_e1_l2_a': {
    targetPhoto: 'IMG20261118155324.jpg',
    hintPhotos: [],
    placeDesc: 'بجوار السلم في الدور الثالث (مبنى الفصول) - الموضح بالصورة بدقة',
    hintTimeline: 'ينزل للفرق في البداية كـ (جنب سلم بالمدرسة - موقع مخفي)، وبعد 10 دقائق يظهر التلميح التلقائي: "إنه في الدور الثالث بجوار السلم".'
  },
  'qr_e1_l2_b': {
    targetPhoto: 'IMG20261118155324.jpg',
    hintPhotos: [],
    placeDesc: 'بجوار السلم في الدور الثالث (مبنى الفصول) - تفريعة B',
    hintTimeline: 'ينزل للفرق في البداية كـ (جنب سلم بالمدرسة - موقع مخفي)، وبعد 10 دقائق يظهر التلميح: "إنه في الدور الثالث بجوار السلم".'
  },
  'qr_e1_l2_c': {
    targetPhoto: 'IMG20261118155324.jpg',
    hintPhotos: [],
    placeDesc: 'بجوار السلم في الدور الثالث (مبنى الفصول) - تفريعة C',
    hintTimeline: 'ينزل للفرق في البداية كـ (جنب سلم بالمدرسة - موقع مخفي)، وبعد 10 دقائق يظهر التلميح: "إنه في الدور الثالث بجوار السلم".'
  },
  'qr_stairs_2': {
    targetPhoto: 'IMG20261118155324.jpg',
    hintPhotos: [],
    placeDesc: 'بجوار السلم في الدور الثالث (مبنى الفصول) - ملصق المعلم الرئيسي',
    hintTimeline: 'الموقع في الدور الثالث بجوار درجات الصعود الموضحة في الصورة.'
  },

  // Era 2 (تارجيت 1 - كورنر المدرسة)
  'qr_e2_l2_a': {
    targetPhoto: 'target_1.jpeg',
    hintPhotos: ['hint_target_1.jpeg'],
    placeDesc: 'في كورنر من كورنرات المدرسة الموضح بالصورة الرئيسية (تارجيت 1)',
    hintTimeline: 'ينزل الهدف من غير تلميحات في البداية. التلميح الأول: "إنه في كورنر من كورنرات المدرسة". بعد 15 دقيقة أو طلب التلميح الثاني تنزل صورة الهينت المساعدة.'
  },
  'qr_e2_l2_b': {
    targetPhoto: 'target_1.jpeg',
    hintPhotos: ['hint_target_1.jpeg'],
    placeDesc: 'في كورنر من كورنرات المدرسة الموضح بالصورة الرئيسية (تارجيت 1) - تفريعة B',
    hintTimeline: 'التلميح الأول: "في كورنر من كورنرات المدرسة" -> بعد 15 دقيقة تظهر صورة الهينت المساعدة.'
  },
  'qr_e2_l2_c': {
    targetPhoto: 'target_1.jpeg',
    hintPhotos: ['hint_target_1.jpeg'],
    placeDesc: 'في كورنر من كورنرات المدرسة الموضح بالصورة الرئيسية (تارجيت 1) - تفريعة C',
    hintTimeline: 'التلميح الأول: "في كورنر من كورنرات المدرسة" -> بعد 15 دقيقة تظهر صورة الهينت المساعدة.'
  },
  'qr_stairs_3': {
    targetPhoto: 'target_1.jpeg',
    hintPhotos: ['hint_target_1.jpeg'],
    placeDesc: 'في كورنر من كورنرات المدرسة (تارجيت 1 الرئيسي)',
    hintTimeline: 'الملصق يُلصق في الزاوية الداخلية للكورنر الموضح في الصورة وصورة الهينت.'
  },

  // Era 3 (تارجت 2 - جدار السور)
  'qr_e3_l2_a': {
    targetPhoto: 'target_2.jpeg',
    hintPhotos: ['hint_target_2_1.jpeg', 'hint_target_2_2.jpeg'],
    placeDesc: 'على جدار من أسوار المدرسة الموضح بالصورة (تارجت 2)',
    hintTimeline: 'تلميح 1 (-10 نقاط): صورة مساعدة أولى -> تلميح 2: "إنه على جدار من أسوار المدرسة" -> تلميح 3 (-20 نقطة): صورة الهينت الثانية المقربة.'
  },
  'qr_e3_l2_b': {
    targetPhoto: 'target_2.jpeg',
    hintPhotos: ['hint_target_2_1.jpeg', 'hint_target_2_2.jpeg'],
    placeDesc: 'على جدار من أسوار المدرسة (تارجت 2) - تفريعة B',
    hintTimeline: 'تلميح 1: صورة أولى -> تلميح 2: على جدار من أسوار المدرسة -> تلميح 3: صورة مقربة للسور.'
  },
  'qr_e3_l2_c': {
    targetPhoto: 'target_2.jpeg',
    hintPhotos: ['hint_target_2_1.jpeg', 'hint_target_2_2.jpeg'],
    placeDesc: 'على جدار من أسوار المدرسة (تارجت 2) - تفريعة C',
    hintTimeline: 'تلميح 1: صورة أولى -> تلميح 2: على جدار من أسوار المدرسة -> تلميح 3: صورة مقربة للسور.'
  },
  'qr_stairs_4': {
    targetPhoto: 'target_2.jpeg',
    hintPhotos: ['hint_target_2_1.jpeg', 'hint_target_2_2.jpeg'],
    placeDesc: 'على جدار من أسوار المدرسة (ملصق تارجت 2 الرئيسي)',
    hintTimeline: 'يُلصق على السور في الموقع الموضح بالصور المرفقة.'
  },

  // Era 4 (تارجيت 3 - العين وكاونتر الطلبة)
  'qr_e4_l2_a': {
    targetPhoto: 'target_3_eye.jpeg',
    hintPhotos: ['hint_target_3.jpeg'],
    placeDesc: 'في الكاونتر اللي فيه صور الطلبة - في وش البانر بمسافة جيدة - على صورة إيد الطالبة زينة (أول دفعة) عند علامة العين',
    hintTimeline: 'تنزل صورة العين أولاً. تلميح 1: "العين دي هي بداية ونهاية كل شيء (مكان بداية ونهاية كل حاجة في اليوم الدراسي)" -> بعد 15 دقيقة: تظهر صورة البانر ("إنه في وش البانر ده بمسافة كويسة") -> تلميح 3 (-30 نقطة): "موجود في البانر اللي في الكاونتر اللي فيه صور الطلبة في صورة إيد الطالبة زينة اللي اتخرجت من أول دفعة".'
  },
  'qr_e4_l2_b': {
    targetPhoto: 'target_3_eye.jpeg',
    hintPhotos: ['hint_target_3.jpeg'],
    placeDesc: 'كاونتر صور الطلبة - على صورة إيد الطالبة زينة عند علامة العين (تفريعة B)',
    hintTimeline: 'رمز العين -> تلميح بداية ونهاية اليوم الدراسي -> صورة البانر المقابل -> كاونتر صور الطلبة وإيد زينة.'
  },
  'qr_e4_l2_c': {
    targetPhoto: 'target_3_eye.jpeg',
    hintPhotos: ['hint_target_3.jpeg'],
    placeDesc: 'كاونتر صور الطلبة - على صورة إيد الطالبة زينة عند علامة العين (تفريعة C)',
    hintTimeline: 'رمز العين -> تلميح بداية ونهاية اليوم الدراسي -> صورة البانر المقابل -> كاونتر صور الطلبة وإيد زينة.'
  },
  'qr_stairs_archive': {
    targetPhoto: 'target_3_eye.jpeg',
    hintPhotos: ['hint_target_3.jpeg'],
    placeDesc: 'كاونتر صور الطلبة - علامة العين (ملصق المعلم الرئيسي)',
    hintTimeline: 'يُلصق في الكاونتر على صورة إيد الطالبة زينة المقابلة للبانر.'
  },

  // التارجيت الأصعب والأخير
  'qr_grand_hall': {
    targetPhoto: 'target_last_hardest.jpeg',
    hintPhotos: [],
    placeDesc: 'على علبة الحبارة اللي جنب باب المخزن اللي عند السلم اللي جنب مصلى الرجال (سلالم الجزء الخلفي للمدرسة)',
    hintTimeline: 'ينزل تارجيت الهدف الأصعب فقط. بعد 10 دقائق (أو -10 نقاط): "إنه جنب سلم" -> التلميح التالي: "جنب سلم من سلالم الجزء الخلفي للمدرسة" -> التلميح الأخير: "موجود على علبة الحبارة اللي جنب باب المخزن اللي عند السلم اللي جنب مصلى الرجال".'
  },

  // المعالم الأصلية الإضافية
  'qr_food_court': {
    targetPhoto: 'PXL_20261118_130004639.jpg',
    hintPhotos: [],
    placeDesc: 'الفود كورت بجانب ثلاجة المشروبات في منطقة المطاعم',
    hintTimeline: 'يُلصق بجانب ثلاجة المشروبات بالفود كورت.'
  },
  'qr_electrometer': {
    targetPhoto: 'PXL_20261118_131609366.jpg',
    hintPhotos: [],
    placeDesc: 'جدارية شركة السويدي إلكتروميتر (أرقام الإحصاء: 49 دولة و 35 مليون عداد)',
    hintTimeline: 'يُلصق على الجدارية الخاصة بإلكتروميتر.'
  },
  'qr_music_corner': {
    targetPhoto: 'PXL_20261118_130814993.jpg',
    hintPhotos: [],
    placeDesc: 'باب غرفة الموسيقى والفنون والآلات الموسيقية',
    hintTimeline: 'يُلصق على باب غرفة الموسيقى.'
  },
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
    
    const cfg = QR_TARGET_CONFIG[item.token] || {};
    const photoKey = `${item.era_id}_${item.level_number}`;
    const photoFilename = cfg.targetPhoto || photoMap[photoKey] || null;
    const hintPhotos = cfg.hintPhotos || [];
    const placeDesc = cfg.placeDesc || item.location_name || 'المبنى المدرسي';
    const hintTimeline = cfg.hintTimeline || '';
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
      placeDesc,
      hintTimeline,
      eraId: item.era_id,
      levelNum: item.level_number,
      variant: item.variant,
      qrDataUrl,
      photoFilename,
      hintPhotos,
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
      <div class="location-badge">📍 ${c.placeDesc.split('-')[0].trim()}</div>
    </div>
    <div class="card-body">
      <!-- عمود كود الـ QR -->
      <div class="qr-col">
        <div class="col-title">ملصق كود الـ QR المطلوب لصقه</div>
        <img src="${c.qrDataUrl}" alt="${c.token}" class="qr-img" />
        <div class="token-tag">رمز الملصق: <code>${c.token}</code></div>
        ${c.extractedCode ? `
        <div class="code-box">
          <span class="code-title">🔑 كود الحل عند المسح:</span>
          <span class="code-val">${c.extractedCode}</span>
        </div>` : ''}
        <div class="content-preview">${c.cleanContent}</div>
      </div>

      <!-- مؤشر سهم الربط -->
      <div class="arrow-col">
        <div class="arrow-text">يُلصق هنا</div>
        <div class="arrow-icon">👈</div>
      </div>

      <!-- عمود صور الموقع الحقيقي والتعليمات -->
      <div class="photo-col">
        <div class="spot-instructions">
          <span class="spot-title">📌 مكان اللصق الميداني الدقيق:</span>
          <p class="spot-desc">${c.placeDesc}</p>
          ${c.hintTimeline ? `<p class="hint-timeline">⏱️ <strong>آلية التلميحات الميدانية للفرق:</strong> ${c.hintTimeline}</p>` : ''}
        </div>

        <div class="photos-container">
          <div class="main-photo-wrapper">
            <div class="photo-label">📸 صورة الهدف الرئيسي (المكان المراد الوصول إليه):</div>
            ${c.photoFilename
              ? `
              <img src="/media/catalog/${c.photoFilename}" onerror="this.onerror=null; this.src='media/catalog/${c.photoFilename}';" alt="صورة الهدف الرئيسي" class="photo-img" />
              <div class="photo-meta">الملف: <code>${c.photoFilename}</code></div>`
              : `<div class="no-photo">⚠️ لا توجد صورة مرفوعة لهذا المعلم</div>`}
          </div>

          ${c.hintPhotos && c.hintPhotos.length > 0 ? `
          <div class="hints-photos-wrapper">
            <div class="photo-label">🔍 صور التلميحات المساعدة (التي تظهر للفرق تدريجياً):</div>
            <div class="hints-grid">
              ${c.hintPhotos.map((hp, i) => `
                <div class="hint-photo-item">
                  <img src="/media/catalog/${hp}" onerror="this.onerror=null; this.src='media/catalog/${hp}';" alt="صورة تلميح ${i+1}" class="hint-thumb" />
                  <div class="photo-meta">تلميح ${i+1}: <code>${hp}</code></div>
                </div>
              `).join('')}
            </div>
          </div>` : ''}
        </div>
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
    .container { max-width: 1050px; margin: 0 auto; padding: 16px; }
    .page-header { text-align: center; background: #fff; padding: 20px; border-radius: 12px; border: 2px solid #e2e8f0; margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
    .page-header p { margin: 0; font-size: 14px; color: #64748b; }
    .guide-card { background: #fff; border: 2px solid #cbd5e1; border-radius: 10px; margin-bottom: 24px; overflow: hidden; page-break-inside: avoid; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .card-header { background: #1e293b; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .num-badge { background: #475569; color: #fff; font-weight: bold; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
    .era-badge { background: #f59e0b; color: #000; font-weight: bold; font-size: 12px; padding: 2px 10px; border-radius: 4px; }
    .card-title { font-weight: bold; font-size: 14px; color: #f8fafc; }
    .location-badge { background: #334155; color: #fcd34d; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid #475569; }
    .card-body { display: flex; align-items: stretch; padding: 14px; gap: 14px; }
    .qr-col { flex: 0 0 240px; display: flex; flex-direction: column; align-items: center; text-align: center; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; }
    .col-title { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 8px; }
    .qr-img { width: 170px; height: 170px; display: block; margin: 0 auto 6px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; padding: 4px; }
    .token-tag { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .token-tag code { font-family: monospace; background: #e2e8f0; padding: 1px 6px; border-radius: 4px; color: #0f172a; font-weight: bold; }
    .code-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 6px 10px; width: 100%; margin-bottom: 6px; text-align: center; }
    .code-title { display: block; font-size: 10px; color: #065f46; font-weight: 600; }
    .code-val { font-family: monospace; font-size: 14px; font-weight: 800; color: #047857; letter-spacing: 0.5px; }
    .content-preview { font-size: 11px; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; width: 100%; text-align: center; line-height: 1.4; }
    .arrow-col { flex: 0 0 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #d97706; }
    .arrow-text { font-size: 10px; font-weight: bold; margin-bottom: 4px; }
    .arrow-icon { font-size: 22px; }
    .photo-col { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .spot-instructions { background: #fefce8; border: 1px solid #fef08a; padding: 8px 12px; border-radius: 6px; }
    .spot-title { font-weight: bold; font-size: 12px; color: #854d0e; display: block; margin-bottom: 2px; }
    .spot-desc { margin: 0; font-size: 12px; color: #713f12; font-weight: 600; }
    .hint-timeline { margin: 6px 0 0 0; font-size: 11px; color: #475569; line-height: 1.4; border-top: 1px dashed #e2e8f0; padding-top: 4px; }
    .photos-container { display: flex; gap: 10px; flex-wrap: wrap; }
    .main-photo-wrapper { flex: 1; min-width: 260px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #0f172a; }
    .hints-photos-wrapper { flex: 1; min-width: 240px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #1e293b; padding: 8px; }
    .photo-label { font-size: 10px; font-weight: bold; color: #fcd34d; background: #1e293b; padding: 5px 8px; }
    .photo-img { width: 100%; max-height: 220px; object-fit: cover; display: block; background: #0f172a; }
    .photo-meta { background: #0f172a; color: #94a3b8; font-size: 10px; padding: 4px 8px; font-family: monospace; border-top: 1px solid #334155; }
    .photo-meta code { color: #f59e0b; }
    .hints-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 6px; margin-top: 6px; }
    .hint-photo-item { border: 1px solid #475569; border-radius: 4px; overflow: hidden; background: #0f172a; }
    .hint-thumb { width: 100%; height: 110px; object-fit: cover; display: block; }
    .no-photo { height: 140px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; color: #94a3b8; font-size: 12px; }
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
      <strong style="color:#f59e0b;">مدرسة السويدي الدولية للتكنولوجيا التطبيقية</strong> • دليل تركيب ملصقات QR الميدانية المحدث
    </div>
    <button class="btn" onclick="window.print()">🖨️ طباعة الدليل الميداني الكامل (A4)</button>
  </div>

  <div class="container">
    <div class="page-header">
      <h1>دليل تركيب ملصقات الـ QR الميدانية • لغز مصر عبر الحضارات</h1>
      <p>كتالوج يوضح كل كود QR مع صور الأهداف الحقيقية وصور التلميحات المساعدة بالمدرسة • عدد الملصقات: ${cards.length}</p>
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

