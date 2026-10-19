#!/usr/bin/env python3
"""《晨光》Morning Light —— 一首用 Python + NumPy 从零合成的纯音乐。

编制：毛毡钢琴（旋律 + 分解和弦）、弦乐铺底、低音、钢片琴，外加卷积混响。
调性：D 大调（谱子按 C 大调书写，渲染时整体移调），4/4 拍，约 74 BPM，结尾渐慢。

用法：
    python3 compose.py              # 在脚本所在目录生成 .wav / .mid，有 ffmpeg 时再导出 .mp3
    python3 compose.py --out DIR

唯一依赖是 numpy；导出 mp3 需要系统里有 ffmpeg。
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
TRANSPOSE = 2          # 谱子按 C 大调写，整体上移到 D 大调
SEED = 20261019        # 固定随机种子：人性化抖动每次渲染都一样
TITLE = "晨光 Morning Light"

# ---------------------------------------------------------------------------
# 1. 乐谱
# ---------------------------------------------------------------------------

NOTE_INDEX = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def n(name: str) -> int:
    """音名 -> MIDI 音高，例如 'C4' -> 60，'F#5' -> 78。"""
    pc, rest = NOTE_INDEX[name[0]], name[1:]
    if rest[0] in "#b":
        pc += 1 if rest[0] == "#" else -1
        rest = rest[1:]
    return pc + 12 * (int(rest) + 1)


# 和弦: (钢琴分解和弦的声部，由低到高；弦乐铺底的声部)
CHORDS = {
    "C":     ([36, 43, 52, 55, 62], [55, 60, 64, 67]),
    "Cmaj9": ([36, 43, 52, 59, 62], [48, 55, 59, 62, 64]),
    "C/E":   ([40, 48, 55, 60, 64], [55, 60, 64, 67]),
    "Dm7":   ([38, 45, 53, 57, 60], [50, 53, 57, 60]),
    "Em7":   ([40, 47, 55, 59, 62], [52, 55, 59, 62]),
    "Em/G":  ([43, 52, 55, 59, 64], [55, 59, 64, 67]),
    "Fmaj7": ([41, 48, 55, 57, 64], [53, 57, 60, 64]),
    "G":     ([43, 50, 57, 59, 62], [55, 59, 62, 67]),
    "Gsus4": ([43, 50, 57, 60, 62], [55, 60, 62, 67]),
    "G/B":   ([47, 55, 59, 62, 67], [55, 59, 62, 67]),
    "Am7":   ([45, 52, 59, 60, 64], [57, 60, 64, 67]),
}

ROYAL = [["Fmaj7"], ["G"], ["Em7"], ["Am7"]]               # 王道进行 IV–V–iii–vi
A_PROG = ROYAL + [["Dm7"], ["Em7"], ["Fmaj7"], ["Gsus4", "G"]]
B_PROG = [["C"], ["G/B"], ["Am7"], ["Em/G"], ["Fmaj7"], ["C/E"], ["Dm7"], ["Gsus4", "G"]]
OUTRO_PROG = ROYAL + [["Dm7", "G"], ["Cmaj9"]]

# 旋律：每小节一个列表，元素为 (拍位, 时值/拍, 音名)
A_MEL = [
    [(0, 1.5, "E5"), (1.5, 0.5, "D5"), (2, 1, "E5"), (3, 1, "G5")],
    [(0, 1.5, "G5"), (1.5, 0.5, "A5"), (2, 1, "G5"), (3, 1, "D5")],
    [(0, 2, "E5"), (2, 0.5, "D5"), (2.5, 0.5, "C5"), (3, 1, "B4")],
    [(0, 1.5, "C5"), (1.5, 0.5, "B4"), (2, 2, "A4")],
    [(0, 0.5, "A4"), (0.5, 0.5, "C5"), (1, 1.5, "F5"), (2.5, 0.5, "E5"), (3, 1, "D5")],
    [(0, 0.5, "B4"), (0.5, 0.5, "D5"), (1, 1.5, "G5"), (2.5, 0.5, "A5"), (3, 1, "B5")],
    [(0, 1.5, "A5"), (1.5, 0.5, "G5"), (2, 1, "E5"), (3, 1, "C5")],
    [(0, 2.5, "D5"), (3, 0.5, "B4"), (3.5, 0.5, "D5")],
]
B_MEL = [
    [(0, 1.5, "E5"), (1.5, 0.5, "F5"), (2, 2, "G5")],
    [(0, 1, "G5"), (1, 0.5, "A5"), (1.5, 0.5, "G5"), (2, 2, "D5")],
    [(0, 1.5, "C5"), (1.5, 0.5, "D5"), (2, 1, "E5"), (3, 1, "A5")],
    [(0, 2, "G5"), (2, 1, "E5"), (3, 0.5, "D5"), (3.5, 0.5, "E5")],
    [(0, 1, "F5"), (1, 1, "A5"), (2, 1.5, "C6"), (3.5, 0.5, "B5")],
    [(0, 1.5, "C6"), (1.5, 0.5, "G5"), (2, 2, "E5")],
    [(0, 1, "F5"), (1, 0.5, "E5"), (1.5, 0.5, "D5"), (2, 1.5, "C5"), (3.5, 0.5, "D5")],
    [(0, 3, "D5")],
]
OUTRO_MEL = A_MEL[:4] + [
    [(0, 1, "F5"), (1, 1, "E5"), (2, 1, "D5"), (3, 1, "B4")],
    [(0.5, 7.5, "C5")],
]

PARTS = ("melody", "piano", "pad", "bass", "bell")


class Score:
    def __init__(self):
        self.bars = []                       # (起始拍, 拍数, BPM, [(和弦, 起始拍, 时值), ...])
        self.notes = {p: [] for p in PARTS}  # (起始拍, 时值/拍, MIDI 音高, 力度 0..1)
        self.cursor = 0.0

    def add_bars(self, prog, bpm=74, beats=4):
        added = []
        for i, chords in enumerate(prog):
            b = beats[i] if isinstance(beats, list) else beats
            t = bpm[i] if isinstance(bpm, list) else bpm
            span = b / len(chords)
            spans = [(c, self.cursor + j * span, span) for j, c in enumerate(chords)]
            added.append((self.cursor, b, t, spans))
            self.cursor += b
        self.bars += added
        return added

    def add(self, part, start, dur, midi, vel):
        self.notes[part].append((start, dur, midi, vel))


def chord_at(bar, beat):
    return [c for c, start, _ in bar[3] if start <= beat][-1]


def melody(score, part, bars, phrase, vel, shift=0):
    for bar, notes in zip(bars, phrase):
        for beat, dur, name in notes:
            m = n(name) + shift
            accent = 1.06 if beat in (0, 2) else 0.97 if beat == int(beat) else 0.9
            score.add(part, bar[0] + beat, dur, m, vel * accent * (1 + (m - shift - 76) * 0.008))


def arpeggio(score, bars, vel):
    """八分音符分解和弦 1-5-9-3-5-3-9-5；踩着延音踏板，每个音一直响到换和弦。"""
    order = [0, 1, 2, 3, 4, 3, 2, 1]
    for bar in bars:
        for chord, start, span in bar[3]:
            voicing = CHORDS[chord][0]
            for i in range(int(span * 2)):
                accent = 1.15 if i == 0 else 0.92 if i % 2 == 0 else 0.8
                score.add("piano", start + i * 0.5, span - i * 0.5, voicing[order[i]], vel * accent)


def pad(score, bars, level):
    for i, bar in enumerate(bars):
        lv = level[i] if isinstance(level, list) else level
        for chord, start, span in bar[3]:
            for m in CHORDS[chord][1]:
                score.add("pad", start, span, m, lv)


def bass(score, bars, vel, halves=False):
    for bar in bars:
        for chord, start, span in bar[3]:
            m = 33 + (CHORDS[chord][0][0] - 33) % 12   # 落在 A1..G#2
            if halves and span == 4:
                score.add("bass", start, 2, m, vel)
                score.add("bass", start + 2, 2, m, vel * 0.85)
            else:
                score.add("bass", start, span, m, vel)


def sparkle(score, bars, vel):
    """钢片琴点缀：每小节在弱拍上轻点两个和弦音（高两个八度）。"""
    for bar in bars:
        for beat, idx in ((1.5, -1), (3, -2)):
            m = CHORDS[chord_at(bar, bar[0] + beat)][1][idx] + 24
            score.add("bell", bar[0] + beat, 1, m, vel)


def merge_pad(notes):
    """相邻和弦里重复的铺底音连成一个长音，避免重新起音造成的音量凹陷。"""
    merged = []
    for start, dur, m, lv in sorted(notes, key=lambda x: (x[2], x[0])):
        if merged and merged[-1][2] == m and abs(merged[-1][0] + merged[-1][1] - start) < 1e-9:
            s0, d0, _, l0 = merged[-1]
            merged[-1] = (s0, d0 + dur, m, l0)
        else:
            merged.append((start, dur, m, lv))
    return sorted(merged)


def build_score():
    s = Score()

    # 前奏：钢琴分解和弦，弦乐从第二小节渐入
    bars = s.add_bars(ROYAL)
    arpeggio(s, bars, 0.5)
    pad(s, bars[1:], [0.3, 0.42, 0.5])

    # A1：主旋律进入
    bars = s.add_bars(A_PROG)
    melody(s, "melody", bars, A_MEL, 0.62)
    arpeggio(s, bars, 0.46)
    pad(s, bars, 0.5)
    bass(s, bars, 0.55)

    # B1：副歌，卡农式下行低音
    bars = s.add_bars(B_PROG)
    melody(s, "melody", bars, B_MEL, 0.72)
    arpeggio(s, bars, 0.52)
    pad(s, bars, 0.68)
    bass(s, bars, 0.65, halves=True)

    # 间奏：钢片琴高八度唱出主题
    bars = s.add_bars(ROYAL)
    melody(s, "bell", bars, A_MEL[:4], 0.9, shift=12)
    arpeggio(s, bars, 0.44)
    pad(s, bars, 0.5)
    bass(s, bars, 0.5)

    # A2：主旋律再现，钢片琴点缀
    bars = s.add_bars(A_PROG)
    melody(s, "melody", bars, A_MEL, 0.68)
    sparkle(s, bars, 0.32)
    arpeggio(s, bars, 0.5)
    pad(s, bars, 0.7)
    bass(s, bars, 0.6)

    # B2：高潮，钢片琴高八度重叠旋律
    bars = s.add_bars(B_PROG)
    melody(s, "melody", bars, B_MEL, 0.8)
    melody(s, "bell", bars, B_MEL, 0.38, shift=12)
    arpeggio(s, bars, 0.56)
    pad(s, bars, 0.85)
    bass(s, bars, 0.72, halves=True)

    # 尾声：主题回响，渐慢，最后停在 Cmaj9 上
    bars = s.add_bars(OUTRO_PROG, bpm=[74, 73, 71, 68, 64, 58], beats=[4, 4, 4, 4, 4, 8])
    melody(s, "melody", bars, OUTRO_MEL, 0.55)
    arpeggio(s, bars[:-1], 0.42)
    last = bars[-1][0]
    for i, m in enumerate(CHORDS["Cmaj9"][0]):              # 琶音式滚奏最后一个和弦
        s.add("piano", last + i * 0.12, 8 - i * 0.12, m, 0.45 - i * 0.03)
    for i, name in enumerate(["C6", "E6", "G6", "B6", "D7"]):
        s.add("bell", last + 1 + i * 0.5, 2, n(name), 0.42 - i * 0.04)
    pad(s, bars, [0.6, 0.55, 0.5, 0.45, 0.4, 0.35])
    bass(s, bars, 0.5)

    s.notes["pad"] = merge_pad(s.notes["pad"])
    return s


# ---------------------------------------------------------------------------
# 2. 音色合成
# ---------------------------------------------------------------------------

def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def piano_note(midi, vel, length, rng):
    """毛毡钢琴：带非谐性的加法合成、双弦微失谐、两段式衰减、击弦噪声和制音器。"""
    f0 = hz(midi)
    release = 0.3
    t = np.arange(int((length + release) * SR)) / SR
    k = np.arange(1, max(2, min(32, int(7000 / f0))) + 1)[:, None]
    fk = f0 * k * np.sqrt(1 + 0.0003 * k ** 2)
    amp = k ** -1.0 * np.exp(-fk / (1200 + 2600 * vel))
    amp /= np.sqrt((amp ** 2).sum())
    tau = np.clip(3.2 * (261.6 / f0) ** 0.55, 0.9, 9.0) / (1 + 0.25 * (k - 1))
    env = 0.55 * np.exp(-t / (0.22 * tau)) + 0.45 * np.exp(-t / tau)
    detune = 2 ** (rng.uniform(0.4, 1.2) / 1200)
    ph = rng.uniform(0, 2 * np.pi, (2, len(k), 1))
    w = 2 * np.pi * fk * t
    sig = (amp * env * (np.sin(w + ph[0]) + np.sin(w * detune + ph[1]))).sum(0) * 0.5
    sig *= 1 - np.exp(-t / 0.005)                                   # 毛毡琴槌，柔和起音
    thump = np.convolve(rng.standard_normal(int(0.04 * SR)), np.ones(16) / 16, "same")
    thump *= np.exp(-np.arange(len(thump)) / SR / 0.012) * 0.25 * vel
    sig[: len(thump)] += thump[: len(sig)]
    sig *= np.where(t > length, np.exp(-(t - length) / 0.06), 1.0)  # 制音器落下
    sig[-256:] *= np.linspace(1, 0, 256)
    return sig * vel ** 1.6


def pad_note(midi, level, length, rng):
    """温暖的弦乐铺底：三支微失谐的“滤波锯齿波”，左右声道各自失谐以拉宽声场。"""
    f0 = hz(midi)
    release = 1.8
    t = np.arange(int((length + release) * SR)) / SR
    k = np.arange(1, max(2, min(10, int(6000 / f0))) + 1)[:, None]
    amp = np.exp(-(k - 1) / (2.2 + 1.5 * level)) / k               # 越响越亮
    out = np.zeros((2, len(t)))
    for ch in range(2):
        for cents in (-7, 0, 7):
            f = f0 * 2 ** ((cents + rng.uniform(-2, 2)) / 1200)
            ph = rng.uniform(0, 2 * np.pi, (len(k), 1))
            out[ch] += (amp * np.sin(2 * np.pi * f * k * t + ph)).sum(0)
    attack = min(1.2, 0.4 * length)
    env = np.sin(0.5 * np.pi * np.clip(t / attack, 0, 1)) ** 2
    env *= np.where(t > length, np.cos(0.5 * np.pi * np.clip((t - length) / release, 0, 1)), 1.0)
    env *= 1 + 0.06 * np.sin(2 * np.pi * 0.2 * t + rng.uniform(0, 2 * np.pi))
    return out * env * level / 3


def bass_note(midi, vel, length):
    f0 = hz(midi)
    release = 0.3
    t = np.arange(int((length + release) * SR)) / SR
    w = 2 * np.pi * f0 * t
    sig = np.sin(w) + 0.3 * np.sin(2 * w) + 0.12 * np.sin(3 * w) + 0.05 * np.sin(4 * w)
    env = (1 - np.exp(-t / 0.012)) * (0.65 + 0.35 * np.exp(-t / 0.4)) * np.exp(-t / 6)
    env *= np.where(t > length, np.cos(0.5 * np.pi * np.clip((t - length) / release, 0, 1)), 1.0)
    return sig * env * vel


def bell_note(midi, vel):
    """钢片琴 / 八音盒：近谐波的分音，高分音衰减更快。"""
    f0 = hz(midi)
    ring = 2.4 * (880 / f0) ** 0.3
    t = np.arange(int(ring * 2.5 * SR)) / SR
    ratios = np.array([1, 2, 3, 4.07, 5.43, 9.6])[:, None]
    amps = np.array([1, 0.35, 0.12, 0.15, 0.06, 0.08])[:, None]
    taus = ring * np.array([1, 0.5, 0.3, 0.2, 0.12, 0.03])[:, None]
    ok = (ratios * f0 < SR / 2 - 1000)
    sig = (ok * amps * np.exp(-t / taus) * np.sin(2 * np.pi * f0 * ratios * t)).sum(0)
    sig *= 1 - np.exp(-t / 0.001)
    sig[-2000:] *= np.linspace(1, 0, 2000)
    return sig * vel


# ---------------------------------------------------------------------------
# 3. 渲染与混音
# ---------------------------------------------------------------------------

def pan(sig, p):
    """等功率声像，p ∈ [-1, 1]。"""
    a = (p + 1) * np.pi / 4
    return np.vstack([sig * np.cos(a), sig * np.sin(a)])


def mix_in(bus, sig, at):
    at = max(0, at)
    end = min(bus.shape[1], at + sig.shape[1])
    bus[:, at:end] += sig[:, : end - at]


def make_ir(rng, seconds=3.6):
    """合成的大厅冲激响应：低频衰减慢、高频衰减快，左右声道去相关。"""
    size = int(seconds * SR)
    t = np.arange(size) / SR
    f = np.fft.rfftfreq(size, 1 / SR)
    low = 1 / (1 + (f / 400) ** 4)
    high = (f / 3500) ** 4 / (1 + (f / 3500) ** 4)
    bands = [(low, 3.0), (np.clip(1 - low - high, 0, 1), 2.4), (high, 1.2)]
    ir = np.zeros((2, size))
    for ch in range(2):
        spec = np.fft.rfft(rng.standard_normal(size))
        for mask, rt60 in bands:
            ir[ch] += np.fft.irfft(spec * mask, size) * np.exp(-6.91 * t / rt60)
        ir[ch] *= 1 - np.exp(-t / 0.03)                 # 扩散声逐渐建立
        for delay, gain in ((0.013, 0.6), (0.021, 0.45), (0.034, 0.35), (0.047, 0.25)):
            ir[ch, int((delay + rng.uniform(-0.003, 0.003)) * SR)] += gain * rng.choice([-1, 1]) * 8
        ir[ch] /= np.sqrt((ir[ch] ** 2).sum())
    return np.pad(ir, ((0, 0), (int(0.02 * SR), 0)))     # 20ms 预延迟


def convolve(x, ir):
    size = 1 << int(np.ceil(np.log2(x.shape[1] + ir.shape[1])))
    out = np.empty_like(x)
    for ch in range(2):
        y = np.fft.irfft(np.fft.rfft(x[ch], size) * np.fft.rfft(ir[ch], size), size)
        out[ch] = y[: x.shape[1]]
    return out


def active_rms(x):
    """只统计发声段落的 RMS，用来把各声部摆到目标音量。"""
    mono = x.mean(0)
    frames = mono[: len(mono) // 4096 * 4096].reshape(-1, 4096)
    rms = np.sqrt((frames ** 2).mean(1))
    loud = rms[rms > rms.max() * 0.05]
    return np.sqrt((loud ** 2).mean())


def render(score):
    rng = np.random.default_rng(SEED)
    edges = [bar[0] for bar in score.bars] + [score.cursor]
    secs = np.concatenate([[0], np.cumsum([bar[1] * 60 / bar[2] for bar in score.bars])])

    def sec(beat):
        return float(np.interp(beat, edges, secs))

    total = int((secs[-1] + 8) * SR)
    buses = {p: np.zeros((2, total), dtype=np.float32) for p in PARTS}

    for part, notes in score.notes.items():
        for start, dur, m, vel in notes:
            m += TRANSPOSE
            t0, length = sec(start), sec(start + dur) - sec(start)
            vel = float(np.clip(vel * (1 + rng.normal(0, 0.04)), 0.05, 1))
            if part == "melody":
                t0 += rng.normal(0, 0.007)
                sig = pan(piano_note(m, vel, length + 0.12, rng), 0.08)
            elif part == "piano":
                t0 += rng.normal(0, 0.005)
                sig = pan(piano_note(m, vel, length, rng), np.clip((m - 60) / 40, -0.6, 0.6))
            elif part == "pad":
                sig = pad_note(m, vel, length, rng)
            elif part == "bass":
                sig = pan(bass_note(m, vel, length), 0)
            else:
                t0 += rng.normal(0, 0.004)
                sig = pan(bell_note(m, vel), 0.3)
            mix_in(buses[part], sig.astype(np.float32), int(t0 * SR))

    # 钢片琴：附点八分的乒乓延迟
    bell = buses["bell"].mean(0)
    d = int(0.75 * 60 / 74 * SR)
    for i, (ch, g) in enumerate(((1, 0.3), (0, 0.18), (1, 0.1)), start=1):
        buses["bell"][ch, i * d:] += g * bell[: total - i * d]

    targets = {"melody": 1.0, "piano": 0.55, "pad": 0.3, "bass": 0.42, "bell": 0.42}
    sends = {"melody": 0.3, "piano": 0.3, "pad": 0.5, "bass": 0.05, "bell": 0.55}
    dry = np.zeros((2, total))
    send = np.zeros((2, total))
    for part, x in buses.items():
        x = x.astype(np.float64) * targets[part] / active_rms(x)
        dry += x
        send += x * sends[part]
    out = dry + 0.5 * convolve(send, make_ir(rng))

    # 母带：30Hz 高通，响度归一，软限幅，淡入淡出
    spec = np.fft.rfft(out, axis=1)
    f = np.fft.rfftfreq(total, 1 / SR)
    out = np.fft.irfft(spec * (f ** 4 / (f ** 4 + 30.0 ** 4)), total, axis=1)
    out *= 0.8 / np.percentile(np.abs(out), 99.99)
    over = np.abs(out) > 0.8
    out[over] = np.sign(out[over]) * (0.8 + 0.18 * np.tanh((np.abs(out[over]) - 0.8) / 0.18))
    out[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    fade = int(3 * SR)
    out[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    return out, secs[-1]


# ---------------------------------------------------------------------------
# 4. 导出
# ---------------------------------------------------------------------------

def write_wav(path, audio):
    rng = np.random.default_rng(SEED)
    dither = (rng.random(audio.shape) - rng.random(audio.shape)) / 32768
    pcm = np.clip((audio + dither) * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.T.tobytes())


def write_midi(score, path):
    """多轨 MIDI，方便导入 DAW 换音色或继续编曲。"""
    tpb = 480

    def vlq(v):
        out = [v & 0x7F]
        v >>= 7
        while v:
            out.append((v & 0x7F) | 0x80)
            v >>= 7
        return bytes(reversed(out))

    def chunk(events):
        data, last = b"", 0
        for tick, _, ev in sorted(events, key=lambda e: (e[0], e[1])):
            data += vlq(tick - last) + ev
            last = tick
        data += b"\x00\xff\x2f\x00"
        return b"MTrk" + len(data).to_bytes(4, "big") + data

    def meta_text(kind, text):
        raw = text.encode()
        return bytes([0xFF, kind]) + vlq(len(raw)) + raw

    tempo = [(0, 0, meta_text(0x03, TITLE)), (0, 0, b"\xff\x58\x04\x04\x02\x18\x08")]
    prev = None
    for start, _, bpm, _ in score.bars:
        if bpm != prev:
            tempo.append((round(start * tpb), 1, b"\xff\x51\x03" + round(60e6 / bpm).to_bytes(3, "big")))
            prev = bpm
    tracks = [chunk(tempo)]

    layout = [("melody", 0, "Piano Melody"), ("piano", 0, "Piano Arpeggio"),
              ("pad", 48, "Strings"), ("bass", 32, "Bass"), ("bell", 8, "Celesta")]
    for ch, (part, program, name) in enumerate(layout):
        ev = [(0, 0, meta_text(0x03, name)), (0, 0, bytes([0xC0 | ch, program])),
              (0, 0, bytes([0xB0 | ch, 91, 64]))]
        if part == "piano":   # 分解和弦用八分音符 + 延音踏板来表达，换和弦时换踏板
            for bar in score.bars:
                for _, start, _ in bar[3]:
                    tick = round(start * tpb)
                    ev += [(tick, 1, bytes([0xB0 | ch, 64, 0])), (tick + 20, 4, bytes([0xB0 | ch, 64, 127]))]
            ev.append((round(score.cursor * tpb), 1, bytes([0xB0 | ch, 64, 0])))
        for start, dur, m, vel in score.notes[part]:
            if part == "piano":
                dur = min(dur, 0.5)
            m += TRANSPOSE
            v = int(np.clip(round(vel * 127), 1, 127))
            ev.append((round(start * tpb), 3, bytes([0x90 | ch, m, v])))
            ev.append((round((start + dur) * tpb), 2, bytes([0x80 | ch, m, 0])))
        tracks.append(chunk(ev))

    header = b"MThd" + (6).to_bytes(4, "big") + (1).to_bytes(2, "big")
    header += len(tracks).to_bytes(2, "big") + tpb.to_bytes(2, "big")
    Path(path).write_bytes(header + b"".join(tracks))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    score = build_score()
    audio, length = render(score)
    wav = args.out / "morning-light.wav"
    write_wav(wav, audio)
    write_midi(score, args.out / "morning-light.mid")
    print(f"{wav}  ({length:.1f}s 音乐 + 余音)")

    if shutil.which("ffmpeg"):
        mp3 = args.out / "morning-light.mp3"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                        "-codec:a", "libmp3lame", "-b:a", "192k",
                        "-metadata", f"title={TITLE}", "-metadata", "genre=Instrumental", str(mp3)],
                       check=True)
        print(mp3)


if __name__ == "__main__":
    main()
