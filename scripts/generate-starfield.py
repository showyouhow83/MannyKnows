"""Seamless-looping forward-travel starfield: glowing white stars on pure black.

Loop safety: star depths cycle exactly once per duration, and every
time-varying effect (per-star twinkle, global density swell) uses an INTEGER
number of sine cycles over the loop — so frame N == frame 0 exactly.

Each star = bright compact core + wide faint halo (the glow).
"""
import numpy as np
import subprocess
import sys

W, H, FPS, DUR = 1920, 1080, 30, 20
N = 1200
rng = np.random.default_rng(7)

X = rng.uniform(-1.6, 1.6, N)
Y = rng.uniform(-1.0, 1.0, N)
Z0 = rng.uniform(0.0, 1.0, N)
base = rng.uniform(0.65, 1.0, N)          # intrinsic brightness

# Twinkle: integer cycles per loop (seamless), random depth & phase per star.
tw_k = rng.integers(1, 6, N)              # 1..5 cycles over the loop
tw_amp = rng.uniform(0.15, 0.50, N)
tw_ph = rng.uniform(0, 2 * np.pi, N)

# Global density/brightness swell: 3 slow integer-frequency waves with random
# phases sum into a gain that surges at pseudo-random moments, looping cleanly.
sw_k = np.array([1, 2, 3])
sw_ph = rng.uniform(0, 2 * np.pi, 3)
sw_amp = np.array([0.16, 0.10, 0.07])

ZMAX = 1.0
ZNEAR = 0.045
SCALE = 0.55 * H
frames = FPS * DUR

enc = subprocess.Popen(
    ['ffmpeg', '-y', '-v', 'error',
     '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
     '-vf', 'format=yuv420p',
     '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-movflags', '+faststart',
     'hero-starfield-master.mp4'],
    stdin=subprocess.PIPE)

def kernel(r, soft):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    g = np.exp(-(xx ** 2 + yy ** 2) / (2 * (r / soft) ** 2 + 1e-6))
    # subtract the edge value and renormalize so the splat fades to exactly
    # zero at its boundary — otherwise wide soft halos cut off as squares
    g = np.clip(g - g[0, r], 0, None)
    g /= g.max()
    return g.astype(np.float32)

cores = {r: kernel(r, 1.8) for r in (2, 3, 4, 5, 6)}
# subtle glow: a tight halo just past the core, not a wide bloom
halos = {r: kernel(min(2 * r, 10), 2.2) for r in (2, 3, 4, 5, 6)}

def splat(img, k, px, py, amp):
    r = k.shape[0] // 2
    x0, y0 = int(px) - r, int(py) - r
    x1, y1 = x0 + k.shape[1], y0 + k.shape[0]
    kx0, ky0 = max(0, -x0), max(0, -y0)
    kx1 = k.shape[1] - max(0, x1 - W)
    ky1 = k.shape[0] - max(0, y1 - H)
    if kx1 <= kx0 or ky1 <= ky0:
        return
    img[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] += k[ky0:ky1, kx0:kx1] * amp

for fidx in range(frames):
    t = fidx / frames
    z = (Z0 - t) % ZMAX
    gain = 1.0 + float(np.sum(sw_amp * np.sin(2 * np.pi * (sw_k * t) + sw_ph)))
    img = np.zeros((H, W), dtype=np.float32)

    for i in range(N):
        zi = z[i]
        if zi < ZNEAR * 0.4:
            continue
        px = W / 2 + X[i] / zi * SCALE
        py = H / 2 + Y[i] / zi * SCALE
        if not (-20 <= px < W + 20 and -20 <= py < H + 20):
            continue
        # fade-out must reach ZERO before the star wraps to the far plane —
        # cutting it while still visible made respawns read as teleports
        near = min(1.0, max(0.0, (zi - 0.5 * ZNEAR) / (1.5 * ZNEAR)))
        far = min(1.0, (ZMAX - zi) / 0.15)
        tw = 1.0 + tw_amp[i] * np.sin(2 * np.pi * (tw_k[i] * t) + tw_ph[i])
        b = base[i] * near * far * tw * gain * (0.75 + 0.25 * min(1.0, 0.15 / zi))
        if b <= 0.03:
            continue
        r = int(np.clip(0.5 / zi * 0.9, 2, 6))
        splat(img, cores[r], px, py, b * 255)
        splat(img, halos[r], px, py, b * 60)    # the glow

    np.clip(img, 0, 255, out=img)
    enc.stdin.write(img.astype(np.uint8).tobytes())
    if fidx % 60 == 0:
        print(f'{fidx}/{frames}', file=sys.stderr)

enc.stdin.close()
enc.wait()
print('master done')
