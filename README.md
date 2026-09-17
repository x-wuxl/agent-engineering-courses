# AI Agent 工程课

托管在 GitHub Pages 上的多课程静态站点。根目录展示课程列表，每门课程拥有独立的阅读器与文章目录。

## 目录结构

```text
.
├─ index.html                 # 课程中心首页
├─ courses.json               # 课程目录元数据
├─ assets/
│  ├─ css/                    # 共享样式
│  └─ js/                     # 首页与阅读器脚本
├─ courses/
│  └─ <slug>/
│     ├─ index.html           # 课程阅读器外壳
│     ├─ articles.json        # 课程文章目录
│     └─ articles/            # Markdown 文章与图片资源
└─ scripts/validate_courses.py
```

## 本地预览

```powershell
python -m http.server 4173
```

浏览器访问：

- 课程中心：`http://localhost:4173/`
- 现有课程：`http://localhost:4173/courses/agent-harness-build/`

## 新增课程

1. 新建目录 `courses/<slug>/`。
2. 从现有课程复制 `index.html` 外壳。
3. 放入该课程的 `articles.json` 和 `articles/` 内容。
4. 在根 `courses.json` 中添加该课程的元数据。
5. 运行 `python scripts/validate_courses.py` 校验。
6. 本地启动静态服务器确认卡片和文章页正常。

## 数据来源

- 根 `courses.json`：课程列表的唯一来源。
- 每门课程的 `articles.json`：该课程章节与文章的唯一来源。
- 文章正文继续使用 Markdown，图片相对路径由阅读器解析。
