import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  revokeRefreshTokens,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
  verifyToken,
} from "./jwt.js";

const WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("access token expiry", () => {
  it("accepts a signed access token with an expiration", () => {
    expect(verifyToken(signToken(WALLET))?.walletAddress).toBe(WALLET);
  });

  it("rejects expired access tokens", () => {
    const expired = jwt.sign(
      { walletAddress: WALLET, sv: 0 },
      process.env.JWT_SECRET || "dev-secret-change-in-production",
      { expiresIn: -1 }
    );

    expect(verifyToken(expired)).toBeNull();
  });

  it("rejects access tokens without an expiration claim", () => {
    const neverExpires = jwt.sign(
      { walletAddress: WALLET, sv: 0 },
      process.env.JWT_SECRET || "dev-secret-change-in-production"
    );

    expect(verifyToken(neverExpires)).toBeNull();
  });

  it("revokes refresh tokens only through the logged-out session version", () => {
    const oldRefreshToken = signRefreshToken(WALLET, 1);
    const currentRefreshToken = signRefreshToken(WALLET, 2);

    revokeRefreshTokens(WALLET, 1);

    expect(verifyRefreshToken(oldRefreshToken)).toBeNull();
    expect(verifyRefreshToken(currentRefreshToken)).not.toBeNull();
  });
});
