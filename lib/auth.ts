import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from './db';
import { User, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'mercadinho_estoque_control_jwt_secret_2026_secure';
const COOKIE_NAME = 'estoque_session';

export interface SessionPayload {
  userId: string;
  authId: string;
  email: string;
  nome: string;
  sobrenome: string;
  papel: UserRole;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const res = await query<User>(
      'SELECT id, auth_id, nome, sobrenome, email, telefone, papel, criado_em, atualizado_em FROM usuarios WHERE id = $1',
      [payload.userId]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function registerUser({
  nome,
  sobrenome,
  email,
  telefone,
  senha,
}: {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  senha: string;
}): Promise<{ user: User; token: string }> {
  // Check if email already registered
  const existing = await query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Este e-mail já está cadastrado no sistema.');
  }

  // Count existing users to assign role: first = administrador, others = convidado
  const countRes = await query('SELECT COUNT(*)::int as count FROM usuarios');
  const userCount = countRes.rows[0]?.count || 0;
  const papel: UserRole = userCount === 0 ? 'administrador' : 'convidado';

  // Create in auth.users
  const authUserRes = await query<{ id: string }>(
    `INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      LOWER($1),
      crypt($2, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', $3, 'sobrenome', $4)::jsonb,
      NOW(),
      NOW()
    ) RETURNING id`,
    [email, senha, nome, sobrenome]
  );

  const authId = authUserRes.rows[0].id;

  // Insert into public.usuarios
  const userRes = await query<User>(
    `INSERT INTO public.usuarios (
      auth_id,
      nome,
      sobrenome,
      email,
      telefone,
      papel
    ) VALUES ($1, $2, $3, LOWER($4), $5, $6)
    RETURNING id, auth_id, nome, sobrenome, email, telefone, papel, criado_em, atualizado_em`,
    [authId, nome, sobrenome, email, telefone || null, papel]
  );

  const user = userRes.rows[0];
  const token = signToken({
    userId: user.id,
    authId: user.auth_id,
    email: user.email,
    nome: user.nome,
    sobrenome: user.sobrenome,
    papel: user.papel,
  });

  return { user, token };
}

export async function loginUser(email: string, senha: string): Promise<{ user: User; token: string }> {
  // Find in public.usuarios
  const userRes = await query<User>(
    `SELECT id, auth_id, nome, sobrenome, email, telefone, papel, criado_em, atualizado_em
     FROM public.usuarios
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (userRes.rows.length === 0) {
    throw new Error('E-mail ou senha incorretos.');
  }

  const user = userRes.rows[0];

  // Verify password in auth.users
  const authRes = await query<{ valid: boolean }>(
    `SELECT (encrypted_password = crypt($1, encrypted_password)) AS valid
     FROM auth.users
     WHERE id = $2`,
    [senha, user.auth_id]
  );

  if (authRes.rows.length === 0 || !authRes.rows[0].valid) {
    throw new Error('E-mail ou senha incorretos.');
  }

  const token = signToken({
    userId: user.id,
    authId: user.auth_id,
    email: user.email,
    nome: user.nome,
    sobrenome: user.sobrenome,
    papel: user.papel,
  });

  return { user, token };
}

export { COOKIE_NAME };
