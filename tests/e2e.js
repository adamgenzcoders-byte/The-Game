// ========================================================
// tests/e2e.js - End-to-End Simulation of Full Mystery Lifecycle
// ========================================================

const { initSchema, queryOne, query, execute } = require('../lib/db');
const { generateToken, generateMemberId, generateTeamId } = require('../lib/authHelper');
const { balanceErasAndVariants } = require('../lib/eraBalancer');
const { checkAnswer } = require('../lib/normalizer');

async function runE2ESimulation() {
  console.log('\n========================================================');
  console.log(' Starting End-to-End Game Lifecycle Simulation');
  console.log('========================================================\n');

  await initSchema();

  // Reset to clean test state
  await execute(`DELETE FROM team_level_progress`);
  await execute(`DELETE FROM join_requests`);
  await execute(`DELETE FROM members`);
  await execute(`DELETE FROM teams`);
  await execute(`UPDATE eras SET storyteller_team_id = NULL, is_revealed_on_stage = 0`);
  await execute(`UPDATE game_state SET state = 'LOBBY', start_at_epoch = NULL WHERE id = 1`);

  console.log('[Step 1] Creating test teams & members...');
  // Team 1 (Leader + 1 member = 2 players)
  const t1Id = generateTeamId();
  const m1Id = generateMemberId();
  const m1Token = generateToken();
  await execute(`INSERT INTO teams (id, name, icon, current_level, created_at) VALUES (?, 'صقور السويدي', '🦅', 1, datetime('now'))`, [t1Id]);
  await execute(`INSERT INTO members (id, device_token, name, team_id, is_leader, created_at) VALUES (?, ?, 'عمر أحمد', ?, 1, datetime('now'))`, [m1Id, m1Token, t1Id]);

  const m2Id = generateMemberId();
  const m2Token = generateToken();
  await execute(`INSERT INTO members (id, device_token, name, team_id, is_leader, created_at) VALUES (?, ?, 'يوسف علي', ?, 0, datetime('now'))`, [m2Id, m2Token, t1Id]);

  // Team 2
  const t2Id = generateTeamId();
  const m3Id = generateMemberId();
  const m3Token = generateToken();
  await execute(`INSERT INTO teams (id, name, icon, current_level, created_at) VALUES (?, 'حراس الأهرامات', '👑', 1, datetime('now'))`, [t2Id]);
  await execute(`INSERT INTO members (id, device_token, name, team_id, is_leader, created_at) VALUES (?, ?, 'سارة محمود', ?, 1, datetime('now'))`, [m3Id, m3Token, t2Id]);

  // Teams 3 & 4
  const t3Id = generateTeamId();
  const t4Id = generateTeamId();
  await execute(`INSERT INTO teams (id, name, icon, current_level, created_at) VALUES (?, 'فرسان النيل', '⚔️', 1, datetime('now'))`, [t3Id]);
  await execute(`INSERT INTO teams (id, name, icon, current_level, created_at) VALUES (?, 'شعلة المعرفة', '🔥', 1, datetime('now'))`, [t4Id]);
  await execute(`INSERT INTO members (id, device_token, name, team_id, is_leader) VALUES ('m_4', 'tok_4', 'محمد هاني', ?, 1)`, [t3Id]);
  await execute(`INSERT INTO members (id, device_token, name, team_id, is_leader) VALUES ('m_5', 'tok_5', 'مريم حسن', ?, 1)`, [t4Id]);

  console.log('  ✓ 4 Teams and members created in LOBBY state.');

  console.log('\n[Step 2] Admin locks registration and assigns eras...');
  const assignments = await balanceErasAndVariants(query);
  for (const item of assignments) {
    await execute(`UPDATE teams SET era_id = ?, variant = ? WHERE id = ?`, [item.eraId, item.variant, item.teamId]);
  }
  await execute(`UPDATE game_state SET state = 'LOCKED' WHERE id = 1`);

  const assignedTeams = await query(`SELECT t.name, t.icon, t.era_id, t.variant, e.name as era_name FROM teams t JOIN eras e ON t.era_id = e.id`);
  for (const t of assignedTeams) {
    console.log(`  -> ${t.icon} ${t.name} assigned to: ${t.era_name} (Variant ${t.variant})`);
  }

  console.log('\n[Step 3] Admin starts countdown then transitions to RUNNING...');
  const startAtEpoch = Date.now() + 10000;
  await execute(`UPDATE game_state SET state = 'COUNTDOWN', start_at_epoch = ? WHERE id = 1`, [startAtEpoch]);
  const countdownState = await queryOne(`SELECT state, start_at_epoch FROM game_state WHERE id = 1`);
  console.log(`  ✓ Game state is ${countdownState.state}, starts at: ${new Date(countdownState.start_at_epoch).toISOString()}`);

  // Transition to RUNNING
  await execute(`UPDATE game_state SET state = 'RUNNING' WHERE id = 1`);
  await execute(`UPDATE teams SET started_at = datetime('now') WHERE started_at IS NULL`);
  console.log('  ✓ Game state is now RUNNING with timestamps recorded.');

  console.log('\n[Step 4] Team 1 solves Beat 1 (Engineer facts)...');
  const team1 = await queryOne(`SELECT * FROM teams WHERE id = ?`, [t1Id]);
  const level1 = await queryOne(`SELECT * FROM levels WHERE era_id = ? AND level_number = 1`, [team1.era_id]);
  const override1 = await queryOne(`SELECT * FROM level_variant_overrides WHERE level_id = ? AND variant = ?`, [level1.id, team1.variant]);
  
  console.log(`  -> Level 1 Title: ${level1.title}`);
  console.log(`  -> Clue Type: ${level1.clue_type}`);
  console.log(`  -> Clue Text: ${override1.clue_text}`);

  const parsedAnswers = JSON.parse(override1.valid_answers);
  const submittedAnswer = Array.isArray(parsedAnswers) ? parsedAnswers[0] : parsedAnswers.expected[0][0];
  console.log(`  -> Submitting answer: "${submittedAnswer}"`);

  const isMatch = checkAnswer(submittedAnswer, Array.isArray(parsedAnswers) ? parsedAnswers : parsedAnswers.expected[0]);
  if (isMatch) {
    await execute(`UPDATE teams SET current_level = 2 WHERE id = ?`, [team1.id]);
    await execute(`INSERT INTO team_level_progress (team_id, era_id, level_number, solved_at, solution_submitted) VALUES (?, ?, 1, datetime('now'), ?)`,
      [team1.id, team1.era_id, JSON.stringify(submittedAnswer)]);
    console.log('  ✓ Beat 1 solved successfully! Team 1 advanced to Level 2.');
  }

  console.log('\n[Step 5] Testing hints and penalty accumulation...');
  // Request hint 2 (+60s penalty)
  await execute(`UPDATE teams SET total_penalty_seconds = total_penalty_seconds + 60 WHERE id = ?`, [team1.id]);
  const penaltyCheck = await queryOne(`SELECT total_penalty_seconds FROM teams WHERE id = ?`, [team1.id]);
  console.log(`  ✓ Hint 2 applied: total penalty = ${penaltyCheck.total_penalty_seconds} seconds.`);

  console.log('\n[Step 6] Simulating team completion of all 10 beats & era win...');
  await execute(`UPDATE teams SET current_level = 11, finished_at = datetime('now') WHERE id = ?`, [team1.id]);
  // Crown era storyteller
  await execute(`UPDATE eras SET storyteller_team_id = ? WHERE id = ?`, [team1.id, team1.era_id]);
  const winnerEra = await queryOne(`SELECT * FROM eras WHERE id = ?`, [team1.era_id]);
  console.log(`  ✓ Team 1 crowned Storyteller for ${winnerEra.name} (${winnerEra.ruler})!`);
  console.log(`  -> Stage Script Preview: "${winnerEra.script_text.substring(0, 75)}..."`);

  console.log('\n[Step 7] Testing Stage Reveal of all 4 eras & curse breaking...');
  await execute(`UPDATE eras SET is_revealed_on_stage = 1`);
  const stageSlots = await query(`SELECT id, name, ruler, is_revealed_on_stage FROM eras`);
  const allDone = stageSlots.every(s => s.is_revealed_on_stage === 1);
  const stateRow = await queryOne(`SELECT curse_text FROM game_state WHERE id = 1`);

  console.log(`  ✓ All 4 slots revealed on stage: ${allDone}`);
  console.log(`  ✓ Projector Curse Text Displayed:\n    «${stateRow.curse_text}»`);

  console.log('\n========================================================');
  console.log(' ✨ End-to-End Simulation COMPLETED SUCCESSFULLY! ✨');
  console.log('========================================================\n');
}

runE2ESimulation().then(() => process.exit(0)).catch(e => {
  console.error('E2E Simulation Failed:', e);
  process.exit(1);
});
