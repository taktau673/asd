import { redis } from "../../lib/server.js";

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
    const event = {
      slug,
      at: now.toISOString(),
      referer: String(req.headers.referer || "").slice(0, 500),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300)
    };

    await Promise.all([
      redis.incr(`clicks:${slug}`),
      redis.hincrby(`daily:${day}`, slug, 1),
      redis.incr(`daily-total:${day}`),
      redis.lpush(`logs:${slug}`, JSON.stringify(event)),
      redis.ltrim(`logs:${slug}`, 0, 99)
    ]);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    return res.redirect(302, link.url);
  } catch (error) {
    console.error(error);
    return res.status(503).send("Layanan tracking sedang tidak tersedia. Silakan coba lagi.");
  }
}
