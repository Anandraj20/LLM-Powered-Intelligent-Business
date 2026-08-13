import crypto from 'crypto';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'businessmind_super_secret_captcha_key_2026';

export interface CaptchaChallenge {
  question: string;
  token: string;
}

export function generateCaptcha(): CaptchaChallenge {
  const operations = ['+', '-'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1 = Math.floor(Math.random() * 10) + 1; // 1-10
  let num2 = Math.floor(Math.random() * 10) + 1; // 1-10

  // Avoid negative results for subtraction
  if (op === '-' && num1 < num2) {
    const temp = num1;
    num1 = num2;
    num2 = temp;
  }

  const question = `What is ${num1} ${op} ${num2}?`;
  const answer = op === '+' ? num1 + num2 : num1 - num2;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

  // Create a signed verification token
  const payload = JSON.stringify({ answer: answer.toString(), expiresAt });
  const iv = crypto.randomBytes(16);
  // Derive key of exactly 32 bytes for aes-256-cbc using scryptSync
  const key = crypto.scryptSync(CAPTCHA_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const token = `${iv.toString('hex')}:${encrypted}`;

  return { question, token };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 2) return false;
    const [ivHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(CAPTCHA_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const { answer: expectedAnswer, expiresAt } = JSON.parse(decrypted);

    if (Date.now() > expiresAt) {
      return false; // Expired
    }

    return expectedAnswer.trim() === answer.trim();
  } catch (err) {
    return false; // Decryption/parsing failed
  }
}
