// ========================================================
// lib/seedData.js - Backward-Designed Seed Data for Egypt Mystery Game
// ========================================================

async function seedIfEmpty(query, queryOne, execute) {
  const existingSettings = await queryOne('SELECT id FROM game_settings LIMIT 1');
  if (existingSettings) {
    return; // Already seeded
  }

  console.log('[Seed] Database is empty. Seeding initial mystery game content...');

  // 1. Settings
  const uiTexts = {
    title: 'سرقة ختم العصور: لغز السويدي المفقود',
    welcome: 'أهلاً بكم في تحقيق اليوم المفتوح',
    enterTeamName: 'سجّل اسم فريقك لبدء التحقيق',
    teamJoinCode: 'كود انضمام الفريق',
    submitAnswer: 'إرسال الحل',
    getHint: 'طلب تلميح',
    curseAlertTitle: 'أصابتكم لعنة المقبرة!',
    curseAlertDesc: 'اختيار خاطئ فتح بوابات زمنية جديدة. أضيفت لكم مراحل غامضة!',
    scanQR: 'مسح كود QR',
    finalAccusation: 'جلسة الاتهام النهائي',
    leaderboard: 'لوحة الشرف والترتيب المباشر',
  };

  await execute(
    `INSERT INTO game_settings (
      id, game_title, game_theme, intro_story_html, crime_description, final_truth_html,
      status, levels_per_path, max_curses, path_assignment_mode, only_leader_submits,
      curse_requires_guardian, base_points_per_level, first_attempt_bonus, no_hint_bonus,
      hint1_penalty, hint2_penalty, curse_penalty, wrong_attempt_penalty,
      max_wrong_before_lockout, lockout_seconds, ui_texts_json, admin_password_hash, updated_at
    ) VALUES (
      1, 'سرقة ختم العصور: لغز السويدي المفقود', 'مصر عبر الحضارات',
      '<p>في صباح هذا اليوم، وأثناء تجهيز معرض الحضارات في مدرسة السويدي، اختفت القطعة الأثرية المركزية (ختم العصور) من خزينة الأرشيف! لم تكن سرقة عادية، بل مخطط غامض تركه حماة المعرفة عبر العصور الأربعة ليختبروا ذكاء طلاب المدرسة.</p>',
      'تم نقل القطعة عمداً وإخفاؤها في مكان سري بالمدرسة، وقسمت الحقيقة إلى 4 أسرار موزعة بين الحضارات الأربع. لن يعرف السر الكامل فريق بمفرده!',
      '<p>الحقيقة الكبرى: القطعة لم تُسرق لتضيع، بل قام المهندس زياد ومستر حاتم بإخفائها داخل القاعة الكبرى تحت منصة العرض لحمايتها من التلف أثناء أعمال التجديد، وتركوا الألغاز الأربعين لإثبات أن المعرفة المشتركة بين الفراعنة والإغريق والمسلمين والعصر الحديث هي القوة الحقيقية لمدرسة السويدي!</p>',
      'RUNNING', 10, 2, 'ROUND_ROBIN', 0, 0, 100, 20, 30, 15, 30, 25, 5, 5, 30, ?, 'sewedy2026', datetime('now')
    )`,
    [JSON.stringify(uiTexts)]
  );

  // 2. Paths (4 Eras)
  const pathsData = [
    {
      id: 1,
      slug: 'origin',
      name: 'سجل البداية: الحضارة الفرعونية',
      era: 'pharaonic',
      color: '#d4af37',
      icon: 'pyramid',
      intro_text: 'أنتم تبحثون في أصل السر ولماذا تم تقسيم المعرفة إلى أربعة أختام في عهد الفراعنة.',
      destination_curse_path_id: 2,
      sort_order: 1,
    },
    {
      id: 2,
      slug: 'method',
      name: 'سجل الآلية: العصر اليوناني والروماني',
      era: 'greco_roman',
      color: '#8b5cf6',
      icon: 'scroll',
      intro_text: 'أنتم تبحثون في الكيفية الرياضية والهندسية التي استخدمت لنقل الأثر دون أن يلاحظ أحد.',
      destination_curse_path_id: 3,
      sort_order: 2,
    },
    {
      id: 3,
      slug: 'motive',
      name: 'سجل الدافع: الحضارة الإسلامية',
      era: 'islamic',
      color: '#10b981',
      icon: 'compass',
      intro_text: 'أنتم تبحثون في الرسالة والغاية النبيلة والدافع الحقيقي وراء نقل القطعة.',
      destination_curse_path_id: 4,
      sort_order: 3,
    },
    {
      id: 4,
      slug: 'truth',
      name: 'سجل الحقيقة: العصر الحديث والتكنولوجيا',
      era: 'modern',
      color: '#38bdf8',
      icon: 'cpu',
      intro_text: 'أنتم تبحثون في الكاميرات الرقمية، هوية الشخص المسؤول، ومكان الأثر الحالي.',
      destination_curse_path_id: 1,
      sort_order: 4,
    },
  ];

  for (const p of pathsData) {
    await execute(
      `INSERT INTO paths (id, slug, name, era, color, icon, intro_text, destination_curse_path_id, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [p.id, p.slug, p.name, p.era, p.color, p.icon, p.intro_text, p.destination_curse_path_id, p.sort_order]
    );

    // Variants A & B
    await execute(`INSERT INTO route_variants (path_id, code, name) VALUES (?, 'A', 'التفريعة (أ)')`, [p.id]);
    await execute(`INSERT INTO route_variants (path_id, code, name) VALUES (?, 'B', 'التفريعة (ب)')`, [p.id]);
  }

  // 3. Clue Categories
  const categories = [
    { name: 'qr', label_ar: 'كيو آر كود (QR)', icon: 'qr-code', color: '#f59e0b', description: 'مسح كود مشفر في مكان محدد' },
    { name: 'booth', label_ar: 'تحدي البوث الخارجي', icon: 'gamepad-2', color: '#ec4899', description: 'لعب لعبة بالملعب للحصول على الكود' },
    { name: 'pattern', label_ar: 'باترن وكوتس الحائط', icon: 'palette', color: '#8b5cf6', description: 'فك شيفرة من عبارة أو رسم جداري' },
    { name: 'graffiti', label_ar: 'جرافيتي المدرسة', icon: 'brush', color: '#06b6d4', description: 'استنتاج دليل من جدارية فنية' },
    { name: 'person', label_ar: 'شخصية بالمدرسة (Staff)', icon: 'user-check', color: '#10b981', description: 'سؤال مدرس أو مهندس عن معلومة محددة' },
    { name: 'stairs', label_ar: 'كوتس درجات السلالم', icon: 'trending-up', color: '#eab308', description: 'عد أو تجميع كلمات من سلالم المدرسة' },
    { name: 'counting', label_ar: 'عد الأشياء الفيزيائية', icon: 'hash', color: '#6366f1', description: 'حساب عدد المكيفات أو الشاشات أو المقاعد' },
    { name: 'video', label_ar: 'فيديو كاميرات المراقبة (AI)', icon: 'video', color: '#ef4444', description: 'فيديو رقمي يعرض دليلاً مسجلاً' },
    { name: 'challenge', label_ar: 'تحدي مرح مباشر', icon: 'zap', color: '#f97316', description: 'تنفيذ مهمة مع حارس المحطة' },
    { name: 'rosetta', label_ar: 'شيفرة حجر رشيد', icon: 'file-text', color: '#d97706', description: 'استخدام جدول فك الرموز القديمة' },
    { name: 'prop', label_ar: 'دليل مادي فيزيائي (Prop)', icon: 'package', color: '#14b8a6', description: 'صندوق مقفل أو ظرف مختوم' },
  ];

  for (const c of categories) {
    await execute(
      `INSERT INTO clue_categories (name, label_ar, icon, color, description) VALUES (?, ?, ?, ?, ?)`,
      [c.name, c.label_ar, c.icon, c.color, c.description]
    );
  }

  // 4. Locations
  const locations = [
    { id: 1, name: 'فصل 1/1 (مبنى أ)', zone: 'مبنى أ - الدور الأول', notes: 'يحتوي على 4 تكييفات وشاشتين تفاعليتين' },
    { id: 2, name: 'فصل 2/3 (مبنى ب)', zone: 'مبنى ب - الدور الثاني', notes: 'غرفة لعنة محتملة وحارس المقبرة' },
    { id: 3, name: 'سلالم الدور الأول (كوتس منع التنمر)', zone: 'السلالم المركزية', notes: 'الدرجة الخامسة عليها عبارة التسامح' },
    { id: 4, name: 'سلالم الدور الثاني (كوتس الدعم النفسي)', zone: 'السلالم الشرقية', notes: 'الدرجة السابعة عليها كوت النجاح' },
    { id: 5, name: 'القاعة الكبرى (المسرح الرئيسي)', zone: 'المسرح', notes: 'موقع المعرض وشاشة العرض الكبرى' },
    { id: 6, name: 'معمل الروبوتكس والذكاء الاصطناعي', zone: 'مبنى التكنولوجيا', notes: 'يوجد به جهاز حاسوب المراقبة' },
    { id: 7, name: 'الملعب الخارجي - بوث الفراعنة', zone: 'الملاعب الخارجية', notes: 'لعبة الرماية الفرعونية' },
    { id: 8, name: 'الملعب الخارجي - بوث الأرينا الإغريقية', zone: 'الملاعب الخارجية', notes: 'تحدي بازل المتاهة اليونانية' },
    { id: 9, name: 'مكتب الإدارة والمهندسين', zone: 'المبنى الإداري', notes: 'تواجد المستشار والمدرسين القدامى' },
    { id: 10, name: 'ممر جداريات الحضارات', zone: 'الممر الشرقي', notes: 'جرافيتي الفراعنة والخط العربي' },
  ];

  for (const l of locations) {
    await execute(
      `INSERT INTO locations (id, name, zone, notes, is_active) VALUES (?, ?, ?, ?, 1)`,
      [l.id, l.name, l.zone, l.notes]
    );
  }

  // 5. Staff and Stations
  const staff = [
    {
      id: 1,
      type: 'PERSON',
      name: 'مستر حاتم (كبير الكهنة)',
      role_title: 'مدرس الفيزياء والمستشار التعليمي',
      location_id: 9,
      pin_code: '1001',
      persona_description: 'شخصية حكيمة غامضة تتحدث بألغاز عن الطاقة والأختام القديمة.',
      instructions_what_to_say: 'قول لهم: البردية لم تحترق، بل اختبأت تحت أول حرف من كلمة النور!',
      challenge_description: 'اطلب من الفريق قول بيتي شعر أو حكمة عن العلم قبل إعطائهم الكود.',
      handout_code: 'HORUS-88',
    },
    {
      id: 2,
      type: 'PERSON',
      name: 'المهندس كريم (فيلسوف الإغريق)',
      role_title: 'مهندس الميكانيكا والأنشطة',
      location_id: 8,
      pin_code: '1002',
      persona_description: 'يتحدث بمنطق أرسطو وحسابات فيثاغورس.',
      instructions_what_to_say: 'الآلية تعتمد على الروافع الهيدروليكية، والزاوية كانت 45 درجة!',
      challenge_description: 'حل لغز رياضي سريع: 7 × 8 + 14.',
      handout_code: 'ARCHI-70',
    },
    {
      id: 3,
      type: 'PERSON',
      name: 'مستر طارق (الرحالة والفقيه)',
      role_title: 'مسؤول شؤون الطلاب والأنشطة',
      location_id: 5,
      pin_code: '1003',
      persona_description: 'يتحدث باعتزاز عن مكتبة بغداد ودافع حماية العلوم.',
      instructions_what_to_say: 'الدافع هو الأمانة، والغاية نبيلة تعلو فوق الشكوك!',
      challenge_description: 'تحدي الوقوف بصمت وهدوء تام لمدة 30 ثانية بدون أي ابتسامة.',
      handout_code: 'HIKMA-99',
    },
    {
      id: 4,
      type: 'PERSON',
      name: 'المهندس زياد (المخترع الحديث)',
      role_title: 'مسؤول معامل الذكاء الاصطناعي',
      location_id: 6,
      pin_code: '1004',
      persona_description: 'خبير التكنولوجيا الذي يعرف أين سجلت كاميرات المراقبة الحقيقة.',
      instructions_what_to_say: 'لقد سجل السيرفر المركزي توقيت الدخول في تمام 06:45 صباحاً!',
      challenge_description: 'تخمين نوع المستشعر المستخدم في قفل الخزينة.',
      handout_code: 'CYBER-42',
    },
    {
      id: 5,
      type: 'GUARDIAN',
      name: 'حارس المقبرة الفرعونية (فصل 1/1)',
      role_title: 'حارس المحطة الأولى',
      location_id: 1,
      pin_code: '4191',
      persona_description: 'يرتدي قناعاً فرعونياً ويقف أمام باب الفصل مانعاً غير المصرح لهم.',
      instructions_what_to_say: 'إذا أصابتكم اللعنة، عليكم أداء قسم الفراعنة بصوت مسموع!',
      challenge_description: 'تحية حورس الفرعونية باليد اليمنى.',
      handout_code: 'TOMB-11',
    },
    {
      id: 6,
      type: 'GUARDIAN',
      name: 'حارس سرداب روما (فصل 2/3)',
      role_title: 'حارس المحطة الملعونة',
      location_id: 2,
      pin_code: '4192',
      persona_description: 'حارس البوابة التي تحتوي على الاختيار الخاطئ والمصيدة.',
      instructions_what_to_say: 'لقد دنستم السرداب المحرم! احملوا أختام اللعنة وانتقلوا للحضارة التالية!',
      challenge_description: 'مسح الكود التأكيدي للعنة.',
      handout_code: 'CURSE-PASS',
    },
    {
      id: 7,
      type: 'BOOTH',
      name: 'بوث رماية حورس الفرعونية',
      role_title: 'الملعب الخارجي - محطة 1',
      location_id: 7,
      pin_code: '5001',
      persona_description: 'لعبة إصابة الهدف الفرعوني للحصول على رقم السر.',
      instructions_what_to_say: 'إصابة هدفين تمنحكم كود البردية.',
      challenge_description: 'إصابة الهدف بالقوس والسهم أو الكرة.',
      handout_code: 'ARROW-15',
    },
    {
      id: 8,
      type: 'BOOTH',
      name: 'بوث ميزان العدالة الإغريقي',
      role_title: 'الملعب الخارجي - محطة 2',
      location_id: 8,
      pin_code: '5002',
      persona_description: 'لعبة موازنة الأثقال لاكتشاف الرقم المفقود.',
      instructions_what_to_say: 'التوازن هو سر الحقيقة.',
      challenge_description: 'موازنة كفتي الميزان باستخدام 3 أوزان مختلفة.',
      handout_code: 'SCALE-33',
    },
  ];

  for (const s of staff) {
    await execute(
      `INSERT INTO staff_and_stations (
        id, type, name, role_title, location_id, pin_code, persona_description,
        instructions_what_to_say, challenge_description, handout_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.type, s.name, s.role_title, s.location_id, s.pin_code,
        s.persona_description, s.instructions_what_to_say, s.challenge_description, s.handout_code,
      ]
    );
  }

  // 6. QR Codes
  const qrCodes = [
    { id: 'qr_ph_start', label: 'كيو آر مدخل بهو الفراعنة (مبنى أ)', location_id: 1, notes: 'نقطة البداية لمسار الأصل' },
    { id: 'qr_gr_start', label: 'كيو آر بوث الأرينا اليونانية', location_id: 8, notes: 'نقطة البداية لمسار الآلية' },
    { id: 'qr_is_start', label: 'كيو آر قاعة المسرح المركزية', location_id: 5, notes: 'نقطة البداية لمسار الدافع' },
    { id: 'qr_mo_start', label: 'كيو آر مدخل معمل الروبوتكس', location_id: 6, notes: 'نقطة البداية لمسار الحقيقة' },
    { id: 'qr_stairs_quotes', label: 'كيو آر ملصق سلم الدور الثاني', location_id: 4, notes: 'كشف لغز درجات السلم' },
    { id: 'qr_counting_room', label: 'كيو آر حائط فصل 1/1', location_id: 1, notes: 'معادلة عدد الأجهزة' },
    { id: 'qr_graffiti_mural', label: 'كيو آر لوحة جدارية ممر الفنون', location_id: 10, notes: 'فك الرمز السري للجدارية' },
    { id: 'qr_curse_trap_23', label: 'كيو آر فخ المقبرة المحرمة (فصل 2/3)', location_id: 2, notes: 'كود فخ يُصيب الفريق باللعنة!' },
    { id: 'qr_cctv_footage', label: 'كيو آر تسجيل الكاميرا الخفية AI', location_id: 6, notes: 'رابط فيديو المراقبة' },
    { id: 'qr_rosetta_cipher', label: 'كيو آر لوحة فك شيفرة حجر رشيد', location_id: 5, notes: 'جدول الرموز' },
  ];

  for (const q of qrCodes) {
    await execute(
      `INSERT INTO qr_codes (id, label, location_id, notes) VALUES (?, ?, ?, ?)`,
      [q.id, q.label, q.location_id, q.notes]
    );
  }

  // 7. QR Mappings (Who sees what)
  const qrMappings = [
    {
      qr_code_id: 'qr_ph_start',
      path_id: 1,
      level_number: 1,
      variant_id: null,
      is_curse_trap: 0,
      content_html: '<h3>النقش الأول - بردية التحنيط</h3><p>كتب الكاهن الأعظم: "لن تُفتح بوابة الحكمة إلا لمن يحصي أركان الراحة في قاعة البداية". الرمز السري هو: <strong>ANUBIS</strong></p>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_gr_start',
      path_id: 2,
      level_number: 1,
      variant_id: null,
      is_curse_trap: 0,
      content_html: '<h3>مخطوطة أرسطو</h3><p>لغز الفلاسفة: "الكل أعظم من مجموع الأجزاء. كلمتكم السرية هي رمز الحكمة الإغريقية: <strong>ATHENA</strong>"</p>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_is_start',
      path_id: 3,
      level_number: 1,
      variant_id: null,
      is_curse_trap: 0,
      content_html: '<h3>رسالة دار الحكمة</h3><p>كتب ابن الهيثم: "الضوء ينبعث من الأمانة، والغاية صيانة العلم". كودكم هو: <strong>BASRA</strong></p>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_mo_start',
      path_id: 4,
      level_number: 1,
      variant_id: null,
      is_curse_trap: 0,
      content_html: '<h3>سجل الدخول الرقمي</h3><p>تم التقاط حركة عند باب الأرشيف الساعة 06:45 صباحاً. الرمز المشفر للشبكة: <strong>PORT443</strong></p>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_curse_trap_23',
      path_id: 2,
      level_number: 3,
      variant_id: null,
      is_curse_trap: 1, // Curse trap!
      content_html: '<div style="color:red; font-weight:bold;">لقد قمت بمسح كود المقبرة المحرمة! فتحتم بوابة الموتى وأصابتكم لعنة الفراعنة!</div>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_curse_trap_23',
      path_id: 1,
      level_number: 3,
      variant_id: null,
      is_curse_trap: 1, // Curse trap!
      content_html: '<div style="color:red; font-weight:bold;">لقد اخترتم المفتاح الخاطئ! لعنة الفراعنة تصيبكم الآن!</div>',
      auto_complete_level: 0,
    },
    {
      qr_code_id: 'qr_stairs_quotes',
      path_id: 1,
      level_number: 5,
      variant_id: null,
      is_curse_trap: 0,
      content_html: '<p>ابحثوا في الدرجة رقم 7 من سلم الدعم النفسي عن الحرف الثالث في الكلمة الأخيرة. الكود هو: <strong>STEP7</strong></p>',
      auto_complete_level: 0,
    },
  ];

  for (const m of qrMappings) {
    await execute(
      `INSERT INTO qr_mappings (qr_code_id, path_id, level_number, variant_id, is_curse_trap, content_html, auto_complete_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m.qr_code_id, m.path_id, m.level_number, m.variant_id, m.is_curse_trap, m.content_html, m.auto_complete_level]
    );
  }

  // 8. Forty Levels Matrix (10 per path, backward designed towards level 10)
  // Path 1: Origin
  const path1Levels = [
    {
      num: 1,
      title: 'النقش الأول في بهو الأهرام',
      role: 'Discovery',
      story: 'وجدتم ورقة بردي مقطوعة عند مدخل المدرسة تحوي رموزاً هيروغليفية تشير إلى كود QR مخفي قرب بهو الفراعنة.',
      clueBlocks: [{ category: 'qr', text: 'امسحوا الكيو آر كود الموجود في بهو الفراعنة (مبنى أ) للحصول على كود البداية.' }],
      locationId: 1,
      answerTypes: ['TEXT'],
      validAnswers: ['ANUBIS', 'انوبيس'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'الكود معلق بجانب لوحة الفصل 1/1.' }, { hint_number: 2, cost: 30, text: 'الكلمة المطلوبة هي اسم حارس المقابر بالإنجليزية: ANUBIS' }],
    },
    {
      num: 2,
      title: 'شهادة كبير الكهنة',
      role: 'Investigation',
      story: 'النقش يشير إلى شخص يحمل رتبة "كبير الكهنة" في المدرسة ويحفظ أسرار الطاقة والفيزياء.',
      clueBlocks: [{ category: 'person', text: 'توجهوا إلى مستر حاتم (كبير الكهنة) في مكتب الإدارة ونفذوا التحدي المطلوب للحصول على كود البردية.' }],
      locationId: 9,
      stationId: 1,
      answerTypes: ['ORGANIZER_CODE', 'TEXT'],
      validAnswers: ['HORUS-88', 'HORUS88', 'حورس 88'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'مستر حاتم متواجد في مكتب الإدارة.' }, { hint_number: 2, cost: 30, text: 'الكود يبدأ بـ HORUS.' }],
    },
    {
      num: 3,
      title: 'الأبواب الثلاثة ومصيدة الفراعنة',
      role: 'Investigation',
      story: 'وصلتم إلى ممر يحتوي على 3 غرف، واحدة فقط تحوي رمز الحقيقة، واثنتان مسحورتان بلعنة المقبرة!',
      clueBlocks: [{ category: 'prop', text: 'أمامكم ثلاثة خيارات لفتح تابوت المعرفة، اختاروا بحذر شديد؛ فاختيار الباب الملعون سيطلق لعنة المقبرة!' }],
      locationId: 2,
      answerTypes: ['MULTIPLE_CHOICE'],
      multipleChoice: [
        { text: 'باب الشمس المشرقة (رمز رع)', is_curse: false, is_correct: true },
        { text: 'باب الموتى المحرم (رمز التابوت الأسود)', is_curse: true, is_correct: false },
        { text: 'باب الذهب السريع (المفتاح المباشر)', is_curse: true, is_correct: false },
      ],
      validAnswers: ['باب الشمس المشرقة (رمز رع)', 'رع', 'RA'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'الفراعنة كانوا يقدسون النور والشمس، تجنبوا الأبواب المغرية المظلمة!' }],
    },
    {
      num: 4,
      title: 'أرقام حورس الصامتة',
      role: 'Verification',
      story: 'في قاعة 1/1 ترك السارق معادلة تعتمد على عدد الأجهزة الكهربائية المعلقة.',
      clueBlocks: [{ category: 'counting', text: 'ادخلوا فصل 1/1 واحسبوا: (عدد التكييفات × 10) + عدد الشاشات المعلقة.' }],
      locationId: 1,
      answerTypes: ['PIN', 'NUMERIC'],
      validAnswers: ['42'], // 4 ACs * 10 + 2 screens = 42
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'يوجد 4 مكيفات وشاشتان.' }, { hint_number: 2, cost: 30, text: 'المعادلة: 4 * 10 + 2 = 42.' }],
    },
    {
      num: 5,
      title: 'سلم الحكمة الملكية',
      role: 'Verification',
      story: 'على سلالم المدرسة، ترك حماة المعرفة كلمات إلهام. هناك سر مدفون في الدرجات.',
      clueBlocks: [{ category: 'stairs', text: 'توجهوا لسلم الدور الثاني (كوتس الدعم النفسي)، اقرؤوا الدرجة السابعة واكتبوا الكلمة الأولى منها.' }],
      locationId: 4,
      answerTypes: ['TEXT'],
      validAnswers: ['النجاح', 'نجاح', 'SUCCESS'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'الدرجة السابعة تبدأ بكلمة عن التفوق.' }],
    },
    {
      num: 6,
      title: 'تحدي رماية حورس بالملعب',
      role: 'New Evidence',
      story: 'لفتح ختم العصر، عليكم اختبار مهارتكم في التصويب في بوث الفراعنة بالملعب.',
      clueBlocks: [{ category: 'booth', text: 'توجهوا إلى بوث الفراعنة بالملعب وأصيبوا الهدفين للحصول على كود المحطة.' }],
      locationId: 7,
      stationId: 7,
      answerTypes: ['ORGANIZER_CODE'],
      validAnswers: ['ARROW-15', 'ARROW15'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'الكود مع منظم بوث الرماية بالملعب الخارجي.' }],
    },
    {
      num: 7,
      title: 'شيفرة حجر رشيد المفقودة',
      role: 'New Evidence',
      story: 'عثرتم على نص مشفر برموز يونانية وهيروغليفية يتطلب فك الشيفرة باستخدام جدول رشيد.',
      clueBlocks: [{ category: 'rosetta', text: 'استخدموا جدول فك الرموز لترجمة: [رمز المفتاح + رمز الصقر + رمز العين] = 3 أرقام.' }],
      locationId: 5,
      answerTypes: ['PIN'],
      validAnswers: ['714'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'رمز المفتاح = 7، الصقر = 1، العين = 4.' }],
    },
    {
      num: 8,
      title: 'جدارية ممر الفنون',
      role: 'Analysis',
      story: 'في ممر جداريات الحضارات، هناك تفصيلة غريبة رُسمت حديثاً على جدارية النيل.',
      clueBlocks: [{ category: 'graffiti', text: 'افحصوا جدارية الفراعنة وابحثوا عن الرمز المكتوب بلون أحمر صغير قرب ضفة النهر.' }],
      locationId: 10,
      answerTypes: ['TEXT'],
      validAnswers: ['DELTA', 'دلتا'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'الرمز هو كلمة إنجليزية مكونة من 5 أحرف تعبر عن مصب النيل.' }],
    },
    {
      num: 9,
      title: 'تسجيل الفيديو القديم',
      role: 'Final Preparation',
      story: 'تم العثور على تسجيل أرشيفي مسرب على شاشة معمل الروبوتكس يوضح تحرك أحد المنظمين.',
      clueBlocks: [{ category: 'video', text: 'شاهدوا الفيديو المسجل واكتشفوا لون الصندوق الذي نُقلت به البردية.' }],
      locationId: 6,
      answerTypes: ['TEXT'],
      validAnswers: ['ذهبي', 'اصفر', 'GOLD'],
      points: 100,
      hints: [{ hint_number: 1, cost: 15, text: 'اللون براق ملكي فرعوني.' }],
    },
    {
      num: 10,
      title: 'كشف سجل الأصل (The Origin Fragment)',
      role: 'Final Fragment',
      story: 'اكتملت أدلة الأصل! لقد فهمتم لماذا تم تقسيم الأثر: البردية الأصلية كُتبت في عهد الملك خوفو لتحذير الأجيال من تفرق المعرفة، والهدف هو حمايتها من الضياع!',
      clueBlocks: [{ category: 'prop', text: 'اكتبوا عبارة الختم الفرعوني النهائي: "حماية المعرفة أصل الخلود".' }],
      locationId: 5,
      answerTypes: ['TEXT'],
      validAnswers: ['حماية المعرفة اصل الخلود', 'حمايه المعرفه اصل الخلود'],
      points: 200,
      hints: [{ hint_number: 1, cost: 20, text: 'العبارة مكتوبة في نص القصة بالأعلى تماماً.' }],
    },
  ];

  // Helper to insert a path's 10 levels
  async function insertLevels(pathId, levelsList) {
    for (const lvl of levelsList) {
      await execute(
        `INSERT INTO levels (
          path_id, level_number, title, story_role, story_text, clue_blocks_json,
          location_id, linked_station_id, answer_types_json, valid_answers_json,
          multiple_choice_options_json, points, hints_json, cursed_entry_variant_text,
          organizer_notes, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pathId,
          lvl.num,
          lvl.title,
          lvl.role,
          lvl.story,
          JSON.stringify(lvl.clueBlocks || []),
          lvl.locationId || 1,
          lvl.stationId || null,
          JSON.stringify(lvl.answerTypes || ['TEXT']),
          JSON.stringify(lvl.validAnswers || []),
          lvl.multipleChoice ? JSON.stringify(lvl.multipleChoice) : null,
          lvl.points || 100,
          JSON.stringify(lvl.hints || []),
          lvl.cursedEntry || 'لقد عبرتم بوابات المقبرة المظلمة لتصلوا إلى هذا الدليل في زمن آخر!',
          'جاهز للتشغيل',
          lvl.num,
        ]
      );
    }
  }

  await insertLevels(1, path1Levels);

  // Path 2: Method (Greek & Roman)
  const path2Levels = [
    { num: 1, title: 'سؤال الفيلسوف الإغريقي', role: 'Discovery', story: 'وجدتم ورقة بردي إغريقية تطرح أحجية منطقية عند بوث الأرينا.', clueBlocks: [{ category: 'qr', text: 'امسحوا QR بوث الأرينا للحصول على سؤال الفيلسوف.' }], locationId: 8, answerTypes: ['TEXT'], validAnswers: ['ATHENA', 'اثينا'], points: 100 },
    { num: 2, title: 'شهادة المهندس الروماني', role: 'Investigation', story: 'المهندس كريم يحمل تصميم الرافعة الهيدروليكية التي استخدمت في نقل القطعة.', clueBlocks: [{ category: 'person', text: 'استجوبوا المهندس كريم في بوث الأرينا واطلبوا منه كود الرافعة.' }], locationId: 8, stationId: 2, answerTypes: ['ORGANIZER_CODE'], validAnswers: ['ARCHI-70', 'ARCHI70'], points: 100 },
    { num: 3, title: 'متاهة المينوتور (فخ اللعنة)', role: 'Investigation', story: 'دخلتم متاهة من الأدلة في فصل 2/3، هناك ممر آمن وممران يجلبان غضب الآلهة!', clueBlocks: [{ category: 'prop', text: 'اختاروا المسار الصحيح للمرور من المتاهة دون إيقاظ لعنة المقبرة.' }], locationId: 2, answerTypes: ['MULTIPLE_CHOICE'], multipleChoice: [{ text: 'مسار خيط أريادني الذهبي (الأمان)', is_curse: false, is_correct: true }, { text: 'سرداب التنين المحرم (فخ)', is_curse: true, is_correct: false }, { text: 'بوابة الذهب الزائف (فخ)', is_curse: true, is_correct: false }], validAnswers: ['مسار خيط أريادني الذهبي (الأمان)'], points: 100 },
    { num: 4, title: 'معادلة فيثاغورس الميدانية', role: 'Verification', story: 'ترك السارق معادلة رياضية تعتمد على درجات السلالم والمقاعد.', clueBlocks: [{ category: 'counting', text: 'اجمعوا (عدد المقاعد في الصف الأول بالقاعة الكبرى) + 15.' }], locationId: 5, answerTypes: ['PIN'], validAnswers: ['25', '30'], points: 100 },
    { num: 5, title: 'أرينا التحدي الإغريقي', role: 'Verification', story: 'تحدي توازن الأوزان في بوث الملاعب لاكتشاف آلية الرفع.', clueBlocks: [{ category: 'booth', text: 'قوموا بموازنة كفتي الميزان في بوث الملاعب للحصول على الكود.' }], locationId: 8, stationId: 8, answerTypes: ['ORGANIZER_CODE'], validAnswers: ['SCALE-33', 'SCALE33'], points: 100 },
    { num: 6, title: 'الإحداثيات المفقودة', role: 'New Evidence', story: 'خريطة المدرسة عليها زوايا هندسية تشير إلى زاوية نقل القطعة.', clueBlocks: [{ category: 'pattern', text: 'الزاوية الهندسية المشفرة في رسمة الحائط بالقاعة هي: 45 درجة. أدخلوا الرقم فقط.' }], locationId: 5, answerTypes: ['PIN'], validAnswers: ['45'], points: 100 },
    { num: 7, title: 'شهادات أعضاء مجلس الشيوخ', role: 'New Evidence', story: 'هناك تضارب بين 3 شهادات، واحدة فقط صحيحة تثبت وقت النقل.', clueBlocks: [{ category: 'prop', text: 'الوقت الصحيح للنقل كان: قبل طابور الصباح بساعة ونصف.' }], locationId: 9, answerTypes: ['TEXT'], validAnswers: ['قبل طابور الصباح', '06:30', '6:30'], points: 100 },
    { num: 8, title: 'النمط المكسور في الجدارية', role: 'Analysis', story: 'في جدارية ممر الفنون الرومانية، تم مسح رقم من درع المحارب.', clueBlocks: [{ category: 'graffiti', text: 'افحصوا الدرع الروماني واكتبوا الرقم الروماني المتبقي (X أو V).' }], locationId: 10, answerTypes: ['TEXT'], validAnswers: ['X', '10'], points: 100 },
    { num: 9, title: 'تسجيل تجربة الإزاحة', role: 'Final Preparation', story: 'شاهدوا فيديو محاكاة آلية الحركة وكيف تم دحرجة الصندوق على بكرات ملساء.', clueBlocks: [{ category: 'video', text: 'ما هي الوسيلة التي وضعت تحت الصندوق لمنع إحداث صوت أثناء النقل؟' }], locationId: 6, answerTypes: ['TEXT'], validAnswers: ['عجلات', 'بكرات', 'سجاد', 'رول'], points: 100 },
    { num: 10, title: 'كشف سجل الآلية (The Method Fragment)', role: 'Final Fragment', story: 'اكتملت حقيقة الآلية! تم نقل القطعة باستخدام عربة أدوات الصيانة المغطاة بقماش معتم في تمام 06:30 صباحاً دون كسر أي قفل لأن المفتاح كان أصلياً!', clueBlocks: [{ category: 'prop', text: 'اكتبوا عبارة ختم الآلية النهائي: "الآلية الذكية تحرك الجبال بلا ضجيج".' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['الالية الذكية تحرك الجبال بلا ضجيج', 'الاليه الذكيه تحرك الجبال بلا ضجيج'], points: 200 },
  ];
  await insertLevels(2, path2Levels);

  // Path 3: Motive (Islamic Civilization)
  const path3Levels = [
    { num: 1, title: 'مخطوطة بيت الحكمة', role: 'Discovery', story: 'رسالة مكتوبة بخط الرقعة تشير إلى أن الهدف ليس الطمع بل الحفظ.', clueBlocks: [{ category: 'qr', text: 'امسحوا QR قاعة المسرح للحصول على مطلع الرسالة.' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['BASRA', 'البصرة', 'بصرة'], points: 100 },
    { num: 2, title: 'لغز الأسطرلاب الفلكي', role: 'Investigation', story: 'الأسطرلاب المعلق في المعرض يشير إلى وقت وموقع الكوكب.', clueBlocks: [{ category: 'pattern', text: 'احسبوا الزاوية الفلكية لكوكب المشتري المكتوبة بالأسطرلاب.' }], locationId: 5, answerTypes: ['PIN'], validAnswers: ['90', '180'], points: 100 },
    { num: 3, title: 'مجلس الاختيار والامتحان', role: 'Investigation', story: 'أمامكم رسالتان مشفرتان في فصل 2/3، رسالة الأمانة ورسالة الطمع!', clueBlocks: [{ category: 'prop', text: 'اختاروا الرسالة التي تمثل روح الحضارة الإسلامية لتفادي اللعنة.' }], locationId: 2, answerTypes: ['MULTIPLE_CHOICE'], multipleChoice: [{ text: 'رسالة حفظ الأمانة والعلم (طريق الحق)', is_curse: false, is_correct: true }, { text: 'رسالة الكنز السريع (فخ اللعنة)', is_curse: true, is_correct: false }, { text: 'رسالة الشهرة والتباهي (فخ اللعنة)', is_curse: true, is_correct: false }], validAnswers: ['رسالة حفظ الأمانة والعلم (طريق الحق)'], points: 100 },
    { num: 4, title: 'لقاء الرحالة والوكيل', role: 'Verification', story: 'مستر طارق يحفظ في سجلاته الرسالة السرية لدافع نقل الأثر.', clueBlocks: [{ category: 'person', text: 'قابلوا مستر طارق في المسرح ونفذوا تحدي الهدوء للحصول على كود الحكمة.' }], locationId: 5, stationId: 3, answerTypes: ['ORGANIZER_CODE'], validAnswers: ['HIKMA-99', 'HIKMA99', 'حكمة 99'], points: 100 },
    { num: 5, title: 'النمط الهندسي الإسلامي', role: 'Verification', story: 'في لوحة الزخرفة الإسلامية، كم عدد أضلاع النجمة المركزية؟', clueBlocks: [{ category: 'pattern', text: 'عدوا أضلاع النجمة الإسلامية المرسومة في بهو الإدارة.' }], locationId: 9, answerTypes: ['PIN'], validAnswers: ['8', 'ثمانية'], points: 100 },
    { num: 6, title: 'معادلة الخوارزمي', role: 'New Evidence', story: 'حل معادلة جبرية بسيطة تركها السارق: س + 25 = 100.', clueBlocks: [{ category: 'counting', text: 'قيمة س هي الكود المطلوب.' }], locationId: 1, answerTypes: ['PIN'], validAnswers: ['75'], points: 100 },
    { num: 7, title: 'سلم مكارم الأخلاق', role: 'New Evidence', story: 'ابحثوا في سلالم الدور الأرضي عن كوت منع التنمر، واكتبوا الكلمة المكتوبة باللون الأخضر.', clueBlocks: [{ category: 'stairs', text: 'الكلمة الخضراء في سلم الدور الأرضي.' }], locationId: 3, answerTypes: ['TEXT'], validAnswers: ['احترام', 'الاحترام', 'RESPECT'], points: 100 },
    { num: 8, title: 'المخطوطة الممزقة', role: 'Analysis', story: 'جمعوا نصين ممزقين تم العثور عليهما قرب المكتبة لإكمال بيت الشعر.', clueBlocks: [{ category: 'prop', text: 'العلم يرفع بيتاً لا عماد له، و... يهدم بيت العز والشرف.' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['الجهل', 'جهل'], points: 100 },
    { num: 9, title: 'فيديو وصية العلماء', role: 'Final Preparation', story: 'تسجيل مرئي للعلماء يؤكد أن الصيانة القادمة للمبنى كانت ستعرض الأثر للخطر.', clueBlocks: [{ category: 'video', text: 'السبب المذكور في الفيديو هو: (تجديد القاعة / أعمال الدهان / ضياع الأثر).' }], locationId: 6, answerTypes: ['TEXT'], validAnswers: ['تجديد القاعة', 'تجديد', 'صيانة'], points: 100 },
    { num: 10, title: 'كشف سجل الدافع (The Motive Fragment)', role: 'Final Fragment', story: 'اكتملت حقيقة الدافع! لم تكن هناك أي نية سيئة؛ بل تقرر نقل الأثر لحمايته من أعمال الترميم والصيانة بالقاعة الكبرى وتجهيز مفاجأة للطلاب في الختام!', clueBlocks: [{ category: 'prop', text: 'اكتبوا عبارة ختم الدافع النهائي: "صيانة الأمانة وحفظ العلم شرف العصور".' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['صيانة الامانة وحفظ العلم شرف العصور', 'صيانه الامانه وحفظ العلم شرف العصور'], points: 200 },
  ];
  await insertLevels(3, path3Levels);

  // Path 4: Truth (Modern Era)
  const path4Levels = [
    { num: 1, title: 'تقرير بلاغ الحادث الرقمي', role: 'Discovery', story: 'فتح ملف التحقيق الرقمي عند مدخل معمل الروبوتكس.', clueBlocks: [{ category: 'qr', text: 'امسحوا QR معمل الروبوتكس لفتح البلاغ الرقمي.' }], locationId: 6, answerTypes: ['TEXT'], validAnswers: ['PORT443', '443'], points: 100 },
    { num: 2, title: 'كاميرات المراقبة والذكاء الاصطناعي', role: 'Investigation', story: 'فحص مقطع الكاميرا CCTV مع المهندس زياد لكشف ملامح الفاعل.', clueBlocks: [{ category: 'person', text: 'توجهوا للمهندس زياد في معمل الروبوتكس وخمنوا حساس الأمان للحصول على الكود.' }], locationId: 6, stationId: 4, answerTypes: ['ORGANIZER_CODE'], validAnswers: ['CYBER-42', 'CYBER42'], points: 100 },
    { num: 3, title: 'المسار الرقمي وفخ التشفير', role: 'Investigation', story: 'محاولة اختراق السيرفر، يوجد ملف آمن وملفان محقونان بلعنة رقمية!', clueBlocks: [{ category: 'prop', text: 'اختاروا الملف المشفر الأصلي وتجنبوا الفيروسات الملعونة.' }], locationId: 6, answerTypes: ['MULTIPLE_CHOICE'], multipleChoice: [{ text: 'ملف السجل المشفر (Secure_Chronicle.log)', is_curse: false, is_correct: true }, { text: 'الملف المفتوح (Cheat_Code_All.exe)', is_curse: true, is_correct: false }, { text: 'سيرفر الإلغاء السريع (Trap_Curse)', is_curse: true, is_correct: false }], validAnswers: ['ملف السجل المشفر (Secure_Chronicle.log)'], points: 100 },
    { num: 4, title: 'أرقام الشاشات والمعامل', role: 'Verification', story: 'عد الشاشات المتصلة بشبكة الأمان في معمل الروبوتكس.', clueBlocks: [{ category: 'counting', text: 'احسبوا عدد شاشات المعمل + عدد الأبواب.' }], locationId: 6, answerTypes: ['PIN'], validAnswers: ['12', '14'], points: 100 },
    { num: 5, title: 'تتبع البصمة الرقمية', role: 'Verification', story: 'البصمة الزمنية تدل على استخدام بطاقة عضو إداري مميز.', clueBlocks: [{ category: 'prop', text: 'رمز البطاقة المستخدمة ينتهي بالرقم 2026. أدخلوا الرقم.' }], locationId: 9, answerTypes: ['PIN'], validAnswers: ['2026'], points: 100 },
    { num: 6, title: 'فحص الأدلة المزيفة', role: 'New Evidence', story: 'ترك الفاعل قفازاً مطاطياً للتمويه، لكن الكاميرا كشفت أنه مخصص لأعمال المختبرات.', clueBlocks: [{ category: 'prop', text: 'القفاز تابع لمعمل: (الكيمياء / الروبوتكس / الورشة).' }], locationId: 6, answerTypes: ['TEXT'], validAnswers: ['الروبوتكس', 'روبوتكس'], points: 100 },
    { num: 7, title: 'الجدول الزمني للتحركات', role: 'New Evidence', story: 'رتبوا الأحداث: 06:30 الدخول، 06:40 نقل القطعة، 06:50 القفل والإغلاق.', clueBlocks: [{ category: 'prop', text: 'كم دقيقة استغرقت عملية النقل كاملة من الدخول حتى القفل؟' }], locationId: 9, answerTypes: ['PIN'], validAnswers: ['20', 'عشرون'], points: 100 },
    { num: 8, title: 'التحدي الميداني الأخير', role: 'Analysis', story: 'تحدي المنظمين في بهو المدرسة للتحقق من هوية المشتبه فيه.', clueBlocks: [{ category: 'challenge', text: 'نفذوا مصافحة التقدير مع 3 من منظمي المدرسة واحصلوا على الكلمة السرية.' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['التعاون', 'تعاون', 'UNITY'], points: 100 },
    { num: 9, title: 'الموقع النهائي المشفر', role: 'Final Preparation', story: 'إحداثيات GPS الداخلية بالمدرسة تشير إلى موقع الصندوق الحالي تحت منصة المسرح.', clueBlocks: [{ category: 'pattern', text: 'المكان النهائي يقع في: (المسرح / الملعب / المعمل).' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['المسرح', 'مسرح', 'STAGE'], points: 100 },
    { num: 10, title: 'كشف سجل الحقيقة والمكان (The Truth Fragment)', role: 'Final Fragment', story: 'اكتملت حقيقة الهوية والمكان! المسؤولون عن النقل هما المهندس زياد ومستر حاتم، والصندوق موجود بأمان تام تحت منصة المسرح الرئيسي في القاعة الكبرى، جاهز للاحتفال!', clueBlocks: [{ category: 'prop', text: 'اكتبوا عبارة ختم الحقيقة النهائي: "الحقيقة ساطعة في قلب المسرح".' }], locationId: 5, answerTypes: ['TEXT'], validAnswers: ['الحقيقة ساطعة في قلب المسرح', 'الحقيقه ساطعه في قلب المسرح'], points: 200 },
  ];
  await insertLevels(4, path4Levels);

  // 9. Final Revelation Fragments for Auditorium Projector
  const fragments = [
    {
      path_id: 1,
      title: 'سجل البداية: سر الأصل والبردية',
      subtitle: 'The Origin Fragment (Ancient Egypt)',
      revealed_text: 'البردية كُتبت في عهد خوفو لتحذير الأجيال من تفرق المعرفة؛ تقسيم الأختام كان خطة أزلية لحمايتها من الضياع حتى يجتمع طلاب السويدي ويوحدوا قواهم!',
    },
    {
      path_id: 2,
      title: 'سجل الآلية: هندسة النقل الخفية',
      subtitle: 'The Method Fragment (Greco-Roman)',
      revealed_text: 'تم النقل في تمام 06:30 صباحاً باستخدام عربة أدوات صيانة مغطاة وبكرات صامتة دون كسر أي قفل، باستخدام المفتاح الإداري الرسمي وبخطة محسوبة بالثواني!',
    },
    {
      path_id: 3,
      title: 'سجل الدافع: رسالة الحفظ والأمانة',
      subtitle: 'The Motive Fragment (Islamic Era)',
      revealed_text: 'الدافع لم يكن سرقة قط! بل صيانة الأثر وحمايته من أعمال الترميم وطلاء الحوائط بالقاعة الكبرى وتجهيز مفاجأة كبرى لتحدي ذكاء الفرق في الـ Fun Day!',
    },
    {
      path_id: 4,
      title: 'سجل الحقيقة: الهوية والمكان الأخير',
      subtitle: 'The Truth Fragment (Modern Era)',
      revealed_text: 'المسؤولان هما المهندس زياد ومستر حاتم بالتنسيق مع إدارة المدرسة، والقطعة الأثرية موجودة الآن بأمان تام تحت منصة العرض بالمسرح الرئيسي!',
    },
  ];

  for (const f of fragments) {
    await execute(
      `INSERT INTO final_fragments (path_id, title, subtitle, revealed_text, is_revealed_on_screen)
       VALUES (?, ?, ?, ?, 0)`,
      [f.path_id, f.title, f.subtitle, f.revealed_text]
    );
  }

  // 10. Final Accusation Questions
  await execute(
    `INSERT INTO final_accusations (
      id, question_1, question_2, question_3,
      keywords_q1_json, keywords_q2_json, keywords_q3_json
    ) VALUES (
      1,
      'من هو الشخص (أو الأشخاص) المسؤول عن نقل ختم العصور من الأرشيف؟',
      'كيف تمت العملية وما هي الوسيلة والتوقيت المستخدم في نقل القطعة؟',
      'ما هو الدافع الحقيقي للعملية، وأين توجد القطعة الأثرية الآن بالتحديد؟',
      '["زياد", "حاتم", "المهندس زياد", "مستر حاتم"]',
      '["عربة", "صيانة", "06:30", "بكرات", "مفتاح"]',
      '["حماية", "المسرح", "تحت المنصة", "ترميم", "امانة"]'
    )`
  );

  // 11. Special Awards
  const awards = [
    { title: 'أفضل فريق محقق (Sherlock Award)', description: 'للفريق صاحب أعلى سكور وأدق إجابات في جلسة الاتهام النهائي.' },
    { title: 'الفريق الأسرع (Flash Investigators)', description: 'لأول فريق ينهي مستوياته بالكامل ويكشف جزء الحضارة الخاص به.' },
    { title: 'ناجي اللعنة الأسطوري (Curse Conqueror)', description: 'للفريق الذي أصابته لعنة المقبرة وتمكن من حل كل المستويات الإضافية وتجاوزها!' },
    { title: 'روح التعاون المدرسي (Team Spirit)', description: 'للفريق الأكثر حماساً وتنفيذاً للتحديات مع المدرسين والبوثات.' },
  ];

  for (const a of awards) {
    await execute(
      `INSERT INTO special_awards (title, description, notes) VALUES (?, ?, 'جاهز للاختيار بنهاية اليوم')`,
      [a.title, a.description]
    );
  }

  console.log('[Seed] Seeding completed successfully with 40 backward-designed levels & full rich metadata!');
}

module.exports = {
  seedIfEmpty,
};

