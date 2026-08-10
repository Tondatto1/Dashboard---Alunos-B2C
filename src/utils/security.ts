/**
 * Cybersecurity Utility Helpers
 * Input sanitization, XSS mitigation, rate-limiting, and data masking.
 */

// XSS Prevention: HTML Entity Encoder & Sanitizer
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Email format validation
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

// Mask sensitive emails for log/UI privacy
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// Brute Force Lockout Management
const FAILED_ATTEMPTS_KEY = 'app_sec_failed_logins';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout

interface AttemptRecord {
  count: number;
  lastAttempt: number;
}

function getAttemptStore(): Record<string, AttemptRecord> {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAttemptStore(store: Record<string, AttemptRecord>) {
  try {
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(store));
  } catch {
    // fallback
  }
}

export function checkBruteForceLockout(email: string): {
  locked: boolean;
  remainingSeconds: number;
} {
  const clean = email.trim().toLowerCase();
  const store = getAttemptStore();
  const record = store[clean];

  if (!record) return { locked: false, remainingSeconds: 0 };

  const now = Date.now();
  const elapsed = now - record.lastAttempt;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    if (elapsed < LOCKOUT_DURATION_MS) {
      const remaining = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 1000);
      return { locked: true, remainingSeconds: remaining };
    } else {
      // Lockout expired, reset count
      delete store[clean];
      saveAttemptStore(store);
      return { locked: false, remainingSeconds: 0 };
    }
  }

  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedLoginAttempt(email: string): number {
  const clean = email.trim().toLowerCase();
  const store = getAttemptStore();
  const now = Date.now();

  const record = store[clean] || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;

  store[clean] = record;
  saveAttemptStore(store);

  return record.count;
}

export function clearFailedLoginAttempts(email: string) {
  const clean = email.trim().toLowerCase();
  const store = getAttemptStore();
  if (store[clean]) {
    delete store[clean];
    saveAttemptStore(store);
  }
}
