#!/usr/bin/env node
/*
 * Pulls the latest Instagram videos/reels for the connected account (official Instagram API),
 * saves their cover images under img/ig/ and rewrites data/instagram.json for the site.
 *
 *   IG_TOKEN      long-lived Instagram access token (required)
 *   IG_API_BASE   override for testing (default https://graph.instagram.com)
 *   IG_LIMIT      how many videos to keep (default 12)
 *
 * Exits non-zero without touching any file if the API call fails, so a bad token never wipes the feed.
 */
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = (process.env.IG_API_BASE || 'https://graph.instagram.com').replace(/\/$/, '');
const TOKEN = process.env.IG_TOKEN;
const LIMIT = Number(process.env.IG_LIMIT || 12);
const PROFILE = 'https://www.instagram.com/divyascreationn/';

if (!TOKEN) { console.error('IG_TOKEN is not set'); process.exit(2); }

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 200) }; }
  if (!res.ok || body.error) throw new Error(`Instagram API ${res.status}: ${JSON.stringify(body.error || body).slice(0, 300)}`);
  return body;
}

function cleanCaption(c) {
  const first = String(c || '').split('\n').map(s => s.trim()).find(Boolean) || 'New reel';
  const noTags = first.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s{2,}/g, ' ').trim() || 'New reel';
  return noTags.length > 64 ? noTags.slice(0, 61).trimEnd() + '…' : noTags;
}

// Best effort: keep the long-lived token alive (only works once the token is >24h old; failures are fine).
try {
  const r = await getJson(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(TOKEN)}`);
  console.log(`Token refreshed, valid for ~${Math.round((r.expires_in || 0) / 86400)} days` + (r.access_token && r.access_token !== TOKEN ? ' (NEW token issued — update the INSTAGRAM_ACCESS_TOKEN secret)' : ''));
} catch (e) { console.log('Token refresh skipped:', e.message.split('\n')[0]); }

const fields = 'id,caption,media_type,media_product_type,thumbnail_url,permalink,timestamp';
const feed = await getJson(`${API}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(TOKEN)}`);
const videos = (feed.data || []).filter(m => m.media_type === 'VIDEO' && m.thumbnail_url).slice(0, LIMIT);
if (!videos.length) { console.log('No videos returned; leaving the feed as it is.'); process.exit(0); }

const dir = path.join(root, 'img', 'ig');
await mkdir(dir, { recursive: true });
const posts = [];
for (const m of videos) {
  const file = `${m.id}.jpg`;
  const img = await fetch(m.thumbnail_url);
  if (!img.ok) { console.warn(`Skipping ${m.id}: cover download failed (${img.status})`); continue; }
  await writeFile(path.join(dir, file), Buffer.from(await img.arrayBuffer()));
  posts.push({
    url: m.permalink,
    thumb: `img/ig/${file}`,
    caption: cleanCaption(m.caption),
    type: m.media_product_type === 'REELS' ? 'Reel' : 'Video',
    date: m.timestamp
  });
}
if (!posts.length) { console.error('Every cover download failed; keeping the existing feed.'); process.exit(1); }

const keep = new Set(posts.map(p => path.basename(p.thumb)));
for (const f of await readdir(dir)) if (/\.(jpe?g|webp|png)$/i.test(f) && !keep.has(f)) await unlink(path.join(dir, f));

const out = path.join(root, 'data', 'instagram.json');
let prev = {}; try { prev = JSON.parse(await readFile(out, 'utf8')); } catch {}
const next = { profile: prev.profile || PROFILE, auto: true, posts };
// only bump "updated" when the posts changed, so unchanged runs make no commit
const same = JSON.stringify(prev.posts) === JSON.stringify(posts);
next.updated = same && prev.updated ? prev.updated : new Date().toISOString();
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(next, null, 2) + '\n');
console.log(`Wrote ${posts.length} videos to data/instagram.json${same ? ' (unchanged)' : ''}`);
