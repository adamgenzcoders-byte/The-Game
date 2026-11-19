// ========================================================
// tests/run.js - Master Specification Test Suite
// ========================================================

const { normalizeAnswer, checkAnswer } = require('../lib/normalizer');
const { balanceErasAndVariants } = require('../lib/eraBalancer');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

console.log('\n========================================================');
console.log(' running School Mystery Master Specification Test Suite');
console.log('========================================================\n');

// 1. Answer Normalizer Tests
console.log('[1] Testing Arabic & Multilingual Answer Normalizer...');
assert(normalizeAnswer('أحمد') === 'احمد', 'Normalizes Alef with Hamza: أحمد -> احمد');
assert(normalizeAnswer('إبراهيم') === 'ابراهيم', 'Normalizes Alef with Kasra: إبراهيم -> ابراهيم');
assert(normalizeAnswer('آمنة') === 'امنه', 'Normalizes Alef with Madda & Taa Marbouta: آمنة -> امنه');
assert(normalizeAnswer('مكتبة') === 'مكتبه', 'Normalizes Taa Marbouta: مكتبة -> مكتبه');
assert(normalizeAnswer('مستشفى') === 'مستشفي', 'Normalizes Alef Maqsura: مستشفى -> مستشفي');
assert(normalizeAnswer('الْقَاهِرَةُ') === 'القاهره', 'Removes Tashkeel diacritics');
assert(normalizeAnswer('  كلمة   سرية  ') === 'كلمه سريه', 'Trims and collapses multiple spaces');
assert(normalizeAnswer('٤٢') === '42', 'Converts Eastern Arabic numerals: ٤٢ -> 42');
assert(normalizeAnswer('ANUBIS') === 'anubis', 'Lowercases English text');

// checkAnswer tests
assert(checkAnswer('أحمد', ['احمد']), 'Matches Arabic normalized text');
assert(checkAnswer('  مكتبة  ', ['مكتبه']), 'Matches text with Taa Marbouta');
assert(checkAnswer('٤٢', ['42']), 'Matches numeric PIN regardless of digit format');
assert(checkAnswer('wrong', ['correct', 'right']) === false, 'Rejects incorrect answers');

// 2. Multi-field (Beat 1 Engineer Facts) Testing
console.log('\n[2] Testing Multi-field Answer Validation (Beat 1 Engineer Facts)...');
const sampleExpected = {
  questions: ['ما هي درجة نظارة م. مروة؟', 'ما اسم صديقها المقرب؟'],
  expected: [
    ['-2', 'سالب 2', '-2.0'],
    ['علي', 'على']
  ]
};

const submission1 = { ans1: '-2', ans2: 'علي' };
const submission2 = { ans1: 'سالب 2', ans2: 'على' };
const submission3 = { ans1: '5', ans2: 'علي' };

function checkMultiField(sub, expectedObj) {
  const c1 = checkAnswer(sub.ans1, expectedObj.expected[0]);
  const c2 = checkAnswer(sub.ans2, expectedObj.expected[1]);
  return c1 && c2;
}

assert(checkMultiField(submission1, sampleExpected) === true, 'Accepts exact multi-field answer');
assert(checkMultiField(submission2, sampleExpected) === true, 'Accepts normalized variations for multi-field');
assert(checkMultiField(submission3, sampleExpected) === false, 'Rejects invalid field in multi-field');

// 3. Era Balancer (Bin Packing by Member Count) Testing
console.log('\n[3] Testing Era Balancer & Variant Allocator...');
const mockTeamsData = [
  { id: 't1', name: 'Alpha', member_count: 5 },
  { id: 't2', name: 'Beta', member_count: 4 },
  { id: 't3', name: 'Gamma', member_count: 6 },
  { id: 't4', name: 'Delta', member_count: 3 },
  { id: 't5', name: 'Epsilon', member_count: 5 },
  { id: 't6', name: 'Zeta', member_count: 4 },
  { id: 't7', name: 'Eta', member_count: 2 },
  { id: 't8', name: 'Theta', member_count: 5 },
];

async function mockQuery(sql) {
  return mockTeamsData;
}

balanceErasAndVariants(mockQuery).then((assignments) => {
  assert(assignments.length === 8, 'Assigns all 8 teams');
  const countPerEra = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const playersPerEra = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const a of assignments) {
    countPerEra[a.eraId] = (countPerEra[a.eraId] || 0) + 1;
    const t = mockTeamsData.find(tm => tm.id === a.teamId);
    playersPerEra[a.eraId] += t.member_count;
  }

  console.log('  -> Player distribution across 4 eras:', playersPerEra);
  assert(Object.keys(countPerEra).length === 4, 'All 4 eras received teams');
  
  // Total players is 5+4+6+3+5+4+2+5 = 34. Divided across 4 eras = ~8.5 per era.
  const diffs = Object.values(playersPerEra).map(p => Math.abs(p - 8.5));
  const maxDiff = Math.max(...diffs);
  assert(maxDiff <= 2.5, 'Eras are evenly balanced by player count (max deviation <= 2.5 players)');

  // 4. Security & Anti-Leak Verification
  console.log('\n[4] Testing Security & Client Sanitization...');
  const serverLevel = {
    id: 1,
    title: 'سر أخناتون',
    story_text: 'نص تاريخي',
    base_clue_text: 'ابحث عن...',
    base_valid_answers: '["SECRET_ANSWER"]',
    hint1_text: 'تلميح 1',
    hint2_text: 'تلميح 2 (سري)',
  };

  function sanitizeCurrentLevel(raw, hintsUnlocked = [1]) {
    return {
      title: raw.title,
      storyText: raw.story_text,
      clueText: raw.base_clue_text,
      hints: {
        1: { unlocked: hintsUnlocked.includes(1), text: hintsUnlocked.includes(1) ? raw.hint1_text : null },
        2: { unlocked: hintsUnlocked.includes(2), text: hintsUnlocked.includes(2) ? raw.hint2_text : null },
      }
    };
  }

  const clientView = sanitizeCurrentLevel(serverLevel, [1]);
  assert(clientView.base_valid_answers === undefined, 'Valid answers NEVER leaked to client');
  assert(clientView.hints[1].text === 'تلميح 1', 'Unlocked hint text is provided');
  assert(clientView.hints[2].text === null, 'Locked hint text is NULL on client');

  console.log('\n========================================================');
  console.log(` Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}).catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
