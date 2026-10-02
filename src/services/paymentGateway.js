// src/services/paymentGateway.js
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AppError } from '../utils/errors.js';

const paymentProviders = {
  midtrans: {
    async createCharge() {
      throw new AppError(501, 'PAYMENT_PROVIDER_NOT_IMPLEMENTED', 'Adapter Midtrans belum dikonfigurasi.');
    },
    async verifySignature() {
      return false;
    },
  },
  xendit: {
    async createCharge() {
      throw new AppError(501, 'PAYMENT_PROVIDER_NOT_IMPLEMENTED', 'Adapter Xendit belum dikonfigurasi.');
    },
    async verifySignature() {
      return false;
    },
  },
};

function getProviderName() {
  return (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
}

function createMockCharge({ orderId, amount, method }) {
  const externalId = `mock_${randomUUID()}`;
  const configuredMinutes = Number.parseInt(process.env.PAYMENT_EXPIRY_MINUTES, 10);
  const expiryMinutes = Number.isSafeInteger(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : 15;

  return {
    externalId,
    paymentUrl: `https://payments.example.test/${externalId}`,
    qrisPayload: method === 'qris' ? `MOCK-QRIS:${orderId}:${amount}:${externalId}` : null,
    expiresAt: new Date(Date.now() + expiryMinutes * 60_000).toISOString(),
  };
}

async function verifyMockSignature({ body, rawBody }) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !Buffer.isBuffer(rawBody)) return false;

  let parsedBody;
  try {
    parsedBody = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return false;
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) return false;
  if (typeof parsedBody.signature !== 'string' || parsedBody.signature !== body?.signature) return false;

  const { signature, ...unsignedPayload } = parsedBody;
  const expected = createHmac('sha256', secret)
    .update(JSON.stringify(unsignedPayload))
    .digest();

  if (!/^[a-f\d]{64}$/i.test(signature)) return false;

  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function createCharge(input) {
  const providerName = getProviderName();
  if (providerName === 'mock') return createMockCharge(input);

  const provider = paymentProviders[providerName];
  if (!provider) {
    throw new AppError(500, 'PAYMENT_PROVIDER_INVALID', 'Provider pembayaran tidak dikenal.');
  }

  return provider.createCharge(input);
}

export async function verifySignature(input) {
  const providerName = getProviderName();
  if (providerName === 'mock') return verifyMockSignature(input);

  const provider = paymentProviders[providerName];
  if (!provider) return false;

  return provider.verifySignature(input);
}