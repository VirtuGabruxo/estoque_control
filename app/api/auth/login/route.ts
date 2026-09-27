import { NextResponse } from 'next/server';
import { loginUser, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Informe o e-mail e a senha.' },
        { status: 400 }
      );
    }

    const { user, token } = await loginUser(email, senha);

    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao autenticar usuário.' },
      { status: 401 }
    );
  }
}
