/**
 * Tests end-to-end du site 2D Cloud.
 * Pilote le Chrome système via playwright-core (aucun téléchargement de navigateur).
 *
 * Prérequis:
 *   - le site servi en local (ex: `docker compose up -d` → http://localhost:8080)
 *   - Google Chrome installé
 *
 * Lancement:
 *   npm install
 *   npm test
 *
 * Variables d'env optionnelles:
 *   BASE_URL     (défaut http://localhost:8080/)
 *   CHROME_PATH  (défaut: Google Chrome sur macOS)
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.BASE_URL || "http://localhost:8080/";

let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("  ✓ " + n); };
const ko = (n, d) => { fail++; console.log("  ✗ " + n + (d ? "  → " + d : "")); };
const assert = (c, n, d) => (c ? ok(n) : ko(n, d));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function newPage(colorScheme = "light", width = 1440, height = 900) {
  const ctx = await browser.newContext({ colorScheme, viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return { ctx, page, errors };
}

const idx = (page) => page.evaluate(() => {
  const s = document.querySelectorAll("#carouselTrack > .slide");
  for (let i = 0; i < s.length; i++) if (s[i].classList.contains("is-active")) return i;
  return -1;
});
const theme = (page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/* ============ 1. THÈME CLAIR / SOMBRE ============ */
console.log("\n[1] Thème clair / sombre");
{
  const { ctx, page, errors } = await newPage("light");
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(300);
  assert((await theme(page)) === "light", "défaut = clair quand système clair");
  const bgLight = await bg(page);

  await page.click("#themeToggle");
  await page.waitForTimeout(200);
  assert((await theme(page)) === "dark", "clic toggle → sombre", await theme(page));
  const bgDark = await bg(page);
  assert(bgLight !== bgDark, "le fond <body> change vraiment", `${bgLight} vs ${bgDark}`);
  assert((await page.getAttribute("#themeToggle", "aria-pressed")) === "true", "aria-pressed=true en sombre");

  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(200);
  assert((await theme(page)) === "dark", "thème persiste après reload (localStorage)");

  await page.click("#themeToggle");
  await page.waitForTimeout(150);
  assert((await theme(page)) === "light", "re-clic → clair");

  assert(errors.length === 0, "aucune erreur JS", errors.join(" | "));
  await ctx.close();
}
{
  const { ctx, page } = await newPage("dark");
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(200);
  assert((await theme(page)) === "dark", "défaut = sombre quand système sombre (sans choix)");
  await ctx.close();
}

/* ============ 2. CARROUSEL ============ */
console.log("\n[2] Carrousel");
{
  const { ctx, page, errors } = await newPage("light");
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(300);

  assert((await idx(page)) === 0, "volet initial = 01");

  await page.click("#carouselNext");
  await page.waitForTimeout(700);
  assert((await idx(page)) === 1, "flèche suivante → 02", "idx=" + (await idx(page)));

  await page.click("#carouselPrev");
  await page.waitForTimeout(700);
  assert((await idx(page)) === 0, "flèche précédente → 01");

  await page.click('.carousel__dot[data-i="3"]');
  await page.waitForTimeout(700);
  assert((await idx(page)) === 3, "point 04 → volet 04");

  const tf = await page.evaluate(() => document.getElementById("carouselTrack").style.transform);
  assert(tf.includes("-300%"), "translateX = -300% au volet 04", tf);

  const activeDot = await page.evaluate(() => {
    const d = document.querySelector(".carousel__dot.is-active");
    return d ? d.getAttribute("data-i") : null;
  });
  assert(activeDot === "3", "le point actif = 04");

  await page.focus("#carouselNext");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  assert((await idx(page)) === 4, "flèche clavier droite → 05");
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(700);
  assert((await idx(page)) === 3, "flèche clavier gauche → 04");

  await page.click('.carousel__dot[data-i="4"]');
  await page.waitForTimeout(600);
  await page.click("#carouselNext");
  await page.waitForTimeout(700);
  assert((await idx(page)) === 0, "boucle 05 → 01 (wrap-around)");

  assert(errors.length === 0, "aucune erreur JS", errors.join(" | "));
  await ctx.close();
}

/* ============ 3. AUTOPLAY + PAUSE ============ */
console.log("\n[3] Autoplay & pause (patiente ~8s x2)");
{
  const { ctx, page } = await newPage("light");
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const start = await idx(page);
  await page.waitForTimeout(8000);
  assert((await idx(page)) !== start, "autoplay avance tout seul (~7s)");

  await page.click("#carouselPlay");
  assert((await page.getAttribute("#carouselPlay", "aria-pressed")) === "false", "bouton pause → aria-pressed=false");
  const p1 = await idx(page);
  await page.waitForTimeout(8000);
  assert(p1 === (await idx(page)), "en pause, l'autoplay n'avance plus");

  await page.click("#carouselPlay");
  await page.mouse.move(5, 5);
  const r1 = await idx(page);
  await page.waitForTimeout(8000);
  assert((await idx(page)) !== r1, "reprise → avance de nouveau");
  await ctx.close();
}

/* ============ 4. PAUSE AU SURVOL ============ */
console.log("\n[4] Pause au survol");
{
  const { ctx, page } = await newPage("light");
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(300);
  await page.hover(".carousel__viewport");
  const h1 = await idx(page);
  await page.waitForTimeout(8000);
  assert((await idx(page)) === h1, "survol des volets → autoplay suspendu");
  await ctx.close();
}

/* ============ 5. LAYOUT HERO (largeurs) ============ */
console.log("\n[5] Layout du hero selon la largeur");
for (const w of [1920, 1440, 1280, 1024, 900]) {
  const { ctx, page } = await newPage("light", w, 900);
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(200);
  const box = await page.evaluate(() => {
    const c = document.querySelector(".hero__content").getBoundingClientRect();
    const v = document.querySelector(".hero__visual").getBoundingClientRect();
    return {
      contentW: Math.round(c.width), contentRight: Math.round(c.right),
      visualLeft: Math.round(v.left), visualTop: Math.round(v.top), contentTop: Math.round(c.top),
    };
  });
  const sideBySide = box.visualLeft >= box.contentRight - 5 && Math.abs(box.visualTop - box.contentTop) < 250;
  const expectStacked = w <= 1024;
  assert(sideBySide === !expectStacked,
    `${w}px: ${sideBySide ? "côte-à-côte" : "empilé"} (contenu ${box.contentW}px)`);
  await ctx.close();
}

console.log(`\n===== ${pass} PASS / ${fail} FAIL =====`);
await browser.close();
process.exit(fail ? 1 : 0);
