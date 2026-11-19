#!/usr/bin/env python3
"""重新生成前端用的字体子集。

用法（需 fonttools 与 brotli）：
    python3 -m venv /tmp/fv && /tmp/fv/bin/pip install fonttools brotli
    /tmp/fv/bin/python tools/subset-font.py

取字范围：项目里出现过的全部汉字（index.html、文案原料、docs、存档）+ GB2312 一级常用字
+ ASCII + 常用标点。界面新增文案若出现回落字体，多半是这个字的字形不在子集里，重跑即可。
完整字库 assets/fonts/zhuque-fangsong.woff2 只作底本，不要在前端引用。
"""
import glob
import os

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, 'assets/fonts/zhuque-fangsong.woff2')
OUT = os.path.join(ROOT, 'assets/fonts/zhuque-fangsong-subset.woff2')

SOURCES = [os.path.join(ROOT, n) for n in ('index.html', 'AGENTS.md', 'README.md')]
SOURCES += glob.glob(os.path.join(ROOT, '宫斗模拟器原料', '*'))
SOURCES += glob.glob(os.path.join(ROOT, 'docs', '*'))
SOURCES += glob.glob(os.path.join(ROOT, '*.json'))


def char_set():
    text = ''
    for path in SOURCES:
        if os.path.isfile(path):
            try:
                text += open(path, encoding='utf-8', errors='ignore').read()
            except OSError:
                pass
    chars = {ch for ch in text if '\u4e00' <= ch <= '\u9fff'}
    for cp in range(0x4e00, 0x9fa6):  # GB2312 一级汉字（3755 常用字）
        ch = chr(cp)
        try:
            b = ch.encode('gb2312')
        except UnicodeEncodeError:
            continue
        if len(b) == 2 and b[0] < 0xD8:
            chars.add(ch)
    chars |= {chr(c) for c in range(0x20, 0x7f)}
    chars |= set('，。、；：？！“”‘’（）《》〈〉【】—…·「」『』～％＃＠￥＆×÷＋－＝│｜')
    return chars


def main():
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.desubroutinize = True
    font = TTFont(FULL)
    sub = subset.Subsetter(options=opts)
    sub.populate(text=''.join(sorted(char_set())))
    sub.subset(font)
    font.save(OUT)
    print(f'{OUT}: {os.path.getsize(OUT) / 1024:.1f} KB (from {os.path.getsize(FULL) / 1024:.1f} KB)')


if __name__ == '__main__':
    main()
