// ========================================================
// lib/seedEngine.js - Complete Data-Driven Seed Engine
// ========================================================

async function seedGameData(query, queryOne, execute) {
  const existing = await queryOne('SELECT id FROM game_state WHERE id = 1');
  if (existing) return;

  console.log('[Seed] Seeding brand new game data based on the new Master Specification...');

  // 1. Game State
  await execute(
    `INSERT INTO game_state (
      id, state, hint2_penalty_seconds, hint3_penalty_seconds, wrong_lockout_seconds,
      curse_text, safety_banner, admin_password_hash, updated_at
    ) VALUES (
      1, 'LOBBY', 60, 120, 30,
      'كما محوتَ اسمي من التاريخ، سأمحو حقيقة كل من يأتي بعدك. لن ينتهي هذا الانتقام حتى يعود آخر وريث من سلالتي.',
      'انظر فقط ولا تلمس أجهزة الطوارئ. امشِ ولا تركض.',
      'AD@776@z776@', datetime('now')
    )`
  );

  // 2. The 4 Eras
  const eras = [
    {
      id: 1,
      name: 'العصر الفرعوني',
      ruler: 'أخناتون',
      color: '#c59b27',
      icon: 'sun',
      script_text:
        'أنا أخناتون، الملك الذي نظر إلى الشمس فرأى ما لم يره بشر. قمتُ بإلقاء تعويذة سرية للخلود تجاوزت حدود الزمان ونقلتني إلى عصر قادم لم أكن أعرفه. لكن مأساتي بدأت عندما تجرأ ملوك الزمان اللاحق على محو حقيقتي، والآن أنتم هنا لتعيدوا كتابة ما تم محوه!',
    },
    {
      id: 2,
      name: 'مصر البطلمية',
      ruler: 'بطليموس الثامن',
      color: '#2563eb',
      icon: 'scroll',
      script_text:
        'في عصر البطالمة، وجد بطليموس الثامن ذلك الغريب القادم من غياهب الزمن. وبدلاً من الحفاظ على سره، أمر بمحو اسمه وتاريخه من كل نقش وحجر، وترك الغريب يشيخ في المنفى لآلاف السنين حاملاً لعنة لا تنتهي حتى يجتمع ورثة المعرفة!',
    },
    {
      id: 3,
      name: 'العصر الإسلامي',
      ruler: 'صلاح الدين الأيوبي',
      color: '#059669',
      icon: 'compass',
      script_text:
        'في عصر صلاح الدين، التقينا بذلك الرجل العجوز الذي عاش آلاف السنين مسجوناً في الزمن. وقبل أن يسلم روحه إلى بارئها، ظهرت روح غامضة لتعلن أن اللعنة انكسرت: "كما محوتَ اسمي من التاريخ، سأمحو حقيقة كل من يأتي بعدك. لن ينتهي هذا الانتقام حتى يعود آخر وريث من سلالتي". فكتب صلاح الدين السر في كتاب محفوظ!',
    },
    {
      id: 4,
      name: 'العصر الخديوي',
      ruler: 'الخديوي إسماعيل',
      color: '#991b1b',
      icon: 'crown',
      script_text:
        'في مكتبة الخديوي إسماعيل، عثرنا على الكتاب الأثري المفقود. وبفك شفرات حجر رشيد الثلاث، جمعنا الكلمات الضائعة: لم يكن الخلود سحراً ولا الأثر غنيمة، بل كان اختباراً لأبناء مدرسة السويدي عبر العصور لحفظ تاريخهم وحمايته من النسيان!',
    },
  ];

  for (const e of eras) {
    await execute(
      `INSERT INTO eras (id, name, ruler, color, icon, script_text, is_revealed_on_stage)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [e.id, e.name, e.ruler, e.color, e.icon, e.script_text]
    );
  }

  // 3. Engineers Data
  const engineers = [
    {
      id: 'marwa',
      name: 'مروة',
      facts: {
        M1: 'مقاس النظارة -2',
        M2: 'والد صديقتها المقربة في الجامعة اسمه علي',
        M3: 'اسم الشارع: أسماء أبو بكر',
      },
    },
    {
      id: 'essam',
      name: 'عصام',
      facts: {
        E1: 'يرتدي ساعة شاومي',
        E2: 'قريته تشتهر بوجود مخزن للبارود',
        E3: 'أول بروجيكت عمل عليه كان باسم Fitness Web',
        E4: 'اسم الشارع: محمد بلال',
      },
    },
    {
      id: 'mostafa',
      name: 'مصطفى',
      facts: {
        T1: 'الرقم الجامعي: 20188049',
        T2: 'يعشق ساندوتش الكاتشب',
        T3: 'ترتيبه السادس على دفعته',
        T4: 'يكره مادة البايو إنفورماتيكس',
        T5: 'كارتونه المفضل هو Wreck-It Ralph',
      },
    },
  ];

  for (const eng of engineers) {
    await execute(
      `INSERT INTO staff_engineers (id, name, facts_json) VALUES (?, ?, ?)`,
      [eng.id, eng.name, JSON.stringify(eng.facts)]
    );
  }

  // 4. Ten Booths
  const boothsData = [
    // Era 1
    {
      era_id: 1,
      level_number: 4,
      game_name: 'البلونة والمنديل',
      rules_ar: 'يقف لاعبان متقابلان ويمسكان قطعة قماش عليها بلونة، يقومان بتنطيطها أثناء السير لمسافة محددة ووضعها داخل الصندوق دون أن تسقط.',
      win_condition: 'إيصال البلونة إلى الصندوق خلال دقيقتين دون أن تلمس الأرض.',
      safety_notes: 'السير بحذر وهدوء وعدم الجري السريع.',
      organizer_script: 'أنتم تحملون قرص شمس آتون المقدس؛ حركوه بثبات نحو الأفق!',
      reward_type: 'CODE',
      reward_variant_a: 'ATEN-A4',
      reward_variant_b: 'ATEN-B4',
      reward_variant_c: 'ATEN-C4',
    },
    {
      era_id: 1,
      level_number: 7,
      game_name: 'لعبة سيجا (Seega)',
      rules_ar: 'لعبة فرعونية قديمة تشبه إكس-أو؛ يمتلك كل لاعب 3 قطع فقط ويحركها بالتناوب لتكوين صف ثلاثي مستقيم.',
      win_condition: 'تحقيق صف ثلاثي خلال 3 جولات.',
      safety_notes: 'اللعب على الطاولة بهدوء.',
      organizer_script: 'الفراعنة كانوا يخططون معاركهم على رمال سيجا؛ أثبتوا ذكاءكم العسكري!',
      reward_type: 'PIN',
      reward_variant_a: '731',
      reward_variant_b: '732',
      reward_variant_c: '733',
    },
    {
      era_id: 1,
      level_number: 9,
      game_name: 'تيك تراك بالريشة',
      rules_ar: 'يضرب أحد اللاعبين الريشة لمسافة بعيدة، ويقوم اللاعب الآخر بمحاولة تمريرها من تحت العصا الموضوعة على الأرض.',
      win_condition: 'تمرير الريشة بنجاح مرتين من تحت العصا.',
      safety_notes: 'الحذر أثناء ضرب الريشة ومراعاة المساحة المخصصة.',
      organizer_script: 'ريشة ماعت هي ميزان الحق؛ مرروها بنقاء لتفتحوا باب الحقيقة!',
      reward_type: 'WORD',
      reward_variant_a: 'MAAT-GOLD',
      reward_variant_b: 'MAAT-SUN',
      reward_variant_c: 'MAAT-LIGHT',
    },
    // Era 2
    {
      era_id: 2,
      level_number: 3,
      game_name: 'لعبة الظلطة (Pebbles)',
      rules_ar: 'مجموعة ظلط على الطاولة؛ يرمي اللاعب ظلطة للأعلى وبنفس اليد يلتقط أخرى قبل سقوط الأولى، ثم يكررها مع اثنتين وثلاث.',
      win_condition: 'التقاط 3 ظلطات متتالية بنجاح.',
      safety_notes: 'عدم رمي الحصى باتجاه أي شخص.',
      organizer_script: 'الفلاسفة في الإسكندرية دربوا عقولهم وأيديهم على التناغم؛ اختبروا تركيزكم!',
      reward_type: 'CODE',
      reward_variant_a: 'PEBBLE-21',
      reward_variant_b: 'PEBBLE-22',
      reward_variant_c: 'PEBBLE-23',
    },
    {
      era_id: 2,
      level_number: 6,
      game_name: 'الطوق والعصي',
      rules_ar: 'يقف اللاعب داخل طوق، وباستخدام العصا ينقل الطوق الخلفي إلى الأمام ويقف داخله ويكرر ذلك حتى خط النهاية.',
      win_condition: 'الوصول لخط النهاية باستخدام الطوق والعصا فقط.',
      safety_notes: 'الانتباه للخطوات وعدم التعثر.',
      organizer_script: 'هكذا كانت تتحرك عجلات المراسيل في العصر الإغريقي؛ تقدموا للأمام!',
      reward_type: 'PIN',
      reward_variant_a: '640',
      reward_variant_b: '641',
      reward_variant_c: '642',
    },
    {
      era_id: 2,
      level_number: 9,
      game_name: 'الحجلة (أبيكا - 10 خطوات)',
      rules_ar: 'خطوط مرسومة بعشر خطوات؛ يرمي اللاعب الحجر على المربع الأول، وينط برجل واحدة للمربعات الفردية وبرجلين للمزدوجة ويعود بالحجر.',
      win_condition: 'إتمام المسار والتقاط الحجر دون ملامسة الخطوط.',
      safety_notes: 'القفز المتزن على أرضية الملاعب.',
      organizer_script: 'عشر درجات تفصلكم عن سر بطليموس الثامن؛ تجاوزوها بتوازن!',
      reward_type: 'WORD',
      reward_variant_a: 'STEP-ALEX',
      reward_variant_b: 'STEP-NILE',
      reward_variant_c: 'STEP-DELTA',
    },
    // Era 3
    {
      era_id: 3,
      level_number: 3,
      game_name: 'تمرير الكرة عبر الطوق',
      rules_ar: 'شخص يقف حاملاً طوقاً ويتحرك به ببطء، واثنان يتبادلان رمي وتمرير الكرة من داخل الطوق أثناء حركته.',
      win_condition: 'تمرير الكرة 5 مرات متتالية داخل الطوق.',
      safety_notes: 'التمرير الدقيق وعدم التدافع.',
      organizer_script: 'رسائل فرسان صلاح الدين كانت تعبر الحصار عبر أدق الحلقات؛ مرروا الرسالة!',
      reward_type: 'CODE',
      reward_variant_a: 'HOOP-55',
      reward_variant_b: 'HOOP-56',
      reward_variant_c: 'HOOP-57',
    },
    {
      era_id: 3,
      level_number: 7,
      game_name: 'البيضة والمعلقة',
      rules_ar: 'يمسك اللاعب الملعقة بفمه وعليها كرة بينج بونج ويمشي في مسار محدد حتى خط النهاية دون إسقاطها.',
      win_condition: 'الوصول للنهاية والكرة مستقرة على الملعقة.',
      safety_notes: 'المشي بثبات وتفادي الاصطدام.',
      organizer_script: 'أمانة العلم أثقل من الجبال؛ حافظوا عليها حتى تصل ليد صلاح الدين!',
      reward_type: 'PIN',
      reward_variant_a: '715',
      reward_variant_b: '716',
      reward_variant_c: '717',
    },
    // Era 4
    {
      era_id: 4,
      level_number: 3,
      game_name: 'البلي الثلاثي',
      rules_ar: 'ثلاث بليات مرصوصة على خط مستقيم؛ يقف اللاعب على بعد مترين ويصوب ببليته ليصيب ويخرج واحدة من البليات الثلاث.',
      win_condition: 'إصابة بليتين من أصل 4 محاولات.',
      safety_notes: 'الرمي الأرضي فقط داخل المنطقة المحددة.',
      organizer_script: 'الدقة الهندسية في عصر النهضة الخديوية لا تحتمل الخطأ؛ صوّبوا بدقة!',
      reward_type: 'CODE',
      reward_variant_a: 'MARBLE-31',
      reward_variant_b: 'MARBLE-32',
      reward_variant_c: 'MARBLE-33',
    },
    {
      era_id: 4,
      level_number: 7,
      game_name: 'البلي المثلث',
      rules_ar: 'ثلاث بليات مرسومة على شكل مثلث؛ يضرب اللاعب أحد الأضلاع، فإذا لمست بليته الضلع ربح.',
      win_condition: 'لمس ضلع المثلث بنجاح مرتين.',
      safety_notes: 'الانتباه لمحيط الرمي.',
      organizer_script: 'مثلث حجر رشيد يفك رموز الزمان؛ اختر ضلع الحقيقة!',
      reward_type: 'PIN',
      reward_variant_a: '891',
      reward_variant_b: '892',
      reward_variant_c: '893',
    },
  ];

  for (const b of boothsData) {
    await execute(
      `INSERT INTO booths (
        era_id, level_number, game_name, rules_ar, win_condition, safety_notes,
        organizer_script, reward_type, reward_variant_a, reward_variant_b, reward_variant_c
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.era_id, b.level_number, b.game_name, b.rules_ar, b.win_condition,
        b.safety_notes, b.organizer_script, b.reward_type,
        b.reward_variant_a, b.reward_variant_b, b.reward_variant_c,
      ]
    );
  }

  // 5. Forty Levels (10 beats per Era) with Variants A, B, C Overrides
  // We define the 10 beats master templates for each era
  const beatsTemplates = {
    // Era 1 (Akhenaten)
    1: [
      { beat: 1, title: 'هوية المهندس الحكيم', type: 'PERSONS', story: 'ترك حماة المعرفة أول لغز عند مهندس بالمدرسة يمتلك صفات فريدة.' },
      { beat: 2, title: 'كود البردية الشمسية', type: 'QR', story: 'امسحوا الكود المعلق بالقرب من مكتب المهندس لاكتشاف أول إشارة لقرص الشمس.' },
      { beat: 3, title: 'أعداد بهو النجوم والمطاعم', type: 'COUNTING', story: 'احسبوا عدد عناصر الزينة في الفود كورت أو نجوم القاعة الكبرى للحصول على الرقم السري.' },
      { beat: 4, title: 'تحدي البلونة وقرص آتون', type: 'BOOTH', story: 'توجهوا إلى بوث البلونة والمنديل وانقلوا قرص الشمس دون أن يسقط.' },
      { beat: 5, title: 'حكمة بوستر الحائط', type: 'WALL_POSTER', story: 'اقرؤوا الحكمة المعلقة على الحائط واكتشفوا الكلمة المفقودة التي تكمل المعنى.' },
      { beat: 6, title: 'درجات سلم الأمل', type: 'STAIRS', story: 'على سلالم الدور الثاني، ترك الحماة كوتس الدعم النفسي؛ ابحثوا في الدرجات المحددة.' },
      { beat: 7, title: 'مبارزة سيجا القديمة', type: 'BOOTH', story: 'تحدوا منظم بوث سيجا بالملعب الخارجي واصنعوا صفاً مستقيماً للفوز بالكود.' },
      { beat: 8, title: 'جدارية النيل والفنون', type: 'GRAFFITI', story: 'افحصوا لوحة الفنون والجرافيتي وابحثوا عن الرمز الفرعوني المخفي.' },
      { beat: 9, title: 'ريشة ماعت والحق', type: 'BOOTH', story: 'في بوث الريشة، سددوا الريشة بدقة من تحت العصا لإثبات استحقاقكم للسر.' },
      { beat: 10, title: 'تعويذة أخناتون والخلود', type: 'CIPHER', story: 'فكوا شفرة تعويذة أخناتون: لقد ألقى تعويذة نقلته عبر الزمن إلى الحقبة اليونانية!' },
    ],
    // Era 2 (Ptolemaic)
    2: [
      { beat: 1, title: 'لغز المهندس المعماري', type: 'PERSONS', story: 'مهندس بالسويدي يحفظ أول إشارة من مذكرات الإسكندرية.' },
      { beat: 2, title: 'رسالة الغريب الأولى', type: 'QR', story: 'شخص مجهول الهوية ("الغريب") ترك لكم ورقة مساعدة عند كود QR.' },
      { beat: 3, title: 'تحدي الظلطة والحصى', type: 'BOOTH', story: 'توجهوا لبوث الظلطة والتقطوا الحصى المتطاير لإثبات تركيزكم للغريب.' },
      { beat: 4, title: 'أرقام البنرات والإحصائيات', type: 'NUMBERS', story: 'استخرجوا الرقم من بنرات المدرسة (35 مليون متر، 49 دولة، أعوام 1998 و 2023).' },
      { beat: 5, title: 'مؤلف بوستر النجاح', type: 'WALL_POSTER', story: 'ابحثوا عن البوستر الذي يذكر مقولة التعاون والنجاح واكتبوا اسم صاحب الاقتباس.' },
      { beat: 6, title: 'سباق الطوق والعصا', type: 'BOOTH', story: 'قودوا الطوق الملكي بالعصا حتى خط النهاية في البوث المخصص.' },
      { beat: 7, title: 'أكروستيك درجات السلم', type: 'STAIRS', story: 'اجمعوا الحروف الأولى من عبارات درجات سلم الدور الأول لتكوين كلمة السر.' },
      { beat: 8, title: 'ملاحظة كاميرا المراقبة', type: 'CCTV', story: 'افحصوا شاشة المراقبة المتاحة واكتشفوا وقت مرور الحارس.' },
      { beat: 9, title: 'خطوات الحجلة العشر', type: 'BOOTH', story: 'اعبروا درجات الحجلة الـ 10 برجل واحدة وواحدة مزدوجة ببوث الملاعب.' },
      { beat: 10, title: 'رسالة الغريب الأخيرة ومحو التاريخ', type: 'CIPHER', story: 'كشف الغريب سره: بطليموس الثامن محا تاريخه تماماً وعاقبه بأن يشيخ لآلاف السنين!' },
    ],
    // Era 3 (Islamic)
    3: [
      { beat: 1, title: 'حامل لواء الحكمة', type: 'PERSONS', story: 'مهندس بالسيرفرات يحمل دليلاً إسلامياً عن معالم العلم.' },
      { beat: 2, title: 'رسالة صلاح الدين الزاجلة', type: 'QR', story: 'كود QR يفتح مخطوطة عن حمام الزاجل وقلعة الجبل.' },
      { beat: 3, title: 'تمرير الكرة والحصار', type: 'BOOTH', story: 'مرروا الكرة من داخل الطوق المتحرك ببوث الملاعب دون إسقاطها.' },
      { beat: 4, title: 'أهلة ونجوم رمضان', type: 'COUNTING', story: 'احسبوا عدد الأهلة والنجوم على أبواب الفصول المحددة بالكتالوج.' },
      { beat: 5, title: 'سلم مكارم الأخلاق', type: 'STAIRS', story: 'ابحثوا في بوستر كمثرى القيم بجانب سلم 3 عن الكلمة المعبرة عن الصبر والإنسانية.' },
      { beat: 6, title: 'العجوز الفاني وانكسار اللعنة', type: 'PERSONS', story: 'الرجل العجوز يحكي لكم عن العدو ثم يفارق الحياة؛ تظهر روح غامضة وتعلن انكسار اللعنة!' },
      { beat: 7, title: 'البيضة وحفظ الأمانة', type: 'BOOTH', story: 'انقلوا الرسالة السرية بالملعقة وكرة البينج بونج ببوث الملاعب.' },
      { beat: 8, title: 'جدارية النسر والقلعة', type: 'GRAFFITI', story: 'استخرجوا الرمز المنقوش على جدارية النسر الإسلامي بالممر.' },
      { beat: 9, title: 'تحدي الأمانة والوقار', type: 'CHALLENGE', story: 'تحدي الوقوف بصمت ووقار لمدة 30 ثانية أمام مسؤول المحطة.' },
      { beat: 10, title: 'كتاب صلاح الدين السري', type: 'CIPHER', story: 'صلاح الدين يكتب تفاصيل ما حدث في كتاب محفوظ قائلاً: "يوماً ما ستعرفون الحقيقة"!' },
    ],
    // Era 4 (Khedival)
    4: [
      { beat: 1, title: 'مهندس العصر الرقمي', type: 'PERSONS', story: 'مهندس بالتكنولوجيا يمتلك أول مفتاح لمكتبة الخديوي إسماعيل.' },
      { beat: 2, title: 'ملاحظة الأرشيف الخديوي', type: 'QR', story: 'امسحوا كود QR في مدخل المعامل لقراءة أول إشارة للأرشيف.' },
      { beat: 3, title: 'بلي الخزانة الثلاثي', type: 'BOOTH', story: 'أصيبوا البلي الثلاثي من مسافة مترين ببوث الألعاب بالملعب.' },
      { beat: 4, title: 'أرقام مقابس الجيم والفيونكات', type: 'NUMBERS', story: 'احسبوا عدد مقابس الشحن بالجيم (6) وفيونكات الموسيقى (2).' },
      { beat: 5, title: 'العثور على الكتاب المادي (Prop)', type: 'PROP', story: 'ابحثوا عن نموذج الكتاب القديم المخفي قرب جدارية التاريخ الحديث.' },
      { beat: 6, title: 'شفرة حجر رشيد (المرحلة 1)', type: 'CIPHER', story: 'ترجمة الرموز الهيروغليفية الأولى إلى حروف يونانية قديمة.' },
      { beat: 7, title: 'مثلث البلي وحساب الزوايا', type: 'BOOTH', story: 'اضربوا ضلع مثلث البلي ببوث الملاعب لفك معامل الزاوية.' },
      { beat: 8, title: 'شفرة حجر رشيد (المرحلة 2)', type: 'CIPHER', story: 'ترجمة الكلمات اليونانية إلى نص عربي فصيح يكشف نص اللعنة الكامل.' },
      { beat: 9, title: 'التسجيل الرقمي الأخير', type: 'CCTV', story: 'شاهدوا آخر تسجيل لغرفة الأرشيف وتعرفوا على مكان حفظ النسخة الأصلية.' },
      { beat: 10, title: 'كشف الحقيقة الكاملة للزمان', type: 'CIPHER', story: 'اكتملت القصة: أخناتون سجن في الزمن، بطليموس محا تاريخه، وصلاح الدين حفظ سره، وأنتم ورثة المعرفة!' },
    ],
  };

  // Insert Levels and Variants
  for (const eraId of [1, 2, 3, 4]) {
    const beats = beatsTemplates[eraId];
    for (const b of beats) {
      // Determine answers and clue texts based on beat type
      let defaultAnswers = ['مروة'];
      let baseClue = b.story;

      // Engineer Beat 1 allocation
      if (b.beat === 1) {
        if (eraId === 1) defaultAnswers = ['مروة', 'أسماء أبو بكر'];
        if (eraId === 2) defaultAnswers = ['عصام', 'محمد بلال'];
        if (eraId === 3) defaultAnswers = ['مصطفى', '20188049'];
        if (eraId === 4) defaultAnswers = ['مروة', 'أسماء أبو بكر'];
      } else if (b.type === 'COUNTING' || b.type === 'NUMBERS') {
        defaultAnswers = ['5', '12', '49', '35'];
      } else if (b.type === 'BOOTH') {
        defaultAnswers = ['ATEN-A4', 'PEBBLE-21', 'HOOP-55', 'MARBLE-31', '731', '640', '715', '891'];
      } else {
        defaultAnswers = ['الحقيقة', 'المعرفة', 'صلاح الدين', 'أخناتون', 'السويدي'];
      }

      const res = await execute(
        `INSERT INTO levels (
          era_id, level_number, title, story_text, clue_type, base_clue_text,
          base_answer_types, base_valid_answers, hint1_text, hint2_text, hint3_text,
          photo_catalog_id, photo_filename, safety_warning
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eraId,
          b.beat,
          b.title,
          b.story,
          b.type,
          baseClue,
          JSON.stringify(['TEXT']),
          JSON.stringify(defaultAnswers),
          'تلميح 1: ركزوا في تفاصيل المكان والوصف المذكور.',
          'تلميح 2 (+60 ثانية): راجعوا أرقام اللوحات أو الكلمات المميزة بالخط العريض.',
          'تلميح 3 (+120 ثانية): الإجابة ترتبط مباشرة بالرمز السري الموضح في المحطة.',
          null,
          null,
          b.type === 'CCTV' || b.type === 'NUMBERS' ? 1 : 0,
        ]
      );

      const levelId = res.lastInsertRowid;

      // Overrides for Variant A, B, C
      const variantConfigs = {
        A: { ans: defaultAnswers[0] || 'A1', loc: 'الموقع أ' },
        B: { ans: defaultAnswers[1] || defaultAnswers[0] || 'B1', loc: 'الموقع ب' },
        C: { ans: defaultAnswers[2] || defaultAnswers[0] || 'C1', loc: 'الموقع ج' },
      };

      // Specifically for Beat 1 Engineers allocation from spec:
      // E1: A Marwa M1,M2; B Essam E1,E2; C Mostafa T2,T5
      // E2: A Essam E3,E1; B Mostafa T4,T3; C Marwa M2,M1
      // E3: A Mostafa T2,T4; B Marwa M1,M2; C Essam E2,E3
      // E4: A Marwa M2,M1; B Essam E1,E3; C Mostafa T5,T3
      if (b.beat === 1) {
        if (eraId === 1) {
          variantConfigs.A = { ans: 'مروة', clue: 'مهندسة ترتدي نظارة مقاسها -2، ووالد صديقتها المقربة بالجامعة اسمه علي.' };
          variantConfigs.B = { ans: 'عصام', clue: 'مهندس يرتدي ساعة شاومي، وقريته تشتهر بوجود مخزن للبارود.' };
          variantConfigs.C = { ans: 'مصطفى', clue: 'مهندس يعشق ساندوتش الكاتشب، وكارتونه المفضل هو Wreck-It Ralph.' };
        } else if (eraId === 2) {
          variantConfigs.A = { ans: 'عصام', clue: 'مهندس كان أول مشروع له باسم Fitness Web ويرتدي ساعة شاومي.' };
          variantConfigs.B = { ans: 'مصطفى', clue: 'مهندس يكره مادة البايو إنفورماتيكس وكان ترتيبه السادس على دفعته.' };
          variantConfigs.C = { ans: 'مروة', clue: 'مهندسة والد صديقتها بالجامعة اسمه علي ونظارتها -2.' };
        } else if (eraId === 3) {
          variantConfigs.A = { ans: 'مصطفى', clue: 'مهندس يحب ساندوتش الكاتشب ويكره مادة البايو إنفورماتيكس.' };
          variantConfigs.B = { ans: 'مروة', clue: 'مهندسة مقاس نظارتها -2 ووالد صديقتها اسمه علي.' };
          variantConfigs.C = { ans: 'عصام', clue: 'مهندس قريته بها مخزن بارود وأول مشروع له Fitness Web.' };
        } else if (eraId === 4) {
          variantConfigs.A = { ans: 'مروة', clue: 'مهندسة والد صديقتها علي ونظارتها -2، واسم شارعها أسماء أبو بكر.' };
          variantConfigs.B = { ans: 'عصام', clue: 'مهندس يرتدي ساعة شاومي وأول مشروع Fitness Web.' };
          variantConfigs.C = { ans: 'مصطفى', clue: 'مهندس يحب Wreck-It Ralph وكان السادس على دفعته.' };
        }
      }

      for (const v of ['A', 'B', 'C']) {
        const cfg = variantConfigs[v];
        await execute(
          `INSERT INTO level_variant_overrides (
            level_id, variant, clue_text, valid_answers, location_target, qr_token, booth_reward_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            levelId,
            v,
            cfg.clue || `${b.story} (مسار التفريعة ${v})`,
            JSON.stringify([cfg.ans]),
            cfg.loc || `المبنى المدرسي - التفريعة ${v}`,
            `qr_e${eraId}_l${b.beat}_${v.toLowerCase()}`,
            `CODE-${eraId}-${b.beat}-${v}`,
          ]
        );
      }
    }
  }

  // 6. Seed QR Tokens Mapping
  const sampleQrs = [
    { token: 'qr_akhenaten_secret', label: 'كيو آر معبد الشمس', loc: 'بهو الفراعنة (مبنى أ)', era: 1, lvl: 2, var: null, content: 'مخطوطة آتون: قرص الشمس يحمل كود البداية: <strong>SUN-1353</strong>' },
    { token: 'qr_stranger_note', label: 'رسالة الغريب', loc: 'مكتبة الإسكندرية (مبنى ب)', era: 2, lvl: 2, var: null, content: 'رسالة من الغريب: "احذروا أعين بطليموس الثامن، الرمز هو: <strong>PTOLEMY-8</strong>"' },
    { token: 'qr_saladin_camp', label: 'معسكر صلاح الدين', loc: 'القاعة الكبرى', era: 3, lvl: 2, var: null, content: 'رسالة الحمام الزاجل: "القلعة صامدة والرمز هو: <strong>HIKMA-1187</strong>"' },
    { token: 'qr_khedive_library', label: 'مكتبة الخديوي', loc: 'معمل التكنولوجيا', era: 4, lvl: 2, var: null, content: 'سجل الكتب الخديوية: كود خزانة حجر رشيد هو: <strong>ROSETTA-1869</strong>' },
  ];

  for (const q of sampleQrs) {
    await execute(
      `INSERT INTO qr_tokens (token, label, location_name, era_id, level_number, variant, revealed_content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [q.token, q.label, q.loc, q.era, q.lvl, q.var, q.content]
    );
  }

  console.log('[Seed] Master Specification Seed Completed successfully with 4 Eras, 40 Levels, 120 Variants, 10 Booths, and Real Engineers Data!');
}

module.exports = {
  seedGameData,
};

