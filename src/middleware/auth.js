// src/middleware/auth.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';

const unauthorizedError = () =>
  new AppError(401, 'UNAUTHORIZED', 'Token tidak ada atau tidak valid.');

function getBearerToken(req) {
  const authorization = req.get('authorization');
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function authenticateToken(token) {
  if (!token) throw unauthorizedError();

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw unauthorizedError();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server.');
  }

  if (
    !profile ||
    profile.is_active !== true ||
    !['consumer', 'seller', 'super_admin'].includes(profile.role)
  ) {
    throw new AppError(403, 'FORBIDDEN', 'Akun tidak aktif atau tidak memiliki peran yang valid.');
  }

  return {
    id: data.user.id,
    role: profile.role,
    email: data.user.email,
    token,
  };
}

export async function requireAuth(req, res, next) {
  try {
    req.user = await authenticateToken(getBearerToken(req));
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalAuth(req, res, next) {
  if (!req.get('authorization')) return next();

  const token = getBearerToken(req);
  if (!token) return next(unauthorizedError());

  try {
    req.user = await authenticateToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}