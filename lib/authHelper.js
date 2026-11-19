// ========================================================
// lib/authHelper.js - Member Identity, Device Token & Admin Auth
// ========================================================

const { queryOne, execute } = require('./db');
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

function generateMemberId() {
  return `m_${crypto.randomBytes(6).toString('hex')}`;
}

function generateTeamId() {
  return `t_${crypto.randomBytes(5).toString('hex')}`;
}

async function getMemberFromRequest(request) {
  // Check Authorization header or Cookie or Query
  const authHeader = request.headers.get('authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/device_token=([^;]+)/);
    if (match) token = match[1].trim();
  }

  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token');
  }

  if (!token) return null;

  const member = await queryOne(
    `SELECT m.*, t.team_number, t.points, t.name as team_name, t.icon as team_icon, t.era_id, t.variant,
            t.current_level, t.total_penalty_seconds, t.wrong_attempts, t.locked_until,
            t.started_at, t.finished_at,
            e.name as era_name, e.ruler as era_ruler, e.color as era_color, e.icon as era_icon
     FROM members m
     LEFT JOIN teams t ON m.team_id = t.id
     LEFT JOIN eras e ON t.era_id = e.id
     WHERE m.device_token = ?`,
    [token]
  );

  return member || null;
}

function verifyAdmin(request) {
  const adminSecret = process.env.ADMIN_PASSWORD || 'AD@776@z776';
  const authHeader = request.headers.get('x-admin-key') || request.headers.get('authorization');

  if (!authHeader) {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match && match[1] === adminSecret) return true;
    return false;
  }

  const clean = authHeader.replace('Bearer ', '').trim();
  return clean === adminSecret;
}

async function logEvent(teamId, memberId, eventType, payload = {}) {
  try {
    await execute(
      `INSERT INTO event_logs (team_id, member_id, event_type, payload_json, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [teamId || null, memberId || null, eventType, JSON.stringify(payload)]
    );
  } catch (e) {
    console.error('Failed to write event log:', e);
  }
}

module.exports = {
  generateToken,
  generateMemberId,
  generateTeamId,
  getMemberFromRequest,
  verifyAdmin,
  logEvent,
};
