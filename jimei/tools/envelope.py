"""Loudness envelope of the song (dBFS RMS, 0.1 s hop) → film/timeline.json "env", used for the final fade.

    python3 tools/envelope.py <song.flac>
"""
import json, sys, pathlib
import numpy as np, librosa
p = pathlib.Path(__file__).resolve().parent.parent / 'film' / 'timeline.json'
tl = json.loads(p.read_text())
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = int(sr * 0.1)
rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop, center=True)[0]
db = 20 * np.log10(np.maximum(rms, 1e-6))
tl['env'] = {'hop_s': 0.1, 'db': [round(float(v), 1) for v in db]}
p.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
for t in (166.9, 167.6, 199.0, 202.5, 205, 207.6, 209, 210.2, 211.5):
    print(t, db[int(t / 0.1)])
