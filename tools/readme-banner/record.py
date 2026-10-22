#!/usr/bin/env python3
"""Record the animated README banner -> docs/media/banner.webp, plus two stills of the same moment: banner.png and
social-preview.jpg (for GitHub's Social preview, which takes still images under 1 MB).

    python tools/readme-banner/record.py          (Python 3 with playwright + Pillow)

banner.html runs the app's own Living Type painter and the motion kit's cross-legged Thinking phrase. It is recorded
on a virtual clock (virtual_clock.js: timers, animation frames and CSS animations all follow one clock, so every frame
is exact) in two layers:
  * Myuuel alone, after two warm-up loops, for exactly one 6 s loop — her phrase and breath repeat exactly;
  * the background and text for 6 s plus 1 s, whose last second is cross-faded into its first, so the drifting letters
    and the turning sphere loop without a jump.
The layers are composited and written as an animated WebP that loops forever.
Cesar Borgenkrans (2026) / SparkleSnap.dev   -- source author: Cezar Borgkrans
"""
import asyncio, functools, http.server, io, json, os, threading
from PIL import Image
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'docs', 'media')
W, H, FPS, LOOP, XFADE = 1280, 640, 30, 6.0, 1.0
N, X = int(LOOP * FPS), int(XFADE * FPS)


def serve(port=8766):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def record(browser, layer, warmup, frames):
    ctx = await browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1)
    css = ''
    if os.path.isdir(os.path.join(ROOT, 'film-fonts')):          # the Windows fonts, when recording elsewhere
        css = open(os.path.join(HERE, 'fonts-windows.css'), encoding='utf-8').read()
    await ctx.add_init_script(script='window.__FILM__ = ' + json.dumps({'settings': {}, 'combos': [], 'seed': 5, 'css': css}) + ';')
    await ctx.add_init_script(path=os.path.join(HERE, 'virtual_clock.js'))
    page = await ctx.new_page()
    page.on('pageerror', lambda e: print('  page error:', e))
    await page.goto(f'http://127.0.0.1:8766/tools/readme-banner/banner.html?layer={layer}', wait_until='load')
    await page.evaluate('Promise.all([...document.fonts].map(f => f.load().catch(() => null)))')
    for _ in range(300):
        if await page.evaluate('!!window.__bannerReady'): break
        await page.evaluate('window.__advance(0)'); await asyncio.sleep(.03)
    step = 1000 / FPS
    for _ in range(int(warmup * FPS)):
        await page.evaluate(f'window.__advance({step})')
    out = []
    for _ in range(frames):
        png = await page.screenshot(type='png', omit_background=(layer == 'fg'))
        out.append(Image.open(io.BytesIO(png)).convert('RGBA'))
        await page.evaluate(f'window.__advance({step})')
    await ctx.close()
    print(f'{layer}: {len(out)} frames')
    return out


async def main():
    srv = serve()
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--font-render-hinting=none', '--force-color-profile=srgb'])
        fg = await record(browser, 'fg', 2 * LOOP, N)
        bg = await record(browser, 'bg', 1.0, N + X)
        await browser.close()
    srv.shutdown()
    frames = []
    for i in range(N):
        b = bg[i]
        if i < X:                                    # the loop seam: the tail fades into the head
            b = Image.blend(bg[i + N], bg[i], (i + .5) / X)
        f = b.copy(); f.alpha_composite(fg[i]); frames.append(f.convert('RGB'))
    os.makedirs(OUT, exist_ok=True)
    dur = [round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS) for i in range(N)]   # sums to exactly 6000 ms
    frames[0].save(os.path.join(OUT, 'banner.webp'), save_all=True, append_images=frames[1:], duration=dur, loop=0,
                   quality=86, method=6)
    poster = frames[int(4.3 * FPS)]                  # hand at her chin
    poster.save(os.path.join(OUT, 'banner.png'), optimize=True)
    poster.save(os.path.join(OUT, 'social-preview.jpg'), quality=92, optimize=True, progressive=True)   # GitHub: under 1 MB
    for n in ('banner.webp', 'banner.png', 'social-preview.jpg'):
        print(n, os.path.getsize(os.path.join(OUT, n)) // 1024, 'KB')

asyncio.run(main())
