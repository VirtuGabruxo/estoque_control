import { NextResponse } from 'next/server';
import { registerUser, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, sobrenome, email, telefone, senha } = body;

    if (!nome || !sobrenome || !email || !senha) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const { user, token } = await registerUser({
      nome,
      sobrenome,
      email,
      telefone,
      senha,
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar cadastro.' },
      { status: 400 }
    );
  }
}
