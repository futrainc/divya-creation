# Divya Creation — website

**Live: https://divyascreation.com** (Cloudflare Pages, domain DNS on Cloudflare). Backup: https://futrainc.github.io/divya-creation/

Static, build-free site (HTML + CSS + vanilla JS) made from the *Divya Jain* brand deck.
Open `index.html` through any static host (or `python3 -m http.server` in this folder).

- `index.html` — all content (taken from the deck)
- `css/style.css` — design tokens, night/day themes, layout
- `js/main.js` — hero light, theme, pinned craft atlas, resin gallery + lightbox, partner tabs, enquiry
- `js/pour.js` — resin-pour canvas · `js/mosaic.js` — tessera physics · `js/studio.js` — name-plate designer · `js/mandala.js` — lippan mandala
- `img/` — photos extracted from the deck and compressed to WebP

Contact details (WhatsApp 98673 05432, @divyascreationn, email) are in `index.html` and `js/studio.js`.

## Publishing (GitHub Pages)
`.github/workflows/pages.yml` publishes the site (without `scripts/`, this README and `.github/`) on every push to `main`, and can be run by hand from the Actions tab.
Live address: **https://futrainc.github.io/divya-creation/**

One-time setup (repo admin): **Settings → Pages → Build and deployment → Source: GitHub Actions**. The repository must be public for Pages on a free GitHub plan.
The optional Instagram token job starts a new deploy after it commits fresh reels.

## Production hosting (Cloudflare Pages, Git-connected)
Cloudflare builds this repo on every push to `main`. Project settings: framework preset *None*, build command `bash build.sh`, output directory `_site`.
`build.sh` copies only the public files (page, `robots.txt`, `sitemap.xml`, `_headers`, `css/`, `js/`, `img/`, `data/`). Custom domain: `divyascreation.com`.
The SEO tags in `index.html` (canonical, Open Graph/Twitter, JSON-LD) and `sitemap.xml` use that domain; the share image is `img/og-image.jpg`.

## Cloudflare Pages (optional second host, custom domain)
`.github/workflows/cloudflare-pages.yml` deploys the same site to Cloudflare Pages on every push to `main`. It does nothing until these exist:
1. A free Cloudflare account. Create an **API token**: My Profile → API Tokens → Create Token → template *Edit Cloudflare Workers* is too broad;
   use a custom token with **Account → Cloudflare Pages → Edit**. Copy the token and your **Account ID** (Workers & Pages → right sidebar).
2. In GitHub: repo → Settings → Secrets and variables → Actions → add secrets **`CLOUDFLARE_API_TOKEN`** and **`CLOUDFLARE_ACCOUNT_ID`**
   (optional repository variable `CF_PAGES_PROJECT`, default `divya-creation`).
3. Run the workflow once (Actions → *Deploy to Cloudflare Pages* → Run workflow). The first run creates the project; the site appears at
   `https://divya-creation.pages.dev` (the exact name is shown in Workers & Pages).
4. Custom domain: Workers & Pages → the project → **Custom domains → Set up a domain**. If the domain's DNS is already on Cloudflare this is one click;
   otherwise add the domain to Cloudflare first (change its nameservers at the registrar).
`_headers` sets safe default headers and asset caching on Cloudflare. GitHub Pages keeps working in parallel; turn it off in Settings → Pages once Cloudflare is the main host.

## Instagram reels — hosted widget (Behold), no code or API of your own
The reel strip can load a live JSON feed from a hosted service, so new reels appear automatically with no commits.
1. The owner of `@divyascreationn` signs up at behold.so (a free plan exists — check current limits), connects the Instagram account
   and creates a feed (any layout; set the post limit to ~12).
2. In Behold open the feed → copy its **JSON feed URL** (looks like `https://feeds.behold.so/XXXXXXXX`).
3. Paste it into `data/instagram.json` as `"feed": "https://feeds.behold.so/XXXXXXXX"` and deploy.
Order of precedence: token job posts → hosted feed → `data/reels.txt` links → studio stills. If the feed can't be reached the page falls
back to the next option. Cover images are loaded from the service's CDN. Hosts that block third-party requests (such as the claude.ai
preview) can't load the feed and will show the fallback.

## Instagram reels (automatic, own token)
The "Watch it happen" rail reads `data/instagram.json`. While `posts` is empty it shows studio stills that link to the profile.

A GitHub Action (`.github/workflows/instagram-feed.yml`) runs every 6 hours, calls the official Instagram API,
saves cover images to `img/ig/` and rewrites `data/instagram.json` with the newest videos/reels, then commits the change.
If the token is missing or invalid it does nothing and leaves the current feed untouched. Scheduled runs only fire from the default branch.

### One-time setup (needs the account owner)
1. `@divyascreationn` must be an Instagram **Business or Creator** account (Settings → Account type).
2. At developers.facebook.com create an app, add the **Instagram** product → "API setup with Instagram login",
   add `@divyascreationn` as an Instagram tester/account and accept the invite in the Instagram app (Settings → Website permissions → Tester invites).
3. Generate an access token for the account with the `instagram_business_basic` permission. It lasts about 60 days.
   (Meta renames these screens often — search their docs for "Instagram API with Instagram Login access token".)
4. In GitHub: repo → Settings → Secrets and variables → Actions → New repository secret named **`INSTAGRAM_ACCESS_TOKEN`**.
5. Actions tab → "Divya Creation — Instagram feed" → Run workflow. The first run fills the rail.

The script asks Instagram to extend the token on every run, so it normally keeps itself alive. If a run logs "NEW token issued"
or the feed stops updating, generate a fresh token and replace the secret.

### Reels without any API or token
Paste Instagram reel links into `data/reels.txt` (one per line, newest first, optional ` | Caption`). The rail shows them as posters and each plays in the viewer when tapped. A page cannot discover new reels by itself without Instagram's API, so add new links here when new reels go up. The automatic feed (above) takes priority when it has posts.

### Playing reels in the page (optional)
By default a tap opens the reel on Instagram. Add `"player": true` to `data/instagram.json` to open Instagram's own embedded player (`instagram.com/reel/<id>/embed/`) in a phone-shaped viewer. The player is loaded only after the tap, so no Instagram scripts run on page load. It needs a normal website (hosts that block third-party frames, such as the claude.ai preview, will show an empty frame — the "Open on Instagram" link is always beside it). Studio-still placeholder cards simply link to the profile.

### Manual mode
Without the API you can still hand-edit `data/instagram.json`:

```json
{ "profile": "https://www.instagram.com/divyascreationn/",
  "posts": [ { "url": "https://www.instagram.com/reel/XXXXXXXX/", "thumb": "img/reel-01.webp", "caption": "Ocean resin pour", "type": "Reel", "date": "2026-10-27T10:00:00+0000" } ] }
```

Test the script locally with `IG_TOKEN=... node scripts/fetch-instagram.mjs` (it rewrites `data/instagram.json` and `img/ig/`).
