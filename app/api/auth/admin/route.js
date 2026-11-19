// ========================================================
// app/api/auth/admin/route.js - Admin Password Verification
// ========================================================

import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/authHelper';

export async function POST(request) {
  try {
    const body = await request.json();
    const password = (body.password || '').trim();
    const adminSecret = process.env.ADMIN_PASSWORD || 'AD@776@z776@';

    if (password === adminSecret) {
      const response = NextResponse.json({ success: true, token: adminSecret });
      response.cookies.set('admin_token', adminSecret, {
        path: '/',
        httpOnly: true,
        maxAge: 86400 * 7,
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  } catch (err) {
    console.error('Admin auth POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  const isAdmin = verifyAdmin(request);
  return NextResponse.json({ isAdmin });
}

