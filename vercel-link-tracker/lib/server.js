import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "node:crypto";

export const redis = Redis.fromEnv();

export function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.json(body);
}

export function requireAdmin(req, res) {
  const expected = process.env.ADMIN_TOKEN || "";
  const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  const valid = expected.length >= 24 && a.length === b.length && timingSafeEqual(a, b);
  if (!valid) {
    sendJson(res, 401, { error: "Unauthorized. Periksa token admin." });
    return false;
  }
  return true;
}

export function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(value);
}

export function validDestination(value) {
  try {
    const u = new URL(value);
    return (u.protocol === "https:" || u.protocol === "http:") && !!u.hostname;
  } catch {
    return false;
  }
}

export function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}
