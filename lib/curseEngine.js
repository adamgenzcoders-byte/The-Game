// ========================================================
// lib/curseEngine.js - The Curse of the Tomb Mechanics
// ========================================================

/**
 * Calculates displayed level and displayed total based on realLevel and offset
 */
function getDisplayProgress(realLevel, offset, levelsPerPath = 10) {
  const rLevel = Number(realLevel) || 1;
  const off = Number(offset) || 0;
  const total = Number(levelsPerPath) || 10;

  return {
    displayedLevel: rLevel + off,
    displayedTotal: total + off,
    realLevel: rLevel,
    offset: off,
  };
}

/**
 * Triggers a curse on a team, computing new destination path, new offset, and resets realLevel to 1.
 * If max curses reached, only penalties are applied without path rerouting.
 *
 * @param {Object} team - Current team record { path_id, real_level, offset, curse_count, score }
 * @param {Array} allPaths - Ordered list of active paths [{ id, slug, destination_curse_path_id, ... }]
 * @param {Object} settings - Game settings { max_curses, curse_penalty, levels_per_path, curse_requires_guardian }
 * @returns {Object} { rerouted, teamUpdates, eventData }
 */
function applyCurse(team, allPaths, settings = {}) {
  const maxCurses = settings.max_curses !== undefined ? Number(settings.max_curses) : 2;
  const cursePenalty = settings.curse_penalty !== undefined ? Number(settings.curse_penalty) : 25;
  const levelsPerPath = settings.levels_per_path !== undefined ? Number(settings.levels_per_path) : 10;
  const curseRequiresGuardian = Boolean(settings.curse_requires_guardian);

  const currentCurseCount = Number(team.curse_count) || 0;
  const currentRealLevel = Number(team.real_level) || 1;
  const currentOffset = Number(team.offset) || 0;
  const currentDisplayedLevel = currentRealLevel + currentOffset;

  const newScore = Math.max(0, (Number(team.score) || 0) - cursePenalty);

  // If already reached max curses, no rerouting occurs
  if (currentCurseCount >= maxCurses) {
    return {
      rerouted: false,
      teamUpdates: {
        score: newScore,
        curse_count: currentCurseCount + 1,
      },
      message: 'لقد أصابتكم لعنة طفيفة أدت لخصم نقاط دون تغيير مساركم (بلغتم الحد الأقصى للعنات المقبرة).',
    };
  }

  // Find next path in cycle
  const currentPathIndex = allPaths.findIndex((p) => p.id === team.path_id);
  let nextPath = null;

  if (currentPathIndex !== -1) {
    const currentPath = allPaths[currentPathIndex];
    if (currentPath.destination_curse_path_id) {
      nextPath = allPaths.find((p) => p.id === currentPath.destination_curse_path_id);
    }
    if (!nextPath) {
      const nextIndex = (currentPathIndex + 1) % allPaths.length;
      nextPath = allPaths[nextIndex];
    }
  } else if (allPaths.length > 0) {
    nextPath = allPaths[0];
  }

  const destinationPathId = nextPath ? nextPath.id : team.path_id;

  // Offset becomes current displayedLevel
  const newOffset = currentDisplayedLevel;
  const newRealLevel = 1;
  const newDisplay = getDisplayProgress(newRealLevel, newOffset, levelsPerPath);

  return {
    rerouted: true,
    teamUpdates: {
      path_id: destinationPathId,
      real_level: newRealLevel,
      offset: newOffset,
      curse_count: currentCurseCount + 1,
      score: newScore,
      is_cursed_active: curseRequiresGuardian ? 1 : 0,
    },
    previousPathId: team.path_id,
    destinationPathId,
    newDisplayedLevel: newDisplay.displayedLevel,
    newDisplayedTotal: newDisplay.displayedTotal,
    message: `لقد أصابتكم لعنة المقبرة! فُتحت لكم مستويات غامضة جديدة وأصبحتم في المستوى ${newDisplay.displayedLevel} من ${newDisplay.displayedTotal}!`,
  };
}

module.exports = {
  getDisplayProgress,
  applyCurse,
};

