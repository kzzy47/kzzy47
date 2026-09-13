import { mkdirSync, writeFileSync } from 'node:fs';
const response = await fetch('https://github.com/users/kzzy47/contributions', { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'kzzy47-profile-activity' } });
if (!response.ok) throw new Error(`Contribution request failed: ${response.status}`);
const html = await response.text();
const total = html.match(/([\d,]+)\s+contributions\s+in the last year/);
const cells = [...html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*>/g)].map(m => ({ date: m[1], level: Number(m[2]) })).sort((a,b) => a.date.localeCompare(b.date));
if (!total || cells.length < 350 || cells.length > 380 || new Set(cells.map(c => c.date)).size !== cells.length) throw new Error('Unexpected contribution page; retaining the previous artwork.');
const active = cells.filter(c => c.level > 0).length;
const palette = ['#182234', '#233c69', '#315ea5', '#5b8cff', '#b6d0ff'];
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
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" role="img" aria-labelledby="title desc"><title id="title">kzzy47 public contribution calendar</title><desc id="desc">${total[1]} contributions in the last year. ${active} active days in the displayed calendar. Public GitHub snapshot generated ${new Date().toISOString().slice(0,10)}.</desc><rect width="960" height="320" rx="12" fill="#090b10"/><g font-family="Arial,Helvetica,sans-serif"><text x="36" y="48" font-size="14" fill="#5b8cff" letter-spacing="2">THE BUILD CONTINUES</text><text x="34" y="100" font-size="43" font-weight="700" fill="#f4f7ff">${total[1]}<tspan font-size="18" font-weight="400" fill="#b8c4db"> contributions / last year</tspan></text><text x="924" y="96" text-anchor="end" fill="#b8c4db" font-size="16">${active} active days</text><g font-size="11" fill="#b8c4db">${months}</g>${squares}<path d="M36 280H924" stroke="#304566"/><text x="36" y="305" font-size="11" fill="#b8c4db">PUBLIC GITHUB CALENDAR · ${cells[0].date} — ${last}</text><text x="924" y="305" text-anchor="end" font-size="11" fill="#b8c4db">SNAPSHOT ${new Date().toISOString().slice(0,10)}</text></g></svg>`;
const dir = new URL('../assets/', import.meta.url);
mkdirSync(dir,{recursive:true});
writeFileSync(new URL('activity.svg',dir),svg.replace('<tspan font-size="18"', '<tspan dx="12" font-size="18"')+'\n');
console.log(JSON.stringify({ contributions: total[1], activeDays: active, calendarDays: cells.length }));
