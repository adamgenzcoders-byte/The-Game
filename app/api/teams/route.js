// ========================================================
// app/api/teams/route.js - Team Creation & List
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, generateTeamId, logEvent } from '@/lib/authHelper';

export const ICONS_LIST = [
  '👑', '⚔️', '🛡️', '🦅', '🦁', '📜',
  '⚖️', '🗝️', '🏺', '🧭', '🔮', '🏛️',
  '🔥', '🌊', '☀️', '🌙', '⭐', '🏹',
  '🐎', '⚓', '🔔', '🔱', '💎', '🕯️'
];

export async function GET(request) {
  try {
    await initSchema();
    const teams = await query(`
      SELECT t.id, t.name, t.icon, t.era_id, t.variant, t.current_level,
             e.name as era_name, e.color as era_color, e.icon as era_icon,
             COUNT(m.id) as member_count
      FROM teams t
      LEFT JOIN eras e ON t.era_id = e.id
      LEFT JOIN members m ON m.team_id = t.id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);

    // Fetch members for each team
    const members = await query(`SELECT id, name, team_id, is_leader FROM members WHERE team_id IS NOT NULL`);
    const membersByTeam = {};
    for (const m of members) {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push({
        id: m.id,
        name: m.name,
        is_leader: Boolean(m.is_leader)
      });
    }

    const takenIcons = teams.map(t => t.icon).filter(Boolean);

    return NextResponse.json({
      teams: teams.map(t => ({
        ...t,
        members: membersByTeam[t.id] || [],
      })),
      takenIcons,
      allIcons: ICONS_LIST,
    });
  } catch (err) {
    console.error('Teams GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member) {
      return NextResponse.json({ error: 'غير مصرح لك. يرجى تسجيل الاسم أولاً' }, { status: 401 });
    }

    // Check game state: must be LOBBY
    const gameState = await queryOne(`SELECT state FROM game_state WHERE id = 1`);
    if (gameState && gameState.state !== 'LOBBY') {
      return NextResponse.json({ error: 'تم إغلاق باب التسجيل وبدء المرحلة' }, { status: 400 });
    }

    // Check if member is already in a team
    if (member.team_id) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في فريق آخر' }, { status: 400 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    const icon = (body.icon || '').trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'اسم الفريق يجب أن يكون حرفين على الأقل' }, { status: 400 });
    }

    if (!icon || !ICONS_LIST.includes(icon)) {
      return NextResponse.json({ error: 'يرجى اختيار أيقونة صالحة من القائمة' }, { status: 400 });
    }

    // Check unique name
    const existingName = await queryOne(`SELECT id FROM teams WHERE LOWER(name) = LOWER(?)`, [name]);
    if (existingName) {
      return NextResponse.json({ error: 'اسم الفريق مستخدم بالفعل. اختر اسماً آخر' }, { status: 400 });
    }

    // Check icon not taken
    const existingIcon = await queryOne(`SELECT id FROM teams WHERE icon = ?`, [icon]);
    if (existingIcon) {
      return NextResponse.json({ error: 'هذه الأيقونة محجوزة لفريق آخر. اختر أيقونة أخرى' }, { status: 400 });
    }

    const teamId = generateTeamId();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO teams (id, name, icon, current_level, created_at) VALUES (?, ?, ?, 1, ?)`,
      [teamId, name, icon, now]
    );

    // Make current member the leader
    await execute(
      `UPDATE members SET team_id = ?, is_leader = 1 WHERE id = ?`,
      [teamId, member.id]
    );

    await logEvent(teamId, member.id, 'TEAM_CREATED', { teamName: name, icon });

    return NextResponse.json({
      success: true,
      team: {
        id: teamId,
        name,
        icon,
      }
    });
  } catch (err) {
    console.error('Teams POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

