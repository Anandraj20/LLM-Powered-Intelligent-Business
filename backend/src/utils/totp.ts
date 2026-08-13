import crypto from 'crypto';

/**
 * Decodes a base32 string into a Buffer.
 * Standard Base32 alphabet: RFC 4648 (A-Z, 2-7)
 */
export function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  const length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) {
      throw new Error('Invalid base32 character: ' + clean[i]);
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

/**
 * Generates a random base32 string for setting up MFA.
 */
export function generateBase32Secret(length = 16): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += alphabet[randomBytes[i] % alphabet.length];
  }
  return secret;
}

/**
 * Generates a TOTP code for a base32 secret and time window offset.
 */
export function generateTOTP(secret: string, windowOffset = 0): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30) + windowOffset;

  const buffer = Buffer.alloc(8);
  // Write 64-bit counter as big-endian
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a secret.
 * Allows a drift window of +/- 1 (30s before and after).
 */
export function verifyTOTP(token: string, secret: string): boolean {
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }
  for (let windowOffset = -1; windowOffset <= 1; windowOffset++) {
    if (generateTOTP(secret, windowOffset) === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Generates the otpauth:// URI scheme for QR Code generation (e.g. Google Authenticator)
 */
export function getOTPAuthURI(label: string, secret: string, issuer = 'BusinessMindAI'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
