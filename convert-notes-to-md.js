/**
 * convert-notes-to-md.js
 *
 * 将 ./notes 下 JSON 转为 Markdown 文件
 * 仅转换 tags 中包含 "post" 的项（不区分大小写）
 * 文件名优先使用 attributes 中 trait_type === "xlog_slug" 的 value
 *
 * 运行：
 *   node convert-notes-to-md.js
 */

const fs = require("fs");
const path = require("path");

const AUTHOR = "Jakho"; // !!! 请注意修改作者为自己
const INPUT_DIR = path.join(process.cwd(), "notes");
const OUTPUT_DIR = path.join(process.cwd(), "markdown");

// ========== 工具函数 ==========
const tagToString = (t) =>
  typeof t === "string"
    ? t
    : typeof t === "object" && t
    ? t.value || t.name || JSON.stringify(t)
    : "";

const hasPostTag = (tags) =>
  Array.isArray(tags) &&
  tags.some((t) => tagToString(t).toLowerCase() === "post");

const filterOutPost = (tags) =>
  (Array.isArray(tags) ? tags.map(tagToString) : []).filter(
    (t) => t.trim() && t.toLowerCase() !== "post"
  );

const escapeYAML = (str = "") =>
  String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");

const safeFilename = (name, fallback = "untitled") =>
  (name && name.trim() ? name : fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim()
    .slice(0, 200);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toISOString().split("T")[0];
};

// ========== 主逻辑 ==========
if (!fs.existsSync(INPUT_DIR)) {
  console.error(`❌ 找不到输入目录: ${INPUT_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const files = fs.readdirSync(INPUT_DIR);
let converted = 0;

for (const file of files) {
  if (!file.endsWith(".json")) continue;

  try {
    const json = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, file), "utf-8")
    );
    const meta = json.metadata || {};
    const content = meta.content || {};

    // 1️⃣ 检查 tags 是否包含 "post"
    const tags =
      content.tags ||
      meta.tags ||
      json.tags ||
      json.metadata?.tags ||
      json.metadata?.content?.tags ||
      [];
    if (!hasPostTag(tags)) continue;

    // 2️⃣ 提取基础字段
    const title = content.title || "未命名标题";
    const date = formatDate(
      content.date_published || json.publishedAt || json.createdAt
    );
    const description = content.summary || "";
    const body = content.content || "";

    // 3️⃣ 处理 cover（若为 ipfs:// 开头则替换）
    let cover = "";
    const attachments = content.attachments || [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      const first = attachments.find((a) => a?.address || a?.url);
      if (first) {
        cover = first.address || first.url;
        if (cover.startsWith("ipfs://")) {
          cover = cover.replace(/^ipfs:\/\//i, "https://ipfs.io/ipfs/");
        }
      }
    }

    // 4️⃣ tags 过滤掉 "post"
    const filteredTags = filterOutPost(tags);

    // 5️⃣ 文件名使用 attributes 中 xlog_slug 的 value
    let slug =
      content.attributes?.find?.((a) => a.trait_type === "xlog_slug")?.value ||
      "";
    const filename = safeFilename(slug || title, path.basename(file, ".json"));

    // 6️⃣ 生成 Markdown 内容
    const frontMatter =
      `---\n` +
      `title: "${escapeYAML(title)}"\n` +
      (date ? `date: "${date}"\n` : "") +
      (description ? `description: "${escapeYAML(description)}"\n` : "") +
      `tags: [${filteredTags.map((t) => `"${escapeYAML(t)}"`).join(", ")}]\n` +
      (cover ? `cover: "${escapeYAML(cover)}"\n` : "") +
      `author: "${escapeYAML(AUTHOR)}"\n` +
      `---\n\n${body.trim()}\n`;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${filename}.md`),
      frontMatter,
      "utf-8"
    );
    console.log(`✅ 已转换: ${file} → ${filename}.md`);
    converted++;
  } catch (err) {
    console.error(`❌ 处理 ${file} 时出错: ${err.message}`);
  }
}

console.log(
  `\n🎉 转换完成，共生成 ${converted} 个 Markdown 文件。输出目录: ${OUTPUT_DIR}`
);
