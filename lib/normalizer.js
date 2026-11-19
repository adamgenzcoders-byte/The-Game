// ========================================================
// lib/normalizer.js - Smart Arabic & Multi-Format Normalizer
// ========================================================

/**
 * Normalizes text specifically for Egyptian Arabic, English, and numeric inputs
 */
function normalizeAnswer(input) {
  if (input === null || input === undefined) return '';
  let str = String(input).trim();

  // 1. Lowercase English letters
  str = str.toLowerCase();

  // 2. Normalize Eastern Arabic numerals (٠-٩) to Western (0-9)
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.split(easternDigits[i]).join(String(i));
  }

  // 3. Remove Arabic Tashkeel (diacritics: Fathah, Dammah, Kasrah, Sukun, Tanween, Shaddah)
  str = str.replace(/[\u064B-\u0652\u0670\u0640]/g, '');

  // 4. Normalize Alef variants: [أ, إ, آ, ٱ] -> ا
  str = str.replace(/[أإآٱ]/g, 'ا');

  // 5. Normalize Yaa / Alef Maqsura: ى -> ي
  str = str.replace(/ى/g, 'ي');

  // 6. Normalize Taa Marbouta: ة -> ه
  str = str.replace(/ة/g, 'ه');

  // 7. Strip common Arabic punctuation and extraneous symbols
  str = str.replace(/[،؛؟«»"'.!?:;\-_/\\()[\]{}|]/g, ' ');

  // 8. Collapse multiple whitespace into a single space
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Checks submitted answer against an array of accepted answers
 * Supports both normalized text match, exact numeric/PIN match, and multiple choice
 */
function checkAnswer(submitted, validAnswersArray, method = 'TEXT') {
  if (!submitted || !validAnswersArray) return false;

  const validList = Array.isArray(validAnswersArray)
    ? validAnswersArray
    : [validAnswersArray];

  const normalizedSubmitted = normalizeAnswer(submitted);

  if (method === 'PIN' || method === 'NUMERIC') {
    const cleanSub = normalizedSubmitted.replace(/\D/g, '');
    return validList.some((v) => normalizeAnswer(v).replace(/\D/g, '') === cleanSub);
  }

  return validList.some((v) => {
    const normalizedTarget = normalizeAnswer(v);
    return normalizedSubmitted === normalizedTarget;
  });
}

module.exports = {
  normalizeAnswer,
  checkAnswer,
};
