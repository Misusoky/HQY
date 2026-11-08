# 设计 ⇄ 代码 同步协议

Kimi Design 的产出是游戏的**视觉唯一事实来源**；`index.html` 里的 CSS 是它的翻译。
本目录负责把两者钉在一起。

## 格式事实（已验证）

`.kui.fig` 是 zip 包，内含：

| 文件 | 内容 | 用途 |
|---|---|---|
| `canvas.fig` | `fig-kiwi` 魔数 + offset 16 起 deflate 压缩的 CRDT 场景图（类 Figma 二进制协议） | 结构可解，但**文字与样式值无法低成本提取**，不做解析 |
| `thumbnail.png` | 整版高清渲染图（2892×4116） | **翻译主依据**：逐屏读取、量色、量距 |
| `images/*` | 内嵌位图素材（无损取出） | 直接 base64 内嵌进 index.html |
| `meta.json` | 文件名/格式版本 | 无实际用途 |

结论：每次同步以 thumbnail.png 为"可读 spec"，素材自动提取；文字内容一律以游戏数据模型为准
（设计稿里的文案是占位，如「辰时/圣眷/智谋」要归一化为存档 schema 的「旬/宠爱/好感」等）。

## 版本目录

每次从 Kimi Design 导出后，把 `.kui.fig` 丢进 `design/vX-名称/`，通知我（或我自动发现）即完成归档。
命名递增：v1-深宫辞、v2-……；旧版本永不清除，可回溯。

## 一轮同步的流程

1. **归档**：新 `.kui.fig` 入 `design/vN-xxx/`，自动解出 thumbnail 与 images。
2. **diff**：我对比新旧 thumbnail，列出视觉变化清单（新增屏/组件/改色改距）。
3. **翻译**：更新 `TOKENS.md` 的度量值，再把变更落到 `index.html` 的 THEME 区组件上。
4. **回验**：浏览器渲染截图 vs 设计稿，偏差在 ±1—2px 内收工。

## 你（设计者）怎么配合

- **想加视觉/交互**：在 Kimi Design 里改，导出 `.kui.fig` 丢进来，一句话说明重点。一次批量加比零散加快。
- **想要高保真**：Kimi Design 里逐屏导出 PNG（比整版 thumbnail 更清晰），放进同目录；
  书法标题这类**字体艺术字**建议单独导出透明底 PNG——这是唯一"CSS 仿不像"的类别。
- **想加玩法/逻辑**：不用过设计稿，直接用话说，我改代码。

## 素材提取命令（备查）

```bash
unzip -o xxx.kui.fig -d design/vN-xxx/
# canvas.fig 解压缩（仅调试结构用）：
python3 -c "import zlib;d=open('canvas.fig','rb').read();open('canvas.decoded','wb').write(zlib.decompressobj(-15).decompress(d[16:]))"
```
