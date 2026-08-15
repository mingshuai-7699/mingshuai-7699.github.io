# 李明帅 · Portfolio 2026

个人面试作品集网页。首屏参考用户提供的 2025 黑色技术感排版，年份已改为 2026；内容区收录原作品目录中的 219 张图片与 10 个视频。

根目录的 `index.html` 支持直接双击，在 Chrome、Edge 等外部浏览器中以离线模式打开；无需先启动开发服务器。

## 本地运行

```powershell
pnpm install
pnpm run dev
```

生产构建：

```powershell
pnpm run build
```

## 更新作品素材

素材源目录：`E:\Codex文件夹\网页设计\作品集画廊`

重新生成媒体索引与缩略图：

```powershell
python scripts/build-media-library.py
```

脚本优先创建硬链接，不修改源文件；网页使用 `public/media-manifest.json` 进行分类、搜索和灯箱预览。
