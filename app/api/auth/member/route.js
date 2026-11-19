// ========================================================
// app/api/auth/member/route.js - Member Identity & Device Token
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, query, execute } from '@/lib/db';
import { generateToken, generateMemberId, getMemberFromRequest } from '@/lib/authHelper';

export async function GET(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get team members if in team
    let teamMembers = [];
    if (member.team_id) {
      teamMembers = await query(
        `SELECT id, name, is_leader, can_submit, device_token FROM members WHERE team_id = ? ORDER BY is_leader DESC, name ASC`,
        [member.team_id]
      );
    }

    return NextResponse.json({
      authenticated: true,
      member: {
        id: member.id,
        name: member.name,
        is_leader: Boolean(member.is_leader),
        can_submit: Boolean(member.is_leader || member.can_submit),
        team_id: member.team_id,
        team_number: member.team_number,
        team_name: member.team_name,
        team_icon: member.team_icon,
        points: member.points || 100,
        era_id: member.era_id,
        era_name: member.era_name,
        era_ruler: member.era_ruler,
        era_color: member.era_color,
        era_icon: member.era_icon,
        variant: member.variant,
        current_level: member.current_level,
        started_at: member.started_at,
        finished_at: member.finished_at,
        locked_until: member.locked_until,
      },
      teamMembers: teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        is_leader: Boolean(m.is_leader),
        can_submit: Boolean(m.is_leader || m.can_submit),
      })),
    });
  } catch (err) {
    console.error('Member auth GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initSchema();
    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'يرجى إدخال اسم صحيح لا يقل عن حرفين' }, { status: 400 });
    }

    // Check if device_token already passed in
    const existingToken = body.deviceToken;
    if (existingToken) {
      const existing = await queryOne(`SELECT * FROM members WHERE device_token = ?`, [existingToken]);
      if (existing) {
        // Update name if changed
        await execute(`UPDATE members SET name = ? WHERE id = ?`, [name, existing.id]);
        return NextResponse.json({
          success: true,
          token: existing.device_token,
          memberId: existing.id,
          name,
        });
      }
    }

    // Create new member
    const newId = generateMemberId();
    const token = generateToken();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO members (id, device_token, name, is_leader, created_at) VALUES (?, ?, ?, 0, ?)`,
      [newId, token, name, now]
    );

    return NextResponse.json({
      success: true,
      token,
      memberId: newId,
      name,
    });
  } catch (err) {
    console.error('Member auth POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

