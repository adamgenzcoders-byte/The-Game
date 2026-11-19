import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;
    const adminSecret = process.env.ADMIN_PASSWORD || 'sewedy2026';

    if (password && password.trim() === adminSecret) {
      const response = NextResponse.json({ ok: true, message: 'تم التحقق بنجاح' });
      response.cookies.set('admin_token', adminSecret, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json({ error: 'كلمة مرور المشرف غير صحيحة' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

