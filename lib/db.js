// ========================================================
// lib/db.js - Universal Database Connection & Schema Init
// ========================================================

let client = null;
let isPostgres = false;

function getDbClient() {
  if (client) return { client, isPostgres };

  // Support Vercel Turso Integration variables, direct Turso, Neon/Postgres, or fallback
  const dbUrl = process.env.TURSO_DATABASE_URL || 
                process.env.TURSO_DB_URL || 
                process.env.DATABASE_URL || 
                process.env.POSTGRES_URL || 
                'file:./chronicle.db';

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    const { Pool } = require('pg');
    isPostgres = true;
    client = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
    });
    console.log('[DB] Connected to PostgreSQL (Vercel / Neon / Supabase)');
  } else {
    const { createClient } = require('@libsql/client');
    isPostgres = false;
    const tursoToken = process.env.TURSO_AUTH_TOKEN || 
                       process.env.TURSO_DB_AUTH_TOKEN || 
                       process.env.LIBSQL_AUTH_TOKEN;
    client = createClient({
      url: dbUrl,
      authToken: tursoToken,
    });
    console.log(`[DB] Connected to LibSQL / Turso (${dbUrl.split('?')[0]})`);
  }

  return { client, isPostgres };
}

function formatSqlForPg(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

async function query(sql, params = []) {
  const { client, isPostgres } = getDbClient();
  try {
    if (isPostgres) {
      const pgSql = formatSqlForPg(sql);
      const res = await client.query(pgSql, params);
      return res.rows;
    } else {
      const res = await client.execute({ sql, args: params });
      return res.rows;
    }
  } catch (err) {
    console.error(`[DB Query Error]: ${err.message}`, { sql, params });
    throw err;
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function execute(sql, params = []) {
  const { client, isPostgres } = getDbClient();
  try {
    if (isPostgres) {
      const pgSql = formatSqlForPg(sql);
      const res = await client.query(pgSql, params);
      return {
        changes: res.rowCount,
        lastInsertRowid: res.rows && res.rows[0] && res.rows[0].id ? res.rows[0].id : null,
      };
    } else {
      const res = await client.execute({ sql, args: params });
      return {
        changes: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : null,
      };
    }
  } catch (err) {
    console.error(`[DB Exec Error]: ${err.message}`, { sql, params });
    throw err;
  }
}

async function executeBatch(statements) {
  const { client, isPostgres } = getDbClient();
  for (const stmt of statements) {
    if (stmt.trim()) {
      if (isPostgres) {
        await client.query(stmt);
      } else {
        await client.execute(stmt);
      }
    }
  }
}

let initialized = false;

async function initSchema() {
  if (initialized) return;

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY,
      state TEXT DEFAULT 'LOBBY',
      start_at_epoch INTEGER,
      admin_password_hash TEXT,
      hint2_penalty_seconds INTEGER DEFAULT 60,
      hint3_penalty_seconds INTEGER DEFAULT 120,
      wrong_lockout_seconds INTEGER DEFAULT 30,
      curse_text TEXT DEFAULT 'كما محوتَ اسمي من التاريخ، سأمحو حقيقة كل من يأتي بعدك. لن ينتهي هذا الانتقام حتى يعود آخر وريث من سلالتي.',
      safety_banner TEXT DEFAULT 'انظر فقط ولا تلمس أجهزة الطوارئ. امشِ ولا تركض.',
      announcement_text TEXT,
      announcement_era_id INTEGER,
      announcement_at INTEGER,
      updated_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      device_token TEXT UNIQUE,
      name TEXT NOT NULL,
      team_id TEXT,
      is_leader INTEGER DEFAULT 0,
      can_submit INTEGER DEFAULT 0,
      created_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      team_number INTEGER DEFAULT 1,
      name TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      era_id INTEGER,
      variant TEXT DEFAULT 'A',
      current_level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 100,
      total_penalty_seconds INTEGER DEFAULT 0,
      wrong_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS join_requests (
      id INTEGER PRIMARY KEY,
      team_id TEXT,
      member_id TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS eras (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      ruler TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      script_text TEXT NOT NULL,
      storyteller_team_id TEXT,
      is_revealed_on_stage INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY,
      era_id INTEGER,
      level_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      story_text TEXT NOT NULL,
      clue_type TEXT NOT NULL,
      base_clue_text TEXT NOT NULL,
      base_answer_types TEXT NOT NULL,
      base_valid_answers TEXT NOT NULL,
      hint1_text TEXT,
      hint2_text TEXT,
      hint3_text TEXT,
      photo_catalog_id INTEGER,
      photo_filename TEXT,
      safety_warning INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS level_variant_overrides (
      id INTEGER PRIMARY KEY,
      level_id INTEGER,
      variant TEXT NOT NULL,
      clue_text TEXT,
      valid_answers TEXT,
      location_target TEXT,
      qr_token TEXT,
      booth_reward_code TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS booths (
      id INTEGER PRIMARY KEY,
      era_id INTEGER,
      level_number INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      rules_ar TEXT NOT NULL,
      win_condition TEXT NOT NULL,
      safety_notes TEXT,
      organizer_script TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_variant_a TEXT NOT NULL,
      reward_variant_b TEXT NOT NULL,
      reward_variant_c TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS staff_engineers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      facts_json TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS qr_tokens (
      token TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      location_name TEXT NOT NULL,
      era_id INTEGER,
      level_number INTEGER,
      variant TEXT,
      revealed_content TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS team_level_progress (
      id INTEGER PRIMARY KEY,
      team_id TEXT,
      era_id INTEGER,
      level_number INTEGER,
      solved_at TEXT,
      solution_submitted TEXT,
      hints_used TEXT DEFAULT '[]',
      time_spent_seconds INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS event_logs (
      id INTEGER PRIMARY KEY,
      team_id TEXT,
      member_id TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT
    );`
  ];

  await executeBatch(schemaStatements);

  // Safe migrations for game duration, timer, team number, points, roles and announcements
  try { await execute(`ALTER TABLE game_state ADD COLUMN duration_minutes INTEGER DEFAULT 180`); } catch (e) {}
  try { await execute(`ALTER TABLE game_state ADD COLUMN end_at_epoch INTEGER`); } catch (e) {}
  try { await execute(`ALTER TABLE game_state ADD COLUMN announcement_text TEXT`); } catch (e) {}
  try { await execute(`ALTER TABLE game_state ADD COLUMN announcement_era_id INTEGER`); } catch (e) {}
  try { await execute(`ALTER TABLE game_state ADD COLUMN announcement_at INTEGER`); } catch (e) {}
  try { await execute(`ALTER TABLE teams ADD COLUMN team_number INTEGER DEFAULT 1`); } catch (e) {}
  try { await execute(`ALTER TABLE teams ADD COLUMN points INTEGER DEFAULT 100`); } catch (e) {}
  try { await execute(`ALTER TABLE members ADD COLUMN can_submit INTEGER DEFAULT 0`); } catch (e) {}
  try { await execute(`ALTER TABLE team_level_progress ADD COLUMN clue2_revealed INTEGER DEFAULT 0`); } catch (e) {}

  // Cleanup any legacy HTML tags inside qr_tokens
  try {
    await execute(`UPDATE qr_tokens SET revealed_content = REPLACE(REPLACE(revealed_content, '<strong>', ''), '</strong>', '') WHERE revealed_content LIKE '%<%>%'`);
  } catch (e) {}

  // Update target photos, locations and hint descriptions for live database
  try {
    await execute(`
      UPDATE levels SET 
        photo_filename = 'IMG20261118155324.jpg',
        base_clue_text = 'توجهوا إلى موقع الصورة الموضحة (بجوار أحد سلالم المدرسة) وامسحوا رمز الـ QR المعلق بجانبه.',
        hint1_text = 'الدليل موجود بجوار السلم بالدور الثالث.',
        hint2_text = 'ابحثوا بدقة بجوار درجات الصعود بالدور الثالث عند العلامة الموضحة بالصورة.',
        hint3_text = 'امسحوا كود الـ QR الموجود عند السلم للحصول على الرمز.'
      WHERE era_id = 1 AND level_number = 2
    `);
    await execute(`
      UPDATE levels SET 
        photo_filename = 'target_1.jpeg',
        base_clue_text = 'ابحثوا عن موقع الهدف الأول الموضح في الصورة بدقة لكشف رسالة الغريب.',
        hint1_text = 'الهدف موجود في كورنر من كورنرات المدرسة.',
        hint2_text = 'صورة توضيحية لكورنر الموقع بالمدرسة: [img: /media/catalog/hint_target_1.jpeg]',
        hint3_text = 'افحصوا الزاوية الداخلية للكورنر الموضح بالصورة بدقة للحصول على كود الحل.'
      WHERE era_id = 2 AND level_number = 2
    `);
    await execute(`
      UPDATE levels SET 
        photo_filename = 'target_2.jpeg',
        base_clue_text = 'توجهوا إلى موقع الهدف الثاني (جدار السور الموضح بالصورة) وامسحوا كود الـ QR المعلق بجانبه.',
        hint1_text = 'صورة مساعدة أولى للهدف: [img: /media/catalog/hint_target_2_1.jpeg]',
        hint2_text = 'إنه على جدار من أسوار المدرسة.',
        hint3_text = 'صورة مقربة لموقع الجدار وسوره: [img: /media/catalog/hint_target_2_2.jpeg]'
      WHERE era_id = 3 AND level_number = 2
    `);
    await execute(`
      UPDATE levels SET 
        photo_filename = 'target_3_eye.jpeg',
        base_clue_text = 'ابحثوا عن رمز العين الموضح بالصورة في أرجاء المدرسة وامسحوا كود الـ QR.',
        hint1_text = 'العين دي هي بداية ونهاية كل شيء، يعني موجودة في مكان في بداية ونهاية كل حاجة في اليوم الدراسي.',
        hint2_text = 'إنه في وش البانر ده بمسافة كويسة: [img: /media/catalog/hint_target_3.jpeg]',
        hint3_text = 'موجود في البانر اللي في الكاونتر اللي فيه صور الطلبة في صورة إيد الطالبة زينة اللي اتخرجت من أول دفعة.'
      WHERE era_id = 4 AND level_number = 2
    `);
    await execute(`
      UPDATE levels SET 
        photo_filename = 'target_last_hardest.jpeg',
        hint1_text = 'إنه جنب سلم.',
        hint2_text = 'جنب سلم من سلالم الجزء الخلفي للمدرسة.',
        hint3_text = 'موجود على علبة الحبارة اللي جنب باب المخزن اللي عند السلم اللي جنب مصلى الرجال.'
      WHERE era_id = 1 AND level_number = 10
    `);

    await execute(`UPDATE qr_tokens SET location_name = 'بجوار السلم - الدور الثالث (مبنى الفصول)' WHERE token IN ('qr_e1_l2_a', 'qr_e1_l2_b', 'qr_e1_l2_c', 'qr_stairs_2')`);
    await execute(`UPDATE qr_tokens SET location_name = 'كورنر من كورنرات المدرسة (تارجيت 1)' WHERE token IN ('qr_e2_l2_a', 'qr_e2_l2_b', 'qr_e2_l2_c', 'qr_stairs_3')`);
    await execute(`UPDATE qr_tokens SET location_name = 'جدار من أسوار المدرسة (تارجت 2)' WHERE token IN ('qr_e3_l2_a', 'qr_e3_l2_b', 'qr_e3_l2_c', 'qr_stairs_4')`);
    await execute(`UPDATE qr_tokens SET location_name = 'كاونتر صور الطلبة - علامة العين (تارجيت 3)' WHERE token IN ('qr_e4_l2_a', 'qr_e4_l2_b', 'qr_e4_l2_c', 'qr_stairs_archive')`);
    await execute(`UPDATE qr_tokens SET location_name = 'علبة الحبارة جنب باب المخزن عند السلم بجوار مصلى الرجال (التارجيت الأصعب)' WHERE token = 'qr_grand_hall'`);
  } catch (e) {}

  initialized = true;

  // Run Seed if empty
  const { seedGameData } = require('./seedEngine');
  await seedGameData(query, queryOne, execute);
}

module.exports = {
  getDbClient,
  query,
  queryOne,
  execute,
  executeBatch,
  initSchema,
};
