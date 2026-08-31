export interface JwtClaims {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}

// The frontend only ever reads its own claims for UI gating (e.g. show the
// admin nav) — the actual authorization decision always happens server-side
// per request. This is not a security boundary, just a display hint.
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    const claims = JSON.parse(json);

    const roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    return {
      sub: claims.sub,
      email: claims.email,
      role: claims.role ?? claims[roleClaimKey],
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}
