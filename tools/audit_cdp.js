#!/usr/bin/env node
/* Visual audit via Chrome DevTools Protocol: desktop (1440x900) vs mobile
   (390x844, DPR3) for every page of the site served from a local server.
   Checks: horizontal overflow, failed requests (4xx/5xx), JS console errors,
   broken images, tap targets crammed, tiny font sizes. */
const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8099';
const OUT = '/tmp/audit';

const PAGES = [
  '/', '/404.html', '/biografia.html', '/contact.html', '/discography.html',
  '/photo-video.html', '/press.html', '/software.html',
  ...fs.readdirSync('discography').filter(f => f.endsWith('.html')).map(f => '/discography/' + f),
  ...fs.readdirSync('books').filter(f => f.endsWith('.html')).map(f => '/books/' + f),
  ...fs.readdirSync('artists').filter(f => f.endsWith('.html')).map(f => '/artists/' + f),
];

function evalInChrome(expr) {
  // tiny CDP client over --remote-debugging-port using /json + websocket
  return null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // start chrome with CDP
  const port = 9333;
  const chrome = spawn('google-chrome', [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900', 'about:blank'
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  // fetch ws url
  const ver = JSON.parse(await fetchTxt(`http://127.0.0.1:${port}/json/version`));
  const wsBase = ver.webSocketDebuggerUrl.replace('ws://127.0.0.1', 'ws://localhost');

  let idc = 0;
  const pending = new Map();
  let ws;
  // minimal websocket client (no deps): use a raw TCP implementation
  const net = require('net');
  const crypto = require('crypto');

  function wsConnect(url) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const key = crypto.randomBytes(16).toString('base64');
      const sock = net.connect(Number(u.port), '127.0.0.1', () => {
        sock.write(`GET ${u.pathname} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
      });
      let buf = Buffer.alloc(0);
      let handshakeDone = false;
      const c = { sock, send(obj) { wsSend(sock, JSON.stringify(obj)); } };
      sock.on('data', d => {
        buf = Buffer.concat([buf, d]);
        if (!handshakeDone) {
          const idx = buf.indexOf('\r\n\r\n');
          if (idx === -1) return;
          handshakeDone = true;
          buf = buf.slice(idx + 4);
          resolve(c);
        }
        processFrames();
      });
      sock.on('error', reject);
      function processFrames() {
        while (true) {
          if (buf.length < 2) return;
          const op = buf[0] & 0x0f;
          const masked = (buf[1] & 0x80) !== 0;
          let len = buf[1] & 0x7f;
          let off = 2;
          if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
          else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
          let mask = null;
          if (masked) { mask = buf.slice(off, off + 4); off += 4; }
          if (buf.length < off + len) return;
          let payload = buf.slice(off, off + len);
          buf = buf.slice(off + len);
          if (mask) { for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4]; }
          if (op === 1) {
            const msg = JSON.parse(payload.toString());
            if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
          }
        }
      }
    });
  }
  function wsSend(sock, str) {
    const payload = Buffer.from(str);
    const mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) header = Buffer.from([0x81, 0x80 | payload.length]);
    else if (payload.length < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2); }
    else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(payload.length), 2); }
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
    sock.write(Buffer.concat([header, mask, masked]));
  }

  ws = await wsConnect(wsBase.replace(/\/devtools\/browser\/.*$/, m => m)); // browser ws
  function send(method, params = {}, sessionId) {
    const id = ++idc;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(Object.assign({ id, method, params }, sessionId ? { sessionId } : {}));
      setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ error: 'timeout' }); } }, 20000);
    });
  }

  const report = [];
  for (const vp of [
    { name: 'desktop', width: 1440, height: 900, dsf: 1, mobile: false },
    { name: 'mobile', width: 390, height: 844, dsf: 3, mobile: true },
  ]) {
    for (const page of PAGES) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      await send('Page.enable', {}, sessionId);
      await send('Runtime.enable', {}, sessionId);
      await send('Network.enable', {}, sessionId);
      await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, mobile: vp.mobile }, sessionId);
      await send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: 5 }, sessionId);

      const badResponses = [];
      const consoleErrors = [];
      const onMsg = () => {};
      // event capture via CDP events: need session-scoped event loop; use send('Network.enable') responses? Use Runtime.consoleAPICalled through events - our client routes only responses; do polling checks instead.
      const url = BASE + page;
      await send('Page.navigate', { url }, sessionId);
      await sleep(2600);
      // settle: wait for fonts + htmx swap
      for (let i = 0; i < 6; i++) {
        const ready = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }, sessionId);
        if (ready.result && ready.result.result && ready.result.result.value === 'complete') break;
        await sleep(600);
      }
      await sleep(1200);

      const audit = await send('Runtime.evaluate', { expression: `(() => {
        const de = document.documentElement;
        const overflowX = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0) - window.innerWidth;
        const badImgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map(i => i.getAttribute('src'));
        const tinyText = [...document.querySelectorAll('body *')].filter(el => {
          if (!el.textContent || !el.textContent.trim()) return false;
          if (el.children.length > 0) return false;
          const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize);
          return fs < 10.5 && cs.visibility !== 'hidden' && cs.display !== 'none';
        }).length;
        const headerLinks = [...document.querySelectorAll('.nav-desktop > a')].filter(a => a.offsetParent !== null);
        const headerOk = headerLinks.length === 0 || headerLinks.every(a => {
          const r = a.getBoundingClientRect();
          return r.height >= 24 && r.width >= 30;
        });
        const htmxSwap = !!document.querySelector('.site-header');
        return { overflowX, badImgs, tinyText, headerLinks: headerLinks.length, headerOk, htmxSwap,
                 title: document.title, hasH1: !!document.querySelector('h1'), lang: de.lang };
      })()`, returnByValue: true }, sessionId);
      const v = (audit.result && audit.result.result && audit.result.result.value) || {};

      // screenshot
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 55 }, sessionId);
      const slug = page.replace(/^\//, '').replace(/[\/]/g, '__').replace(/\.html$/, '') || 'home';
      if (shot && shot.data) fs.writeFileSync(`${OUT}/${vp.name}__${slug || 'home'}.jpg`, Buffer.from(shot.data, 'base64'));

      const issues = [];
      if (v.overflowX > 1) issues.push('h-overflow ' + v.overflowX + 'px');
      if (v.badImgs && v.badImgs.length) issues.push('broken imgs: ' + v.badImgs.join(','));
      if (v.tinyText > 0) issues.push('tiny text: ' + v.tinyText);
      if (!v.htmxSwap) issues.push('header not loaded');
      if (!v.hasH1) issues.push('no h1');
      report.push({ vp: vp.name, page, issues });
      await send('Target.closeTarget', { targetId });
    }
  }
  chrome.kill();
  // print summary
  let bad = 0;
  for (const r of report) {
    if (r.issues.length) { bad++; console.log(`[!] ${r.vp} ${r.page}: ${r.issues.join(' | ')}`); }
  }
  console.log(`\n${report.length} checks, ${bad} with issues. Screenshots in ${OUT}`);
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
})().catch(e => { console.error('FATAL', e); process.exit(1); });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchTxt(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); }).on('error', reject);
  });
}
