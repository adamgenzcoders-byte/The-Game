// ========================================================
// lib/pathAssigner.js - Server-Side Path & Variant Assigner
// ========================================================

const { query, queryOne } = require('./db');

/**
 * Assigns a path and variant to a new team based on settings
 */
async function assignPathAndVariant(teamName, preferredPathId = null) {
  const settings = (await queryOne('SELECT path_assignment_mode FROM game_settings WHERE id = 1')) || {
    path_assignment_mode: 'ROUND_ROBIN',
  };
  const activePaths = await query('SELECT id, slug, name, sort_order FROM paths WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');

  if (!activePaths || activePaths.length === 0) {
    throw new Error('لا توجد مسارات نشطة متاحة في النظام حالياً.');
  }

  let assignedPathId = activePaths[0].id;

  if (preferredPathId && activePaths.some((p) => p.id === Number(preferredPathId))) {
    assignedPathId = Number(preferredPathId);
  } else if (settings.path_assignment_mode === 'NAME_RANGE') {
    // A-F (Path 1), G-L (Path 2), M-Q (Path 3), R-Z (Path 4)
    const firstChar = teamName.trim().charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'F') {
      assignedPathId = activePaths[0] ? activePaths[0].id : activePaths[0].id;
    } else if (firstChar >= 'G' && firstChar <= 'L') {
      assignedPathId = activePaths[1] ? activePaths[1].id : activePaths[0].id;
    } else if (firstChar >= 'M' && firstChar <= 'Q') {
      assignedPathId = activePaths[2] ? activePaths[2].id : activePaths[0].id;
    } else if (firstChar >= 'R' && firstChar <= 'Z') {
      assignedPathId = activePaths[3] ? activePaths[3].id : activePaths[0].id;
    } else {
      // Arabic or other initials -> Fallback to least populated path
      assignedPathId = await getLeastPopulatedPathId(activePaths);
    }
  } else {
    // Default: ROUND_ROBIN / Least Populated to maintain perfect balance
    assignedPathId = await getLeastPopulatedPathId(activePaths);
  }

  // Assign Variant (A or B) in a balanced way for this path
  const variants = await query('SELECT id, code FROM route_variants WHERE path_id = ? ORDER BY id ASC', [assignedPathId]);
  let assignedVariantId = null;

  if (variants && variants.length > 0) {
    // Count teams on each variant for this path
    const variantCounts = await query(
      `SELECT variant_id, COUNT(*) as c FROM teams WHERE path_id = ? AND variant_id IS NOT NULL GROUP BY variant_id`,
      [assignedPathId]
    );
    const countMap = {};
    variants.forEach((v) => (countMap[v.id] = 0));
    variantCounts.forEach((r) => {
      countMap[r.variant_id] = Number(r.c);
    });

    // Pick variant with minimum count
    let minCount = Infinity;
    for (const v of variants) {
      if (countMap[v.id] < minCount) {
        minCount = countMap[v.id];
        assignedVariantId = v.id;
      }
    }
  }

  return {
    pathId: assignedPathId,
    variantId: assignedVariantId,
  };
}

async function getLeastPopulatedPathId(activePaths) {
  const counts = await query(`SELECT path_id, COUNT(*) as c FROM teams GROUP BY path_id`);
  const countMap = {};
  activePaths.forEach((p) => (countMap[p.id] = 0));
  counts.forEach((r) => {
    countMap[r.path_id] = Number(r.c);
  });

  let minCount = Infinity;
  let selectedId = activePaths[0].id;

  for (const p of activePaths) {
    if (countMap[p.id] < minCount) {
      minCount = countMap[p.id];
      selectedId = p.id;
    }
  }

  return selectedId;
}

module.exports = {
  assignPathAndVariant,
};

