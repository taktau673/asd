import { createHash } from "node:crypto";
import { redis } from "../../lib/server.js";

const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|twitterbot|linkedinbot|embedly|quora link preview|pinterest|headlesschrome/i;
const KEYWORD_KEYS = ["keyword", "keywords", "q", "query", "utm_term", "search_term"];
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"];

function shortValue(value, max = 180) {
  return String(value || "").replace(/[\r\n\t]/g, " ").trim().slice(0, max);
}
function parseReferrer(value, ownHost) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return {
      referrer: shortValue(value, 500),
      domain: host === ownHost ? "Internal" : host,
      path: shortValue(u.pathname, 180) || "/",
      query: u.searchParams
    };
  } catch {
    return { referrer: "", domain: "Direct / tidak diketahui", path: "", query: new URLSearchParams() };
  }
}
function firstParam(params, keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) return shortValue(value, 120);
  }
  return "";
}
function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || "").toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug)) {
    return res.status(404).send("Link tidak ditemukan.");
  }

  try {
    const raw = await redis.get(`link:${slug}`);
    if (!raw) return res.status(404).send("Link tidak ditemukan.");
    const link = typeof raw === "string" ? JSON.parse(raw) : raw;

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const ua = shortValue(req.headers["user-agent"], 300);
    const hostHeader = String(req.headers.host || "").split(":")[0].toLowerCase();
    const forwardedHost = String(req.headers["x-forwarded-host"] || hostHeader).split(",")[0].trim().split(":")[0].toLowerCase();
    const parsed = parseReferrer(req.headers.referer, forwardedHost);
    const requestParams = new URL(req.url, `https://${hostHeader || "localhost"}`).searchParams;
    const keyword = firstParam(requestParams, KEYWORD_KEYS) || firstParam(parsed.query, KEYWORD_KEYS);
    const campaign = {};
    for (const key of CAMPAIGN_KEYS) {
      const value = firstParam(requestParams, [key]) || firstParam(parsed.query, [key]);
      if (value) campaign[key] = value;
    }

    // Bot preview/crawler tetap diarahkan ke tujuan, tetapi tidak menambah statistik.
    const isBot = BOT_PATTERN.test(ua);
    if (!isBot) {
      // IP hanya dipakai sementara untuk membuat hash deduplikasi; IP mentah tidak disimpan.
      const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
      const ip = forwardedFor || String(req.socket?.remoteAddress || "unknown");
      const visitorKey = hash(`${ip}|${ua}`);
      // Satu pengunjung dihitung maksimal sekali per slug dalam 45 detik.
      const unique = await redis.set(`dedupe:${slug}:${visitorKey}`, "1", { nx: true, ex: 45 });

      if (unique === "OK") {
        const event = {
          slug,
          at: now.toISOString(),
          referer: parsed.referrer,
          sourceDomain: parsed.domain,
          sourcePath: parsed.path,
          keyword,
          campaign,
          userAgent: ua.slice(0, 180)
        };
        const sourceLabel = parsed.domain || "Direct / tidak diketahui";
        const pathLabel = parsed.path || "/ (direct)";
        await Promise.all([
          redis.incr(`clicks:${slug}`),
          redis.hincrby(`daily:${day}`, slug, 1),
          redis.incr(`daily-total:${day}`),
          redis.hincrby(`sources:${slug}`, sourceLabel, 1),
          redis.hincrby(`source-paths:${slug}`, `${sourceLabel}${pathLabel}`, 1),
          keyword ? redis.hincrby(`keywords:${slug}`, keyword, 1) : Promise.resolve(),
          redis.lpush(`logs:${slug}`, JSON.stringify(event)),
          redis.ltrim(`logs:${slug}`, 0, 99)
        ]);
      }
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    return res.redirect(302, link.url);
  } catch (error) {
    console.error(error);
    return res.status(503).send("Layanan tracking sedang tidak tersedia. Silakan coba lagi.");
  }
}
