"""Soundtrack: the original song untouched except for one overall gain to −14 LUFS, plus optional
palette-knife scrapes (filtered noise, ~20 dB under the music) at the brief's times only.
Nothing is added in the hard silence 166.90–168.40 s.

    python3 tools/mix.py <song.flac> <out.wav> [--no-sfx]
"""
import json, sys, pathlib, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

HERE = pathlib.Path(__file__).resolve().parent.parent
src, out = sys.argv[1], sys.argv[2]
use_sfx = '--no-sfx' not in sys.argv
tl = json.loads((HERE / 'film' / 'timeline.json').read_text())
beats = tl['song']['beats_s']

y, sr = sf.read(src, always_2d=True)          # float64, stereo, 44.1 kHz
y = y.astype(np.float64)

def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(r.split('Integrated loudness:')[1].split('I:')[1].split('LUFS')[0])
    tp = float(r.split('True peak:')[1].split('Peak:')[1].split('dBFS')[0])
    return I, tp

def scrape(dur, seed, bright=1.0):
    """a palette knife dragged over wet paint: band-passed noise, grainy, with a soft attack and a lift-off"""
    rng = np.random.default_rng(seed)
    n = int(dur * sr)
    t = np.arange(n) / sr
    noise = rng.standard_normal(n)
    sos = signal.butter(2, [900 * bright, 5200 * bright], btype='bandpass', fs=sr, output='sos')
    body = signal.sosfilt(sos, noise)
    sos2 = signal.butter(2, [180, 700], btype='bandpass', fs=sr, output='sos')
    drag = signal.sosfilt(sos2, rng.standard_normal(n)) * 0.6
    # grain: the blade skipping over ridges of paint
    grains = signal.sosfilt(signal.butter(1, 60, fs=sr, output='sos'), np.abs(rng.standard_normal(n)))
    grains = 0.55 + 0.9 * grains / (np.abs(grains).max() + 1e-9)
    env = np.minimum(1, t / 0.025) * np.exp(-np.maximum(0, t - dur * 0.55) / (dur * 0.18))
    x = (body + drag) * grains * env
    x /= np.sqrt(np.mean(x ** 2)) + 1e-12
    pan = rng.uniform(-0.25, 0.25)
    return np.stack([x * np.sqrt(0.5 - pan / 2), x * np.sqrt(0.5 + pan / 2)], axis=1)

def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)

g = 10 ** (-0.6 / 20)  # measured −13.4 LUFS → −14.0
mix = y * g
if use_sfx:
    events = [(0.232, 0.32, 1.0), (12.20, 0.32, 1.1), (12.864, 0.45, 0.9), (69.706, 0.45, 0.9), (140.759, 0.45, 0.9), (170.667, 0.5, 0.85)]
    events += [(beats[b], 0.38, 1.0 - 0.05 * i) for i, b in enumerate((252, 253, 254, 255))]
    for k, (t0, dur, br) in enumerate(events):
        i0 = int(t0 * sr)
        s = scrape(dur, 11 + k, br)
        # ~20 dB under the music around the event (with a floor so a quiet intro still hears the blade)
        ctx = mix[max(0, i0 - sr // 2): i0 + sr // 2]
        target = max(rms_db(ctx), -38) - 20
        s *= 10 ** ((target - rms_db(s)) / 20)
        i1 = min(len(mix), i0 + len(s))
        mix[i0:i1] += s[:i1 - i0]
    # the hard silence stays exactly as the song has it
assert not np.isnan(mix).any()
sf.write(out, mix.astype(np.float32), sr, subtype='FLOAT')
I, tp = lufs(out)
print(f'wrote {out}: integrated {I:.1f} LUFS, true peak {tp:.1f} dBFS, sfx={use_sfx}')
