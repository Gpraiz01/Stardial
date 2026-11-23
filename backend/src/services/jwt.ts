import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh-secret-change-in-production";
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "24h") as SignOptions["expiresIn"];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export interface WalletTokenPayload {
  walletAddress: string;
  /** Session version at issue time (#1446). Absent on tokens issued before it existed. */
  sv?: number;
}

export interface RefreshTokenPayload extends WalletTokenPayload {
  jti: string;
  purpose: "refresh";
}

const activeRefreshTokens = new Map<string, { walletAddress: string; sessionVersion: number }>();

export function signRefreshToken(walletAddress: string, sessionVersion = 0): string {
  const jti = randomUUID();
  activeRefreshTokens.set(jti, { walletAddress, sessionVersion });
  return jwt.sign(
    { walletAddress, sv: sessionVersion, jti, purpose: "refresh" },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
    if (
      payload.purpose !== "refresh" ||
      typeof payload.walletAddress !== "string" ||
      typeof payload.jti !== "string"
    ) {
      return null;
    }
    const active = activeRefreshTokens.get(payload.jti);
    if (!active || active.walletAddress !== payload.walletAddress) return null;
    if (typeof payload.sv === "number" && active.sessionVersion !== payload.sv) return null;
    return payload;
  } catch {
    return null;
  }
}

export function rotateRefreshToken(token: string): { accessToken: string; refreshToken: string; walletAddress: string; sessionVersion: number } | null {
  const payload = verifyRefreshToken(token);
  if (!payload) return null;
  activeRefreshTokens.delete(payload.jti);
  const sessionVersion = typeof payload.sv === "number" ? payload.sv : 0;
  return {
    accessToken: signToken(payload.walletAddress, sessionVersion),
    refreshToken: signRefreshToken(payload.walletAddress, sessionVersion),
    walletAddress: payload.walletAddress,
    sessionVersion,
  };
}

export function revokeRefreshTokens(walletAddress: string, throughSessionVersion?: number): void {
  for (const [jti, active] of activeRefreshTokens) {
    if (
      active.walletAddress === walletAddress &&
      (throughSessionVersion === undefined || active.sessionVersion <= throughSessionVersion)
    ) {
      activeRefreshTokens.delete(jti);
    }
  }
}

export function signToken(walletAddress: string, sessionVersion = 0): string {
  return jwt.sign({ walletAddress, sv: sessionVersion }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): WalletTokenPayload | null {
  try {
    const payload = jwt.verify(token, SECRET);
    // jsonwebtoken checks `exp` when present, but treats a signed token with
    // no expiry claim as valid forever. Access tokens must always be bounded.
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return null;
    }
    return payload as WalletTokenPayload;
  } catch {
    return null;
  }
}
