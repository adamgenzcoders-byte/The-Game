// ========================================================
// lib/seedEngine.js - Master Specification Game Content Seed Engine
// ========================================================

async function seedGameData(query, queryOne, execute) {
  // Check if already seeded
  const existingEras = await query(`SELECT count(*) as count FROM eras`);
  if (existingEras && existingEras[0] && existingEras[0].count >= 4) {
    // Check if levels have photos assigned; if not, we re-seed to enrich with catalog photos
    const photoCheck = await queryOne(`SELECT count(*) as cnt FROM levels WHERE photo_filename IS NOT NULL`);
    if (photoCheck && photoCheck.cnt > 0) {
      console.log('[Seed] Database already fully seeded with catalog photos. Skipping.');
      return;
    }
  }

  console.log('[Seed] Seeding brand new game data based on the Master Specification & Real School Catalog Photos...');

  // 1. Initial Game State
  const existingState = await queryOne(`SELECT * FROM game_state WHERE id = 1`);
  if (!existingState) {
    await execute(
      `INSERT INTO game_state (
        id, state, admin_password_hash, hint2_penalty_seconds, hint3_penalty_seconds,
        wrong_lockout_seconds, curse_text, safety_banner, updated_at
      ) VALUES (
        1, 'LOBBY', 'AD@776@z776', 60, 120, 30,
        'كما محوتَ اسمي من التاريخ، سأمحو حقيقة كل من يأتي بعدك. لن ينتهي هذا الانتقام حتى يعود آخر وريث من سلالتي.',
        'انظر فقط ولا تلمس أجهزة الطوارئ. امشِ ولا تركض.',
        datetime('now')
      )`
    );
  }

  // Clear existing content tables to avoid duplicate key conflicts during seed
  await execute(`DELETE FROM level_variant_overrides`);
  await execute(`DELETE FROM levels`);
  await execute(`DELETE FROM booths`);
  await execute(`DELETE FROM staff_engineers`);
  await execute(`DELETE FROM eras`);
  await execute(`DELETE FROM qr_tokens`);

  // 2. Four Eras
  const eras = [
    {
      id: 1,
      name: 'العصر الفرعوني',
      ruler: 'أخناتون',
      color: '#c59b27',
      icon: '👑',
      script_text:
        'أنا أخناتون، الملك الذي نظر إلى الشمس فرأى ما لم يره بشر. قمتُ بإلقاء تعويذة سرية للخلود تجاوزت حدود الزمان ونقلتني إلى عصر قادم لم أكن أعرفه. لكن مأساتي بدأت عندما تجرأ ملوك الزمان اللاحق على محو حقيقتي، والآن أنتم هنا لتعيدوا كتابة ما تم محوه!',
    },
    {
      id: 2,
      name: 'مصر البطلمية',
      ruler: 'بطليموس الثامن',
      color: '#2563eb',
      icon: '📜',
      script_text:
        'في عصر البطالمة، وجد بطليموس الثامن ذلك الغريب القادم من غياهب الزمن. وبدلاً من الحفاظ على سره، أمر بمحو اسمه وتاريخه من كل نقش وحجر، وترك الغريب يشيخ في المنفى لآلاف السنين حاملاً لعنة لا تنتهي حتى يجتمع ورثة المعرفة!',
    },
    {
      id: 3,
      name: 'العصر الإسلامي',
      ruler: 'صلاح الدين الأيوبي',
      color: '#059669',
      icon: '🧭',
      script_text:
        'في عصر صلاح الدين، التقينا بذلك الرجل العجوز الذي عاش آلاف السنين مسجوناً في الزمن. وقبل أن يسلم روحه إلى بارئها، ظهرت روح غامضة لتعلن أن اللعنة انكسرت: "كما محوتَ اسمي من التاريخ، سأمحو حقيقة كل من يأتي بعدك. لن ينتهي هذا الانتقام حتى يعود آخر وريث من سلالتي". فكتب صلاح الدين السر في كتاب محفوظ!',
    },
    {
      id: 4,
      name: 'العصر الخديوي',
      ruler: 'الخديوي إسماعيل',
      color: '#991b1b',
      icon: '🏛️',
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
      rules_ar: 'عصا خشبية مثبتة، ويجب على اللاعبين تمرير الريشة أسفلها بالتبادل دون أن تلمس العصا أو الأرض حتى الوصول لنقطة النهاية.',
      win_condition: 'إتمام المسار دون إسقاط الريشة.',
      safety_notes: 'التركيز والحذر أثناء الحركة.',
      organizer_script: 'ريشة ماعت هي ميزان الحقيقة؛ أثبتوا خفة حركتكم وصدق مسعاكم!',
      reward_type: 'CODE',
      reward_variant_a: 'MAAT-GOLD',
      reward_variant_b: 'MAAT-SUN',
      reward_variant_c: 'MAAT-LIGHT',
    },
    // Era 2
    {
      era_id: 2,
      level_number: 3,
      game_name: 'لعبة الظلطة (Pebbles)',
      rules_ar: 'يقف لاعبان؛ يرمي الأول حصاة خفيفة لأعلى وأثناء طيرانها يلتقط حصاة من الأرض ثم يمسك الحصاة الأولى باليد نفسها.',
      win_condition: 'التقاط 4 حصوات بنجاح.',
      safety_notes: 'الرمي الخفيف والتقاط آمن.',
      organizer_script: 'في شوارع الإسكندرية القديمة، كان الغريب يدرب أعوانه على خفة اليد؛ أثبتوا مهارتكم!',
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

  // 5. Forty Levels Master Templates with Real Catalog Photos & School Locations
  const beatsTemplates = {
    // Era 1 (Akhenaten - Gold)
    1: [
      {
        beat: 1, title: 'هوية المهندس الحكيم', type: 'PERSONS', photo: null,
        story: 'ترك حماة المعرفة أول لغز عند مهندس بالمدرسة يمتلك صفات فريدة في زيه وسيرته.',
        clue: 'ابحثوا عن المهندس المقصود واسألوه عن تفاصيله للتأكد من هويته وكتابة اسمه.',
        ans: ['مروة', 'عصام', 'مصطفى']
      },
      {
        beat: 2, title: 'كود البردية الشمسية (QR)', type: 'QR', photo: 'PXL_20261118_125930095.jpg',
        story: 'امسحوا الكود المعلق بالقرب من سلم 2 بالدور الثاني لاكتشاف أول إشارة لقرص الشمس.',
        clue: 'توجهوا إلى سلم 2 بالدور الثاني (الموضح بالصورة) وامسحوا رمز الـ QR المعلق بجانبه.',
        ans: ['SUN-1353', 'ATEN-SUN', 'آتون']
      },
      {
        beat: 3, title: 'أعداد بهو النجوم والمطاعم', type: 'COUNTING', photo: 'PXL_20261118_130004639.jpg',
        story: 'احسبوا عدد عناصر الزينة على الباب الذهبي الموضح بالصورة للحصول على الرقم السري.',
        clue: 'كم عدد النجوم الذهبية والأهلة المرصعة على الباب الموضح بالصورة بدقة؟',
        ans: ['8', 'ثمانية', '12']
      },
      {
        beat: 4, title: 'تحدي البلونة وقرص آتون', type: 'BOOTH', photo: null,
        story: 'توجهوا إلى بوث البلونة والمنديل بالملاعب الخارجية وانقلوا قرص الشمس دون أن يسقط.',
        clue: 'نفذوا التحدي مع منظم البوث، وعند الفوز احصلوا على كود كارت المسار الخاص بكم.',
        ans: ['ATEN-A4', 'ATEN-B4', 'ATEN-C4']
      },
      {
        beat: 5, title: 'حكمة بوستر الحائط', type: 'WALL_POSTER', photo: 'PXL_20261118_130213722.jpg',
        story: 'اقرؤوا الحكمة المعلقة على الحائط (The future depends on what you do today).',
        clue: 'ما هي الكلمة الأولى في السطر الثاني من البوستر الموضح بالصورة؟',
        ans: ['depends', 'future', 'today', 'المستقبل']
      },
      {
        beat: 6, title: 'درجات سلم الأمل والهدوء', type: 'STAIRS', photo: 'PXL_20261118_130559500.jpg',
        story: 'على سلالم المدرسة، كُتبت عبارات قوة الهدوء والتفكير؛ اقرؤوا الدرجات بعناية.',
        clue: 'ما هي الكلمة المرادفة للقوة المكتوبة على الدرجة الثانية من السلم (Calmness is power)؟',
        ans: ['power', 'strength', 'القوة', 'الهدوء']
      },
      {
        beat: 7, title: 'مبارزة سيجا القديمة', type: 'BOOTH', photo: null,
        story: 'تحدوا منظم بوث سيجا بالملعب الخارجي واصنعوا صفاً ثلاثياً مستقيماً للفوز بالكود.',
        clue: 'العبوا جولة سيجا وتغلبوا على المنظم للحصول على الرقم السري (PIN).',
        ans: ['731', '732', '733']
      },
      {
        beat: 8, title: 'جدارية النيل والفنون', type: 'GRAFFITI', photo: 'PXL_20261118_125906800.jpg',
        story: 'افحصوا لوحة الفنون والجرافيتي بالمدخل وابحثوا عن الكلمة المكتوبة بالخط العربي العريض.',
        clue: 'ما هي الكلمة المركزية المخطوطة داخل اللوحة الفنية الموضحة بالصورة؟',
        ans: ['فن', 'ابداع', 'السويدي', 'مصر']
      },
      {
        beat: 9, title: 'ريشة ماعت وميزان الحق', type: 'BOOTH', photo: null,
        story: 'في بوث تيك تراك بالريشة، سددوا الريشة بدقة من تحت العصا لإثبات استحقاقكم للسر.',
        clue: 'نفذوا مسار الريشة بدون إسقاطها واطلبوا كود الريشة الذهبي من منظم البوث.',
        ans: ['MAAT-GOLD', 'MAAT-SUN', 'MAAT-LIGHT']
      },
      {
        beat: 10, title: 'تعويذة أخناتون والخلود', type: 'CIPHER', photo: null,
        story: 'فكوا شفرة تعويذة أخناتون: لقد ألقى تعويذة نقلته عبر الزمن إلى الحقبة اليونانية!',
        clue: 'اجمعوا الحروف الأولى من محطات مساركم لتكوين الكلمة السرية التي تكسر ختم أخناتون.',
        ans: ['الخلود', 'النور', 'الحقيقة', 'اخناتون']
      },
    ],
    // Era 2 (Ptolemaic - Blue)
    2: [
      {
        beat: 1, title: 'لغز المهندس المعماري', type: 'PERSONS', photo: null,
        story: 'مهندس بالسويدي يحفظ أول إشارة من مذكرات الإسكندرية القديمة.',
        clue: 'تواصلوا مع المهندس المذكور واستخرجوا منه الإجابة المطابقة لمواصفاته.',
        ans: ['عصام', 'مصطفى', 'مروة']
      },
      {
        beat: 2, title: 'رسالة الغريب الأولى (QR)', type: 'QR', photo: 'PXL_20261118_130512501.jpg',
        story: 'شخص مجهول الهوية ("الغريب") ترك لكم ورقة مساعدة عند كود QR بجانب سلم 3.',
        clue: 'توجهوا لسلم 3 الدور الأول بجانب بوستر كمثرى القيم وامسحوا كود الـ QR.',
        ans: ['PTOLEMY-8', 'ALEX-QUEST', 'الغريب']
      },
      {
        beat: 3, title: 'تحدي الظلطة والحصى', type: 'BOOTH', photo: null,
        story: 'توجهوا لبوث الظلطة والتقطوا الحصى المتطاير لإثبات تركيزكم للغريب.',
        clue: 'أتموا التقاط الحصوات بنجاح واستلموا كود الظلطة من منظم المحطة.',
        ans: ['PEBBLE-21', 'PEBBLE-22', 'PEBBLE-23']
      },
      {
        beat: 4, title: 'أرقام البنرات وإلكتروميتر', type: 'NUMBERS', photo: 'PXL_20261118_131609366.jpg',
        story: 'استخرجوا الرقم من بنر السويدي إلكتروميتر الموضح بالصورة (عدد الملايين وعدد الدول).',
        clue: 'كم عدد الدول المذكورة على البنر الرسمي لشركة السويدي إلكتروميتر بالصورة؟',
        ans: ['49', '35', '1998', '2023']
      },
      {
        beat: 5, title: 'مؤلف بوستر النجاح والتعاون', type: 'WALL_POSTER', photo: 'PXL_20261118_130423137.jpg',
        story: 'ابحثوا عن البوستر الذي يذكر مقولة التعاون والنجاح (Collaboration is key to team success).',
        clue: 'ما هي الكلمة الأولى في عنوان البوستر المعلق في ممر الفصول؟',
        ans: ['collaboration', 'success', 'teamwork', 'التعاون']
      },
      {
        beat: 6, title: 'سباق الطوق والعصا', type: 'BOOTH', photo: null,
        story: 'قودوا الطوق الملكي بالعصا حتى خط النهاية في البوث المخصص بالملاعب.',
        clue: 'اعبروا المسار بالطوق والعصا فقط للحصول على الرقم السري المعتمد من المنظم.',
        ans: ['640', '641', '642']
      },
      {
        beat: 7, title: 'أكروستيك درجات السلم', type: 'STAIRS', photo: 'PXL_20261118_130653813.jpg',
        story: 'اجمعوا الحروف الأولى من عبارات درجات سلم المدرسة (Success starts small, Trying is true courage...).',
        clue: 'ما هي الكلمة الأولى المكتوبة على الدرجة الرابعة من سلم الأخلاق؟',
        ans: ['differences', 'learning', 'success', 'التعلم']
      },
      {
        beat: 8, title: 'ركن الموسيقى والصوت الخالد', type: 'GRAFFITI', photo: 'PXL_20261118_130814993.jpg',
        story: 'افحصوا جدارية ركن الموسيقى (Life is a song. Sing it!).',
        clue: 'ما هو الشكل المرسوم بجانب النغمات الموسيقية على الجدارية الموضحة بالصورة؟',
        ans: ['مايك', 'ميكروفون', 'microphone', 'نوتة']
      },
      {
        beat: 9, title: 'خطوات الحجلة العشر', type: 'BOOTH', photo: null,
        story: 'اعبروا درجات الحجلة الـ 10 برجل واحدة وواحدة مزدوجة ببوث الملاعب الخارجية.',
        clue: 'التقطوا الحجر بنجاح من المربع العاشر للحصول على كود العبور الإسكندري.',
        ans: ['STEP-ALEX', 'STEP-NILE', 'STEP-DELTA']
      },
      {
        beat: 10, title: 'رسالة الغريب الأخيرة ومحو التاريخ', type: 'CIPHER', photo: null,
        story: 'كشف الغريب سره: بطليموس الثامن محا تاريخه تماماً وعاقبه بأن يشيخ لآلاف السنين!',
        clue: 'ما اسم الملك الذي أمر بمحو اسم الغريب من جدران المعابد؟',
        ans: ['بطليموس الثامن', 'بطليموس', 'ptolemy']
      },
    ],
    // Era 3 (Islamic - Green)
    3: [
      {
        beat: 1, title: 'حامل لواء الحكمة', type: 'PERSONS', photo: null,
        story: 'مهندس بالسيرفرات يحمل دليلاً إسلامياً عن معالم العلم وتاريخ القلعة.',
        clue: 'ابحثوا عن المهندس المسجل في تفريعتكم واعرفوا الحقيقة منه مباشرة.',
        ans: ['مصطفى', 'مروة', 'عصام']
      },
      {
        beat: 2, title: 'رسالة صلاح الدين الزاجلة (QR)', type: 'QR', photo: 'PXL_20261118_131951162.MP.jpg',
        story: 'كود QR معلق بجانب سلم 4 المؤدي لمعمل اللغات يفتح رسالة الحمام الزاجل.',
        clue: 'توجهوا لسلم 4 (مبنى معمل اللغات بالصورة) وامسحوا كود الـ QR المعلق بجانب لوحة الطوارئ.',
        ans: ['HIKMA-1187', 'SALADIN-CAMP', 'القلعة']
      },
      {
        beat: 3, title: 'تمرير الكرة والحصار', type: 'BOOTH', photo: null,
        story: 'مرروا الكرة من داخل الطوق المتحرك ببوث الملاعب دون إسقاطها أثناء الحركة.',
        clue: 'أتموا 5 تمريرات صحيحة متتالية داخل الطوق لاستلام كود فك الحصار.',
        ans: ['HOOP-55', 'HOOP-56', 'HOOP-57']
      },
      {
        beat: 4, title: 'أهلة ونجوم الزينة', type: 'COUNTING', photo: 'PXL_20261118_130145179.jpg',
        story: 'احسبوا عدد الأهلة على نوافذ الممر الموضحة بالصورة.',
        clue: 'كم هلالاً مثبتاً على زجاج النافذة الموضحة بالصورة بدقة؟',
        ans: ['4', 'اربعة', 'أربعة']
      },
      {
        beat: 5, title: 'سلم مكارم الأخلاق والكمثرى', type: 'STAIRS', photo: 'PXL_20261118_130512501.jpg',
        story: 'ابحثوا في بوستر كمثرى القيم بجانب سلم 3 عن الكلمات الست المكتوبة داخل أوراق الكمثرى.',
        clue: 'ما هي الكلمة الأولى المكتوبة في أعلى ورقة ببوستر كمثرى القيم بالصورة؟',
        ans: ['respect', 'peace', 'احترام', 'سلام']
      },
      {
        beat: 6, title: 'العجوز الفاني وسر اللعنة', type: 'PERSONS', photo: null,
        story: 'الرجل العجوز يحكي لكم عن العدو ثم يفارق الحياة؛ تظهر روح غامضة وتعلن انكسار اللعنة!',
        clue: 'ما العبارة التي رددها العجوز قبل رحيله: "لن ينتهي هذا الانتقام حتى يعود آخر..."؟',
        ans: ['وريث', 'وريث من سلالتي', 'الوريث']
      },
      {
        beat: 7, title: 'البيضة وحفظ الأمانة', type: 'BOOTH', photo: null,
        story: 'انقلوا الرسالة السرية بالملعقة وكرة البينج بونج ببوث الملاعب الخارجية بثبات.',
        clue: 'اعبروا المسار المحدد والكرة مستقرة على الملعقة لاستلام الرقم السري للأمانة.',
        ans: ['715', '716', '717']
      },
      {
        beat: 8, title: 'جدارية النسر واللوحات التكعيبية', type: 'GRAFFITI', photo: 'PXL_20261118_130315436.jpg',
        story: 'افحصوا لوحة بيكاسو التكعيبية المعلقة بالممر الموضحة بالصورة.',
        clue: 'كم عدد الوجوه المرسومة داخل اللوحة الخضراء المعلقة بالصورة؟',
        ans: ['3', 'ثلاثة', 'ثلاث وجوه']
      },
      {
        beat: 9, title: 'بوستر الفشل جزء من النجاح', type: 'WALL_POSTER', photo: 'PXL_20261118_131506671.jpg',
        story: 'اقرؤوا بوستر الحائط (Failure is not the opposite of success, it is part of success).',
        clue: 'ما هي الكلمة المكتوبة باللون الأحمر البارز في أعلى هذا البوستر؟',
        ans: ['failure', 'success', 'الفشل', 'النجاح']
      },
      {
        beat: 10, title: 'كتاب صلاح الدين المحفوظ', type: 'CIPHER', photo: null,
        story: 'صلاح الدين يكتب تفاصيل ما حدث في كتاب محفوظ قائلاً: "يوماً ما ستعرفون الحقيقة"!',
        clue: 'من هو القائد الحكيم الذي أمر بحفظ سر العجوز في قلعته؟',
        ans: ['صلاح الدين', 'صلاح الدين الأيوبي', 'saladin']
      },
    ],
    // Era 4 (Khedival - Maroon)
    4: [
      {
        beat: 1, title: 'مهندس العصر الرقمي', type: 'PERSONS', photo: null,
        story: 'مهندس بالتكنولوجيا يمتلك أول مفتاح لمكتبة الخديوي إسماعيل وسجلاتها.',
        clue: 'طابقوا مواصفات المهندس المذكور وتحدثوا معه لمعرفة كلمة السر الأولى.',
        ans: ['مروة', 'عصام', 'مصطفى']
      },
      {
        beat: 2, title: 'ملاحظة الأرشيف الخديوي (QR)', type: 'QR', photo: 'PXL_20261118_131442919.jpg',
        story: 'امسحوا كود QR المعلق عند سلم الأرشيف والممر لقراءة أول إشارة للمكتبة الخديوية.',
        clue: 'توجهوا لسلم المدرسة الموضح بالصورة (سلم الأثر) وامسحوا كود الـ QR المعلق على جانبه.',
        ans: ['ROSETTA-1869', 'KHEDIVE-ARCHIVE', 'الأرشيف']
      },
      {
        beat: 3, title: 'بلي الخزانة الثلاثي', type: 'BOOTH', photo: null,
        story: 'أصيبوا البلي الثلاثي من مسافة مترين ببوث الألعاب بالملعب الخارجي.',
        clue: 'أخرجوا بليتين بنجاح من الخط الميداني للحصول على كود الخزانة الخديوية.',
        ans: ['MARBLE-31', 'MARBLE-32', 'MARBLE-33']
      },
      {
        beat: 4, title: 'أرقام الخط الزمني ومؤسس السويدي', type: 'NUMBERS', photo: 'PXL_20261118_131616242.jpg',
        story: 'افحصوا بانر الخط الزمني التاريخي (History Timeline) الموضح بالصورة.',
        clue: 'ما هي أول سنة مذكورة في بداية الخط الزمني للشركة بالصورة؟',
        ans: ['1998', '2023', '2000']
      },
      {
        beat: 5, title: 'بوستر الحلم الكبير - ريتشارد برانسون', type: 'WALL_POSTER', photo: 'PXL_20261118_131006421.jpg',
        story: 'ابحثوا عن بوستر مقولة الأحلام المعلق بالممر الموضح بالصورة.',
        clue: 'من هو صاحب المقولة المكتوب اسمه في أسفل هذا البوستر (Richard Branson)؟',
        ans: ['richard branson', 'ريتشارد برانسون', 'branson']
      },
      {
        beat: 6, title: 'شفرة حجر رشيد (المرحلة 1)', type: 'CIPHER', photo: null,
        story: 'ترجمة الرموز الهيروغليفية الأولى إلى حروف يونانية قديمة عبر جدول الشفرات.',
        clue: 'استبدلوا الرموز الأربعة المكتوبة بالحروف المقابلة لفك اسم الملك الملعون.',
        ans: ['اخناتون', 'akhenaten', 'الملك']
      },
      {
        beat: 7, title: 'مثلث البلي وحساب الزوايا', type: 'BOOTH', photo: null,
        story: 'اضربوا ضلع مثلث البلي ببوث الملاعب لفك معامل الزاوية الهندسية.',
        clue: 'أصيبوا ضلع المثلث بنجاح مرتين واستلموا الرقم السري (PIN) من المنظم.',
        ans: ['891', '892', '893']
      },
      {
        beat: 8, title: 'شفرة حجر رشيد (المرحلة 2)', type: 'CIPHER', photo: null,
        story: 'ترجمة الكلمات اليونانية إلى نص عربي فصيح يكشف نص اللعنة الكامل.',
        clue: 'اكتبوا الكلمة المفقودة من الشفرة: "سأمحو حقيقة كل من يأتي..."؟',
        ans: ['بعدك', 'من بعدك', 'بعدك لن ينتهي']
      },
      {
        beat: 9, title: 'بوستر أحلام والت ديزني', type: 'WALL_POSTER', photo: 'PXL_20261118_131014345.jpg',
        story: 'افحصوا بوستر والت ديزني الصغير المعلق بالممر (If you can dream it, you can do it).',
        clue: 'ما هو اسم الشخصية الشهيرة صاحبة هذا الاقتباس المكتوبة بالبوستر؟',
        ans: ['walt disney', 'والت ديزني', 'disney']
      },
      {
        beat: 10, title: 'كشف الحقيقة الكاملة للزمان', type: 'CIPHER', photo: null,
        story: 'اكتملت القصة: أخناتون سجن في الزمن، بطليموس محا تاريخه، وصلاح الدين حفظ سره، وأنتم ورثة المعرفة!',
        clue: 'ما هو اسم باني نهضة مصر الحديثة الذي جمع خيوط هذا اللغز في مكتبته؟',
        ans: ['الخديوي اسماعيل', 'الخديوي إسماعيل', 'اسماعيل', 'ismail']
      },
    ],
  };

  // Insert Levels and Variants
  for (const eraId of [1, 2, 3, 4]) {
    const beats = beatsTemplates[eraId];
    for (const b of beats) {
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
          b.clue,
          JSON.stringify(['TEXT']),
          JSON.stringify(b.ans),
          `تلميح 1: ركزوا في الموقع والمعالم الموضحة باللغز وتفاصيل الصورة.`,
          `تلميح 2 (+60 ثانية): الإجابة مكونة من كلمة أو رقم واضح موجود في مكان الدليل.`,
          `تلميح 3 (+120 ثانية): الإجابة ترتبط بالحل: ${b.ans[0]}.`,
          null,
          b.photo,
          b.type === 'NUMBERS' || b.type === 'COUNTING' ? 1 : 0,
        ]
      );

      const levelId = res.lastInsertRowid;

      // Variants A, B, C Overrides
      const variantConfigs = {
        A: { ans: b.ans[0], loc: 'مبنى الفصول أ - الدور الأول', clue: b.clue },
        B: { ans: b.ans[1] || b.ans[0], loc: 'مبنى الفصول ب - الدور الثاني', clue: b.clue },
        C: { ans: b.ans[2] || b.ans[0], loc: 'الملاعب والقاعة الكبرى', clue: b.clue },
      };

      // Beat 1 Staff Engineers Override
      if (b.beat === 1) {
        if (eraId === 1) {
          variantConfigs.A = { ans: 'مروة', loc: 'مبنى أ - غرفة المعلمين', clue: 'مهندسة ترتدي نظارة مقاسها -2، ووالد صديقتها المقربة بالجامعة اسمه علي.' };
          variantConfigs.B = { ans: 'عصام', loc: 'مبنى ب - معمل الحاسب', clue: 'مهندس يرتدي ساعة شاومي، وقريته تشتهر بوجود مخزن للبارود.' };
          variantConfigs.C = { ans: 'مصطفى', loc: 'مبنى ج - غرفة المشرفين', clue: 'مهندس يعشق ساندوتش الكاتشب، وكارتونه المفضل هو Wreck-It Ralph.' };
        } else if (eraId === 2) {
          variantConfigs.A = { ans: 'عصام', loc: 'مبنى ب - معمل الحاسب', clue: 'مهندس كان أول مشروع له باسم Fitness Web ويرتدي ساعة شاومي.' };
          variantConfigs.B = { ans: 'مصطفى', loc: 'مبنى ج - غرفة المشرفين', clue: 'مهندس يكره مادة البايو إنفورماتيكس وكان ترتيبه السادس على دفعته.' };
          variantConfigs.C = { ans: 'مروة', loc: 'مبنى أ - غرفة المعلمين', clue: 'مهندسة والد صديقتها بالجامعة اسمه علي ونظارتها -2.' };
        } else if (eraId === 3) {
          variantConfigs.A = { ans: 'مصطفى', loc: 'مبنى ج - غرفة المشرفين', clue: 'مهندس يحب ساندوتش الكاتشب ويكره مادة البايو إنفورماتيكس.' };
          variantConfigs.B = { ans: 'مروة', loc: 'مبنى أ - غرفة المعلمين', clue: 'مهندسة مقاس نظارتها -2 ووالد صديقتها اسمه علي.' };
          variantConfigs.C = { ans: 'عصام', loc: 'مبنى ب - معمل الحاسب', clue: 'مهندس قريته بها مخزن بارود وأول مشروع له Fitness Web.' };
        } else if (eraId === 4) {
          variantConfigs.A = { ans: 'مروة', loc: 'مبنى أ - غرفة المعلمين', clue: 'مهندسة والد صديقتها علي ونظارتها -2، واسم شارعها أسماء أبو بكر.' };
          variantConfigs.B = { ans: 'عصام', loc: 'مبنى ب - معمل الحاسب', clue: 'مهندس يرتدي ساعة شاومي وأول مشروع Fitness Web.' };
          variantConfigs.C = { ans: 'مصطفى', loc: 'مبنى ج - غرفة المشرفين', clue: 'مهندس يحب Wreck-It Ralph وكان السادس على دفعته.' };
        }
      }

      for (const v of ['A', 'B', 'C']) {
        const cfg = variantConfigs[v];
        const token = `qr_e${eraId}_l${b.beat}_${v.toLowerCase()}`;

        await execute(
          `INSERT INTO level_variant_overrides (
            level_id, variant, clue_text, valid_answers, location_target, qr_token, booth_reward_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            levelId,
            v,
            cfg.clue || b.clue,
            JSON.stringify([cfg.ans]),
            cfg.loc,
            token,
            `CODE-${eraId}-${b.beat}-${v}`,
          ]
        );

        // If this level is a QR clue or has a QR token, register in qr_tokens
        if (b.type === 'QR' || b.beat === 2) {
          await execute(
            `INSERT OR REPLACE INTO qr_tokens (token, label, location_name, era_id, level_number, variant, revealed_content)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              token,
              `كود لغز ${b.title} (تفريعة ${v})`,
              cfg.loc,
              eraId,
              b.beat,
              v,
              `رمز المخطوطة السري: <strong>${cfg.ans}</strong> (أدخل هذا الرمز في خانة الحل على هاتفك)`
            ]
          );
        }
      }
    }
  }

  // 6. Landmark QR Codes (Printed for Physical Placement Across the School)
  const landmarkQrs = [
    { token: 'qr_stairs_2', label: 'ملصق سلم 2 - الدور الثاني', loc: 'سلم 2 (مبنى الفصول الدور الثاني)', era: 1, lvl: 2, var: 'A', content: 'كود سلم الأمل: <strong>SUN-1353</strong>' },
    { token: 'qr_stairs_3', label: 'ملصق سلم 3 - كمثرى القيم', loc: 'سلم 3 (الدور الأول بجانب كمثرى القيم)', era: 2, lvl: 2, var: 'A', content: 'رسالة الغريب: <strong>PTOLEMY-8</strong>' },
    { token: 'qr_stairs_4', label: 'ملصق سلم 4 - معمل اللغات', loc: 'سلم 4 (مدخل معمل اللغات)', era: 3, lvl: 2, var: 'A', content: 'رسالة الحمام الزاجل: <strong>HIKMA-1187</strong>' },
    { token: 'qr_stairs_archive', label: 'ملصق أرشيف المكتبة', loc: 'ممر الأرشيف الخديوي', era: 4, lvl: 2, var: 'A', content: 'سجل الخديوي: <strong>ROSETTA-1869</strong>' },
    { token: 'qr_grand_hall', label: 'ملصق القاعة الكبرى', loc: 'بهو القاعة الكبرى والمسرح', era: 1, lvl: 10, var: null, content: 'مفتاح المنصة الكبرى: <strong>TRUTH-SEWEDY</strong>' },
    { token: 'qr_electrometer', label: 'ملصق جدارية إلكتروميتر', loc: 'جدارية شركة السويدي إلكتروميتر', era: 2, lvl: 4, var: null, content: 'أرقام الإحصاء: <strong>49</strong> دولة و <strong>35</strong> مليون عداد' },
    { token: 'qr_music_corner', label: 'ملصق ركن الموسيقى', loc: 'باب غرفة الموسيقى والفنون', era: 2, lvl: 8, var: null, content: 'نغمة الحقيقة: <strong>MICROPHONE</strong>' },
    { token: 'qr_food_court', label: 'ملصق الفود كورت', loc: 'الفود كورت بجانب ثلاجة المشروبات', era: 1, lvl: 3, var: null, content: 'رمز الضيافة: <strong>SALAH-10</strong>' },
  ];

  for (const q of landmarkQrs) {
    await execute(
      `INSERT OR REPLACE INTO qr_tokens (token, label, location_name, era_id, level_number, variant, revealed_content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [q.token, q.label, q.loc, q.era, q.lvl, q.var, q.content]
    );
  }

  console.log('[Seed] Master Specification Seed Completed successfully with 4 Eras, 40 Levels, 120 Variants, 10 Booths, and Catalog Photos!');
}

module.exports = {
  seedGameData,
};
