import { redis, sendJson } from "../lib/server.js";

function parse(value) { return typeof value === "string" ? JSON.parse(value) : value; }
function sortCounts(hash) {
  return Object.entries(hash || {}).map(([name, count]) => ({ name, clicks: Number(count || 0) }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 20);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed." });

  try {
    const slugs = await redis.smembers("links");
    const links = await Promise.all(slugs.map(async (slug) => {
      const [raw, clicks, logs, sources, paths, keywords] = await Promise.all([
        redis.get(`link:${slug}`),
        redis.get(`clicks:${slug}`),
        redis.lrange(`logs:${slug}`, 0, 9),
        redis.hgetall(`sources:${slug}`),
        redis.hgetall(`source-paths:${slug}`),
        redis.hgetall(`keywords:${slug}`)
      ]);
      if (!raw) return null;
      const link = parse(raw);
      return {
        ...link,
        clicks: Number(clicks || 0),
        sources: sortCounts(sources),
        sourcePaths: sortCounts(paths).map(x => ({ ...x, name: x.name.replace(/^([^/]+)(\/.*)$/, "$1 · $2") })),
        keywords: sortCounts(keywords),
        recent: logs.map(parse)
      };
    }));

    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      daily.push({ date, clicks: Number(await redis.get(`daily-total:${date}`) || 0) });
    }

    const clean = links.filter(Boolean);
    const totalClicks = clean.reduce((sum, item) => sum + item.clicks, 0);
    const aggregate = (field) => {
      const counts = {};
      for (const link of clean) for (const item of link[field] || []) counts[item.name] = (counts[item.name] || 0) + item.clicks;
      return sortCounts(counts);
    };
    const recent = clean.flatMap(item => item.recent.map(event => ({ ...event, name: item.name })))
      .sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0, 30);

    return sendJson(res, 200, {
      totalClicks, totalLinks: clean.length, daily, links, recent,
      sources: aggregate("sources"), keywords: aggregate("keywords")
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Gagal mengambil statistik." });
  }
}
