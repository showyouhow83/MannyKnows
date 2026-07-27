// Cryptographically-secure token helpers. Use these instead of Math.random()
// (predictable) or truncated UUIDs for anything that authorizes access.

// Hex token from CSPRNG bytes. `bytes` of entropy → 2*bytes hex chars.
// Default 16 bytes = 128-bit token.
export function secureToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < arr.length; i++) out += arr[i].toString(16).padStart(2, '0');
  return out;
}

// CSPRNG alphanumeric string of `len` chars (uppercase, for human-readable codes).
export function secureCode(len = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
