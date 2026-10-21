"""Beat check: librosa beat_track on the flac vs. film/timeline.json beats_s.

    python3 tools/beats.py <song.flac>
"""
import json, sys, pathlib
import numpy as np, librosa

src = sys.argv[1]
tl = json.loads((pathlib.Path(__file__).parent.parent / 'film' / 'timeline.json').read_text())
ref = np.array(tl['song']['beats_s'])
y, sr = librosa.load(src, sr=22050, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, start_bpm=76, tightness=200)
beats = librosa.frames_to_time(frames, sr=sr)
print('duration %.3f s  tempo %s  beats %d  b0 %.3f  period %.4f' % (len(y) / sr, np.atleast_1d(tempo)[0], len(beats), beats[0], np.median(np.diff(beats))))
n = min(len(beats), len(ref))
d = beats[:n] - ref[:n]
print('vs timeline.json: n=%d  max|d| %.3f s  mean %.4f s  (beat period %.3f s)' % (n, np.abs(d).max(), d.mean(), tl['song']['beat_period_s']))
for b in (0, 16, 88, 120, 140, 178, 196, 208, 216, 252, 255):
    if b < n: print('  b%-3d json %.3f  detected %.3f' % (b, ref[b], beats[b]))
