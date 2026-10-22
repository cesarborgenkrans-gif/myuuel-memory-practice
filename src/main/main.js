'use strict';
// Myuuel Memory Practice — Electron host.
// Made by Cezar Borgkrans (Cesar Borgenkrans) for SparkleSnap.
// One frameless window. It opens on the side screen when one is connected, and can move to a
// 9:16 strip on the main monitor or become a free-form window, like AI Discussion's View menu.
const { app, BrowserWindow, ipcMain, screen, protocol, Menu, shell } = require('electron');
const STARTED = new Date();
const SITE = 'https://sparklesnap.dev/';
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..');
const SCHEME = 'myuuel';
const ENTRY = `${SCHEME}://app/src/renderer/index.html`;
const ICON = path.join(ROOT, 'assets', 'brand', 'icon.ico');
const START_FREE = process.argv.includes('--free');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp' };

// A standard, same-origin scheme keeps the sprite canvases readable (the motion kit samples pixels).
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.setAppUserModelId('dev.sparklesnap.myuuel-memory-practice');
// One copy only. A second launch stops immediately (app.quit() alone lets this file keep running and open a window)
// and the copy that is already open comes forward.
const FIRST = app.requestSingleInstanceLock();
if (!FIRST) app.exit(0);

// A small startup log in the app's data folder (…/AppData/Roaming/myuuel-memory-practice/startup.log).
function log(...parts) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'startup.log'), `${new Date().toISOString()} ${parts.join(' ')}\n`); } catch {}
}
process.on('uncaughtException', e => log('uncaught', e?.stack || e));

let win = null;
let placement = 'side';
let prefs = { alwaysOnTop: false, free: null, placement: null };
const prefsFile = () => path.join(app.getPath('userData'), 'window.json');
function loadPrefs() { try { prefs = { ...prefs, ...JSON.parse(fs.readFileSync(prefsFile(), 'utf8')) }; } catch {} }
function savePrefs() { try { fs.mkdirSync(path.dirname(prefsFile()), { recursive: true }); fs.writeFileSync(prefsFile(), JSON.stringify(prefs, null, 2)); } catch {} }

