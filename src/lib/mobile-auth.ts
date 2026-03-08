import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.MOBILE_JWT_SECRET ?? process.env.AUTH_SECRET ?? "fallback-secret";

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: "trainer" | "client";
  isAdmin?: boolean;
  trainerId?: string;
  photoUrl?: string | null;
}

/**
 * Extract and verify a Bearer JWT from the Authorization header.
 * Returns the decoded user payload or null if missing/invalid.
 */
export function getMobileUser(req: NextRequest): MobileUser | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as MobileUser;
    return payload;
  } catch {
    return null;
  }
}
