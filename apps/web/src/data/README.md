# Danmaku Emotes Configuration (弹幕表情与特殊符号配置)

本目录下的 [`danmaku-emotes.json`](./danmaku-emotes.json) 用于维护 TypeType 的弹幕表情、热词与彩蛋符号映射表。

## 贡献指南 (How to Contribute)

任何贡献者都可以直接在该 JSON 文件中新增或维护表情符号，无需修改复杂的解析逻辑代码。

### 字段说明 (Schema)

每个表情对象包含以下字段：

| 字段 | 类型 | 是否必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **必填** | - | 唯一标识符，建议使用全小写英文与短横线（如 `"doge"`, `"high-energy"`）。 |
| `name` | `string` | **必填** | - | 表情名称，用于无障碍提示、图片 `alt` 和 `title`。 |
| `patterns` | `string[]` | **必填** | - | 触发匹配的关键词或括号代码数组（如 `["[ohh]", "ohh", "OHH"]`、`["[doge]"]`）。 |
| `url` | `string` | **必填** | - | 表情图片的链接。支持 HTTPS CDN 直链（如 B 站官方静态资源 `https://i0.hdslb.com/...`）、相对路径静态资源或 Base64 Data URI。 |
| `aspectRatio` | `number` | 可选 | `1` | 图片宽高比（宽 / 高）。方形表情默认为 1；对于横幅/徽章型彩蛋（如 `1800x600` 的 `OHH`、`前方高能`），可指定为 `3`。 |
| `description` | `string` | 可选 | - | 仅用于贡献者维护的注释说明。 |

### 添加新表情示例

```json
{
  "id": "miao-a",
  "name": "妙啊",
  "patterns": ["[妙啊]", "妙啊"],
  "url": "https://i0.hdslb.com/bfs/live/7b7a2567ad1520f962ee226df777eaf3ca368fbc.png",
  "aspectRatio": 2.3,
  "description": "经典妙啊弹幕徽章"
}
```

### 匹配规则机制

1. **括号表情**（如 `[doge]`、`[滑稽]`）：在弹幕内容中匹配到时，会替换为对应表情图标。
2. **纯英文/数字关键词**（如 `ohh`、`awsl`）：分词引擎自动添加词边界匹配（word boundary），避免误伤正常单词（如不会误伤 `John`）。
3. **中文关键词**（如 `前方高能`、`妙啊`）：直接精准匹配该词组并替换为对应的图形徽章。
4. **渲染回退**：若图片因为网络等不可抗力加载失败，前端会自动隐去损坏图标并安全优雅降级。