// The side screen: the smallest non-primary display (the 5.5-inch panel), portrait preferred.
function sideDisplay() {
  const primary = screen.getPrimaryDisplay();
  const others = screen.getAllDisplays().filter(d => d.id !== primary.id);
  if (!others.length) return null;
  const portrait = others.filter(d => d.bounds.height > d.bounds.width);
  const pool = portrait.length ? portrait : others;
  return pool.sort((a, b) => a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height)[0];
}
function mainStrip() {
  const wa = screen.getPrimaryDisplay().workArea;
  let h = wa.height, w = Math.round(h * 9 / 16);
  const maxW = Math.round(wa.width * 0.6);
  if (w > maxW) { w = maxW; h = Math.round(w * 16 / 9); }
  return { x: wa.x + wa.width - w, y: wa.y + Math.round((wa.height - h) / 2), width: w, height: h };
}
function freeBounds() {
  const saved = prefs.free;
  const area = (saved ? screen.getDisplayMatching(saved) : screen.getPrimaryDisplay()).workArea;
  const width = Math.min(Math.max(360, saved?.width || 540), area.width);
  const height = Math.min(Math.max(560, saved?.height || 960), area.height);
  const x = Math.min(Math.max(Number.isFinite(saved?.x) ? saved.x : area.x + (area.width - width) / 2, area.x), area.x + area.width - width);
  const y = Math.min(Math.max(Number.isFinite(saved?.y) ? saved.y : area.y + (area.height - height) / 2, area.y), area.y + area.height - height);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function state() {
  return { ok: !!win, version: app.getVersion(), started: STARTED.toTimeString().slice(0, 5), placement, alwaysOnTop: !!win?.isAlwaysOnTop(), maximized: !!win?.isMaximized(), sideAvailable: !!sideDisplay() };
}
function notify() { if (win && !win.isDestroyed()) win.webContents.send('window:changed', state()); }
function rememberFree() {
  if (!win || win.isDestroyed() || placement !== 'free' || win.isMinimized()) return;
  prefs.free = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
  savePrefs();
}

function place(target) {
  if (!win) return { ok: false, error: 'No window.' };
  if (!['side', 'main', 'free'].includes(target)) return { ok: false, error: 'Unknown placement.' };
  let bounds;
  if (target === 'side') {
    const d = sideDisplay();
    if (!d) return { ...state(), ok: false, error: 'No side screen is connected.' };
    bounds = { ...d.bounds };
  } else if (target === 'main') bounds = mainStrip();
  else bounds = freeBounds();
  if (placement === 'free') rememberFree();
  if (win.isMaximized()) win.unmaximize();
  const free = target === 'free';
  win.setResizable(true);
  win.setMinimumSize(free ? 360 : 0, free ? 560 : 0);
  win.setBounds(bounds);
  win.setMovable(free); win.setMaximizable(free);
  placement = target; prefs.placement = target; savePrefs(); // remembered for the next launch
  // Some drivers clamp a move onto another display; re-assert once on the next tick.
  setTimeout(() => {
    if (!win || win.isDestroyed() || placement !== target) return;
    try { win.setBounds(bounds); } catch {}
    win.setResizable(free);
    notify();
  }, 80);
  notify();
  return state();
}

function createWindow() {
  loadPrefs();
  const side = sideDisplay();
  // First launch: an ordinary window on the main monitor. After that, whatever placement was last chosen
  // (side screen only if that display is still connected).
  const wanted = START_FREE ? 'free' : prefs.placement || 'free';
  placement = wanted === 'side' && !side ? 'main' : wanted;
  const bounds = placement === 'side' ? { ...side.bounds } : placement === 'main' ? mainStrip() : freeBounds();
  win = new BrowserWindow({
    ...bounds,
    frame: false,
    show: false,
    resizable: placement === 'free',
    movable: placement === 'free',
    maximizable: placement === 'free',
    backgroundColor: '#120c1b',
    icon: ICON,
    title: 'Myuuel Memory Practice',
    alwaysOnTop: !!prefs.alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // It lives on a side screen next to other work; keep animating while another window has focus.
      backgroundThrottling: false
    }
  });
  win.once('ready-to-show', () => { win.setBounds(bounds); win.show(); log('shown', placement, JSON.stringify(bounds)); });
  win.webContents.on('render-process-gone', (_e, d) => log('renderer gone', d?.reason));
  win.webContents.on('did-fail-load', (_e, code, desc) => log('load failed', code, desc));
  for (const ev of ['maximize', 'unmaximize', 'always-on-top-changed']) win.on(ev, notify);
  let t = null;
  for (const ev of ['resize', 'move']) win.on(ev, () => { clearTimeout(t); t = setTimeout(rememberFree, 200); });
  win.on('close', rememberFree);
  win.on('closed', () => { win = null; });

  // Stay on its own page: no new windows, no navigation away.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadURL(ENTRY);
}

// Launching again while she is open restarts the app, so the newest code always runs (no stale window brought forward).
app.on('second-instance', () => { log('second launch → focusing the open window'); if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });

if (FIRST) app.whenReady().then(() => {
  log('start', app.getVersion(), app.isPackaged ? 'packaged' : 'source');
  Menu.setApplicationMenu(null);
  protocol.handle(SCHEME, request => {
    const url = new URL(request.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT + path.sep)) return new Response('Not found', { status: 404 });
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    return fs.promises.readFile(file)
      .then(data => new Response(data, { headers: { 'content-type': type, 'cache-control': 'no-cache' } }))
      .catch(() => new Response('Not found', { status: 404 }));
  });

  const owns = e => win && e.sender === win.webContents;
  ipcMain.handle('window:state', e => owns(e) ? state() : { ok: false });
  ipcMain.handle('window:place', (e, mode) => owns(e) ? place(mode) : { ok: false });
  ipcMain.handle('window:pin', (e, on) => {
    if (!owns(e)) return { ok: false };
    win.setAlwaysOnTop(!!on, 'floating');
    prefs.alwaysOnTop = !!on; savePrefs(); notify();
    return state();
  });
  // The only outside address the app ever opens, and only in the system browser.
  ipcMain.handle('open:site', async e => { if (!owns(e)) return { ok: false }; await shell.openExternal(SITE); return { ok: true }; });
  ipcMain.handle('window:action', (e, name) => {
    if (!owns(e)) return { ok: false };
    if (name === 'minimize') win.minimize();
    else if (name === 'maximize' && placement === 'free') { if (win.isMaximized()) win.unmaximize(); else win.maximize(); }
    else if (name === 'close') win.close();
    return state();
  });

  // If the side screen disappears, come back to the main monitor rather than hiding off-screen.
  screen.on('display-removed', () => { if (placement === 'side' && !sideDisplay()) place('main'); else notify(); });
  screen.on('display-added', notify);

  createWindow();
});

app.on('window-all-closed', () => app.quit());
