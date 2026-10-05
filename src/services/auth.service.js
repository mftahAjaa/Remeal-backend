// src/services/auth.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';

function isEmail(identifier) {
  return identifier.includes('@');
}

function credentialsForIdentifier(identifier) {
  return isEmail(identifier) ? { email: identifier } : { phone: identifier };
}

function isDuplicateAuthError(error) {
  const message = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
  return ['user_already_exists', 'email_exists', 'phone_exists', 'already registered', 'already exists']
    .some((indicator) => message.includes(indicator));
}

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) {
    throw new AppError(404, 'NOT_FOUND', 'Profil pengguna tidak ditemukan.');
  }

  return data;
}

async function createAuthResponse(session, authUser) {
  if (!session?.access_token || !session?.refresh_token || !authUser?.id) {
    throw new AppError(400, 'AUTH_SESSION_UNAVAILABLE', 'Sesi autentikasi tidak tersedia.');
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in ?? 0,
    user: await getProfile(authUser.id),
  };
}

export async function register(input) {
  const { full_name, email, phone, password, role } = input;
  const { data, error } = await supabaseAdmin.auth.signUp({
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    password,
    options: {
      data: {
        full_name,
        role,
        phone: phone ?? null,
      },
    },
  });

  if (error && isDuplicateAuthError(error)) {
    throw new AppError(409, 'CONFLICT', 'Email atau nomor HP sudah terdaftar.');
  }
  if (error) {
    console.error('Supabase Register Error:', error);
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', `Registrasi gagal diproses: ${error.message}`);
  }
  if (data.user && data.user.identities?.length === 0) {
    throw new AppError(409, 'CONFLICT', 'Email atau nomor HP sudah terdaftar.');
  }

  return { message: 'Registrasi berhasil. Silakan verifikasi akun Anda.' };
}

export async function sendOtp({ identifier }) {
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    ...credentialsForIdentifier(identifier),
  });

  if (error) {
    throw new AppError(400, 'SEND_OTP_FAILED', 'Gagal mengirim kode OTP.');
  }

  return { message: 'Kode OTP telah dikirim.' };
}

export async function verifyOtp({ identifier, otp }) {
  const type = isEmail(identifier) ? 'email' : 'sms';
  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    ...credentialsForIdentifier(identifier),
    token: otp,
    type,
  });

  if (error) {
    throw new AppError(400, 'OTP_INVALID', 'Kode verifikasi salah atau sudah kedaluwarsa.');
  }

  return createAuthResponse(data.session, data.user);
}

export async function login({ identifier, password }) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    ...credentialsForIdentifier(identifier),
    password,
  });

  if (error || !data.session || !data.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Email/nomor HP atau kata sandi salah.');
  }

  return createAuthResponse(data.session, data.user);
}

export async function logout(token) {
  const { error } = await supabaseAdmin.auth.admin.signOut(token);
  if (error) {
    throw new AppError(401, 'UNAUTHORIZED', 'Sesi tidak valid atau sudah berakhir.');
  }

  return { message: 'Berhasil logout.' };
}

export async function forgotPassword({ identifier }) {
  if (isEmail(identifier)) {
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(identifier);
    } catch {
      // Keep the response identical whether or not the reset request succeeds.
    }
  }

  return { message: 'Jika akun terdaftar, instruksi pemulihan akan dikirim.' };
}

export async function resetPassword({ token, new_password }) {
  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  });

  if (error || !data.user) {
    throw new AppError(400, 'RESET_TOKEN_INVALID', 'Token reset tidak valid atau sudah kedaluwarsa.');
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    password: new_password,
  });

  if (updateError) {
    throw new AppError(400, 'PASSWORD_RESET_FAILED', 'Kata sandi tidak dapat diperbarui.');
  }

  return { message: 'Kata sandi berhasil diperbarui.' };
}