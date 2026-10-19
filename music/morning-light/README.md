# 《晨光》Morning Light

一首约 2 分 40 秒的纯音乐，温柔、明亮，适合清晨、读书或放空时听。
所有声音都由 [`compose.py`](compose.py) 用 Python + NumPy 从零合成：没有采样、没有音源库。

- 🎧 试听：[`morning-light.mp3`](morning-light.mp3)
- 🎹 MIDI 分轨：[`morning-light.mid`](morning-light.mid)（可导入 GarageBand / Logic / FL Studio 等换音色继续编曲）

## 乐曲信息

| 项目 | 内容 |
| --- | --- |
| 调性 | D 大调 |
| 拍号 / 速度 | 4/4，♩ = 74，尾声渐慢到 58 |
| 编制 | 毛毡钢琴（旋律 + 分解和弦）、弦乐铺底、低音、钢片琴 |
| 混音 | 合成的大厅混响、钢片琴乒乓延迟、母带软限幅 |

## 结构

| 段落 | 小节 | 和声（按 C 大调记，实际移到 D 大调） | 编配 |
| --- | --- | --- | --- |
| 前奏 | 4 | Fmaj7 – G – Em7 – Am7 | 钢琴分解和弦，弦乐渐入 |
| A1 | 8 | Fmaj7 – G – Em7 – Am7 – Dm7 – Em7 – Fmaj7 – Gsus4 G | 钢琴主旋律进入，低音加入 |
| B1 | 8 | C – G/B – Am7 – Em/G – Fmaj7 – C/E – Dm7 – Gsus4 G | 副歌，卡农式下行低音 |
| 间奏 | 4 | Fmaj7 – G – Em7 – Am7 | 钢片琴高八度唱出主题 |
| A2 | 8 | 同 A1 | 主旋律再现，钢片琴点缀 |
| B2 | 8 | 同 B1 | 高潮，钢片琴高八度重叠旋律 |
| 尾声 | 6 | Fmaj7 – G – Em7 – Am7 – Dm7 G – Cmaj9 | 主题回响，渐慢，停在 Cmaj9 上 |

前奏与 A 段用的是 IV–V–iii–vi 的“王道进行”，B 段是卡农式的下行低音线
（C – B – A – G – F – E – D），两者都是流行音乐里最“好听”的和声套路之一。

## 自己重新生成 / 修改

```bash
pip install numpy          # 唯一依赖；导出 mp3 还需要系统里有 ffmpeg
python3 compose.py         # 生成 morning-light.wav / .mid / .mp3（大约需要几分钟）
```

想改动的话，可以直接编辑 `compose.py` 顶部：

- `TRANSPOSE`：整体移调（0 = C 大调，2 = D 大调……）
- `A_MEL` / `B_MEL`：旋律，每个音写成 `(拍位, 时值, 音名)`
- `A_PROG` / `B_PROG` / `CHORDS`：和声进行与和弦排列
- `build_score()`：每一段的编配和力度
