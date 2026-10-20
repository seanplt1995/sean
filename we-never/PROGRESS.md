# 进度记录（便于下次会话接续）

## 已完成
- `index.html`：完整单文件 WebGL2 程序，8 幕时间轴（按实测 128.0 BPM 校准：Drop I 15.04 s、Drop II 59.57 s）、GPGPU 粒子、反应扩散、泛光/色散/万花筒、HUD、MediaRecorder 录制（全片 / 抖音 09–45 切片）、演示模式、快捷键。
- `render.mjs`：离线逐帧渲染器（Playwright + ffmpeg），GPU 端转 YUV420 后输出 H.264 + AAC MP4，也可导出 PNG 预览。
- 修过的问题：半精度 HDR 溢出（INF/NaN 污染拖尾与泛光）、旋度噪声过强导致结构糊掉、Drop 闪白、配色按 sRGB→线性处理、长焦镜头下粒子过小、熵值回读、洛伦兹粒子挤成一条亮带、丝绸漩涡过曝。

## 全片预览检查（10–20 fps 抽帧）
- 第 I 幕：金沙细流覆盖隐形球面，808 冲击环 —— 好
- 第 II 幕：克莱因瓶 → 奇点 → 极细 `WE NEVER` —— 好
- 第 III 幕：双螺旋龙卷 → 洛伦兹吸引子“沙幕” → 28 s 起 8 重万花筒 —— 好（万花筒段略暗）
- 第 IV 幕：球形边界陀螺仪曲面迷宫（边缘光）→ 43 s 液滴迸散 —— 可以
- 第 V 幕：三层薄膜干涉丝绸 → 58 s 漩涡奇点 → 再次凝字 —— 好
- 第 VI 幕：金色四维超立方体 + 蓝色经纬晶格，67.5 s 变 (3,7) 环面纽结 —— 很好
- 第 VII 幕：8 层叶序 + 玫瑰窗环/辐条的曼陀罗隧道 —— 很好（四角有少量放射线，属“跃迁”效果）
- 第 VIII 幕：余烬与萤火飘落，102.4 s 归零 —— 好

## 正式渲染
- 命令：`node render.mjs --audio <mp3> --fps 60 --crf 18 --out WeNever_full_1080x1920_60fps.mp4`
- 本容器（无显卡，SwiftShader）约 0.8 s/帧，全片 6152 帧约 85 分钟；有显卡的电脑加 `--headed` 快很多。
- 抖音 36 秒切片可从成片裁出（重新编码保证首帧是关键帧）：
  `ffmpeg -ss 9.04 -t 36 -i WeNever_full_1080x1920_60fps.mp4 -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 320k -movflags +faststart WeNever_douyin_09-45.mp4`
