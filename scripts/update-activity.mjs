import { mkdirSync, writeFileSync } from 'node:fs';
const response = await fetch('https://github.com/users/kzzy47/contributions', { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'kzzy47-profile-activity' } });
if (!response.ok) throw new Error(`Contribution request failed: ${response.status}`);
const html = await response.text();
const total = html.match(/([\d,]+)\s+contributions\s+in the last year/);
const cells = [...html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*>/g)].map(m => ({ date: m[1], level: Number(m[2]) })).sort((a,b) => a.date.localeCompare(b.date));
if (!total || cells.length < 350 || cells.length > 380 || new Set(cells.map(c => c.date)).size !== cells.length) throw new Error('Unexpected contribution page; retaining the previous artwork.');
const active = cells.filter(c => c.level > 0).length;
const palette = ['#142a20', '#1e5840', '#298561', '#18b89c', '#91f1bd'];
const first = new Date(cells[0].date + 'T00:00:00Z');
const last = cells.at(-1).date;
let squares = '';
let months = '';
let lastMonth = '';
for (const cell of cells) {
  const date = new Date(cell.date + 'T00:00:00Z');
  const day = Math.round((date-first)/86400000);
  const week = Math.floor((day+first.getUTCDay())/7);
  const x = 38 + week*16.7, y = 153 + date.getUTCDay()*16.7;
  squares += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="13" height="13" rx="2" fill="${palette[cell.level]}"><title>${cell.date}: contribution intensity ${cell.level}/4</title></rect>`;
  const month = date.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
  if (month !== lastMonth && date.getUTCDate() <= 7) { months += `<text x="${x.toFixed(1)}" y="139">${month}</text>`; lastMonth = month; }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" role="img" aria-labelledby="title desc"><title id="title">kzzy47 public contribution calendar</title><desc id="desc">${total[1]} contributions in the last year. ${active} active days in the displayed calendar. Public GitHub snapshot generated ${new Date().toISOString().slice(0,10)}.</desc><rect width="960" height="320" rx="12" fill="#0a0f0d"/><g font-family="Arial,Helvetica,sans-serif"><text x="36" y="48" font-size="14" fill="#14b8a6" letter-spacing="2">THE BUILD CONTINUES</text><text x="34" y="100" font-size="43" font-weight="700" fill="#f0fff7">${total[1]}<tspan font-size="18" font-weight="400" fill="#a8cbb9"> contributions / last year</tspan></text><text x="924" y="96" text-anchor="end" fill="#a8cbb9" font-size="16">${active} active days</text><g font-size="11" fill="#a8cbb9">${months}</g>${squares}<path d="M36 280H924" stroke="#245c45"/><text x="36" y="305" font-size="11" fill="#a8cbb9">PUBLIC GITHUB CALENDAR · ${cells[0].date} — ${last}</text><text x="924" y="305" text-anchor="end" font-size="11" fill="#a8cbb9">SNAPSHOT ${new Date().toISOString().slice(0,10)}</text></g></svg>`;
const dir = new URL('../assets/', import.meta.url);
mkdirSync(dir,{recursive:true});
writeFileSync(new URL('activity.svg',dir),svg+'\n');
console.log(JSON.stringify({ contributions: total[1], activeDays: active, calendarDays: cells.length }));
