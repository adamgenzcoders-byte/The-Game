// ========================================================
// lib/eraBalancer.js - Player-Count Aware Era & Variant Balancer
// ========================================================

/**
 * Balances teams across the 4 eras by TOTAL PLAYER COUNT (not just team count)
 * Then assigns Variants A, B, C in round-robin within each era.
 *
 * @param {Array|Function} teamsOrQuery - Array of { id, name, memberCount } or query function
 * @param {Array} eras - Array of { id, name } or [1, 2, 3, 4]
 * @returns {Promise<Array>|Array} Array of { teamId, eraId, variant, memberCount }
 */
async function balanceErasAndVariants(teamsOrQuery, eras = [1, 2, 3, 4]) {
  let teamsWithMembers = [];

  if (typeof teamsOrQuery === 'function') {
    // Query teams and member counts from DB
    const rows = await teamsOrQuery(`
      SELECT t.id, t.name, COUNT(m.id) as member_count
      FROM teams t
      LEFT JOIN members m ON m.team_id = t.id
      GROUP BY t.id
    `);
    teamsWithMembers = rows.map(r => ({
      id: r.id,
      name: r.name,
      memberCount: Number(r.member_count || r.memberCount || 1),
    }));
  } else if (Array.isArray(teamsOrQuery)) {
    teamsWithMembers = teamsOrQuery.map(t => ({
      id: t.id,
      name: t.name,
      memberCount: Number(t.memberCount || t.member_count || 1),
    }));
  }

  if (!teamsWithMembers || teamsWithMembers.length === 0) return [];

  // Shuffle teams for fairness, then sort descending by member count (Greedy Bin Packing)
  const shuffled = [...teamsWithMembers].sort(() => Math.random() - 0.5);
  shuffled.sort((a, b) => (b.memberCount || 1) - (a.memberCount || 1));

  // Initialize 4 Era bins
  const eraBins = eras.map((era) => ({
    eraId: typeof era === 'object' ? era.id : era,
    totalPlayers: 0,
    teams: [],
  }));

  // Distribute each team to the era with the lowest totalPlayers count
  for (const team of shuffled) {
    eraBins.sort((a, b) => a.totalPlayers - b.totalPlayers);
    const targetBin = eraBins[0];

    targetBin.teams.push(team);
    targetBin.totalPlayers += team.memberCount || 1;
  }

  // Inside each Era bin, assign Variants A, B, C in a balanced round-robin
  const results = [];
  const variants = ['A', 'B', 'C'];

  for (const bin of eraBins) {
    bin.teams.forEach((team, index) => {
      const variant = variants[index % variants.length];
      results.push({
        teamId: team.id,
        teamName: team.name,
        eraId: bin.eraId,
        variant,
        memberCount: team.memberCount || 1,
      });
    });
  }

  return results;
}

module.exports = {
  balanceErasAndVariants,
};
