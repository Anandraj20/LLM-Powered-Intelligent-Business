/**
 * Validates a password against the secure password complexity policy.
 * Requirements:
 * - Minimum length: 8 characters
 * - Must contain at least one uppercase letter (A-Z)
 * - Must contain at least one lowercase letter (a-z)
 * - Must contain at least one numerical digit (0-9)
 * - Must contain at least one special character (e.g. @$!%*?&._-)
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[@$!%*?&()._#^+-]/.test(password);

  if (!hasUppercase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!hasLowercase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!hasDigit) {
    return { isValid: false, message: 'Password must contain at least one numerical digit' };
  }

  if (!hasSpecial) {
    return { isValid: false, message: 'Password must contain at least one special character (e.g. @, $, !, %, *, ?, &)' };
  }

  return { isValid: true };
}
