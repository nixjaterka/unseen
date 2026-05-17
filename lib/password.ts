// Password strength rules for Unseen.
// Rules: min 8 chars, at least one uppercase, lowercase, digit, and special character.

export interface PasswordStrength {
  valid: boolean;
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
}

export function checkPassword(pw: string): PasswordStrength {
  const length    = pw.length >= 8;
  const uppercase = /[A-Z]/.test(pw);
  const lowercase = /[a-z]/.test(pw);
  const digit     = /[0-9]/.test(pw);
  const special   = /[^A-Za-z0-9]/.test(pw);

  return {
    valid: length && uppercase && lowercase && digit && special,
    length,
    uppercase,
    lowercase,
    digit,
    special,
  };
}
