import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

// =====================
// 类型定义
// =====================
export type PostData = {
  id: string;
  content: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  cover: string;
  isDraft?: boolean;
  isHidden?: boolean;
  [key: string]: unknown;
};

export type TagCount = {
  name: string;
  count: number;
  size?: string;
};

export type PaginatedPosts = {
  posts: PostData[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export type SearchResultItem = {
  post: PostData;
  score: number;
  matches: {
    title: boolean;
    tags: string[];
    description: boolean;
    content: { matched: boolean; excerpt: string };
  };
};

// =====================
// 常量
// =====================
const postsDirectory = path.join(process.cwd(), "src/content/posts");
const DRAFT_PREFIX = "draft-";
const HIDDEN_PREFIX = "hidden-";

// =====================
// 辅助函数
// =====================
function isDraftFile(fileName: string): boolean {
  return fileName.startsWith(DRAFT_PREFIX);
}

function isHiddenFile(fileName: string): boolean {
  return fileName.startsWith(HIDDEN_PREFIX);
}

function extractIdFromFileName(fileName: string): string {
  let id = fileName.replace(/\.md$/, "");
  if (id.startsWith(DRAFT_PREFIX)) id = id.slice(DRAFT_PREFIX.length);
  if (id.startsWith(HIDDEN_PREFIX)) id = id.slice(HIDDEN_PREFIX.length);
  return id;
}

// =====================
// 前置数据规范化（强类型返回）
// =====================
type NormalizedFM = {
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  cover: string;
  [key: string]: unknown;
};

function normalizeFrontMatter(data: any): NormalizedFM {
  const fm = (data || {}) as Record<string, unknown>;

  const title =
    typeof fm.title === "string" ? fm.title : String(fm.title ?? "Untitled");
  const date =
    typeof fm.date === "string"
      ? fm.date
      : String(fm.date ?? new Date().toISOString());
  const description =
    typeof fm.description === "string"
      ? fm.description
      : String(fm.description ?? "");
  const author =
    typeof fm.author === "string" ? fm.author : String(fm.author ?? "");
  const cover =
    typeof fm.cover === "string" ? fm.cover : String(fm.cover ?? "");

  let tags: string[] = [];

  if (Array.isArray(fm.tags)) {
    tags = fm.tags.map((t) => String(t));
  } else if (typeof fm.tags === "string") {
    tags = fm.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fm)) {
    if (
      !["title", "date", "description", "tags", "author", "cover"].includes(k)
    ) {
      extra[k] = v;
    }
  }

  return {
    title,
    date,
    description,
    tags,
    author,
    cover,
    ...extra,
  };
}

// =====================
// 读取所有文章（平铺文件夹）
// =====================
export async function getAllPosts(
  options: { includeDrafts?: boolean; includeHidden?: boolean } = {}
): Promise<PostData[]> {
  const { includeDrafts = false, includeHidden = false } = options;

  try {
    const fileNames = await fs.readdir(postsDirectory);
    const posts: PostData[] = [];

    for (const file of fileNames) {
      if (!file.endsWith(".md")) continue;
      if (!includeDrafts && isDraftFile(file)) continue;

      const isDraft = isDraftFile(file);
      const isHidden = isHiddenFile(file);
      const id = extractIdFromFileName(file);
      const fullPath = path.join(postsDirectory, file);
      const fileContents = await fs.readFile(fullPath, "utf8");
      const { data, content } = matter(fileContents);
      const fm = normalizeFrontMatter(data);

      const post: PostData = {
        id,
        content,
        isDraft,
        isHidden,
        title: fm.title,
        date: fm.date,
        description: fm.description,
        tags: fm.tags,
        author: fm.author,
        cover: fm.cover,
      };

      posts.push(post);
    }

    let result = posts;
    if (!includeHidden) {
      result = result.filter((p) => !p.isHidden);
    }

    // 按 date 降序
    result.sort((a, b) => (a.date < b.date ? 1 : -1));
    return result;
  } catch (error) {
    console.error("获取所有文章出错:", error);
    return [];
  }
}

// =====================
// 标签统计
// =====================
export async function getAllTags(): Promise<TagCount[]> {
  const posts = await getAllPosts({
    includeDrafts: false,
    includeHidden: false,
  });
  const tagCount: Record<string, number> = {};

  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return calculateTagSizes(tags);
}

function calculateTagSizes(tags: TagCount[]): TagCount[] {
  if (tags.length === 0) return tags;
  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));
  const minSize = 0.8;
  const maxSize = 2;

  return tags.map((tag) => {
    if (maxCount === minCount)
      return { ...tag, size: `${(minSize + maxSize) / 2}em` };
    const size =
      minSize +
      ((tag.count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
    return { ...tag, size: `${size.toFixed(2)}em` };
  });
}

export async function getPostsByTag(tagName: string): Promise<PostData[]> {
  const all = await getAllPosts({ includeDrafts: false, includeHidden: false });
  return all.filter((p) => (p.tags || []).includes(tagName));
}

// =====================
// 单篇文章获取（含前后导航）
// =====================
export async function getAllPostIds(): Promise<
  Array<{ params: { slug: string } }>
> {
  try {
    const fileNames = await fs.readdir(postsDirectory);
    return fileNames
      .filter((f) => f.endsWith(".md"))
      .filter((f) => !isDraftFile(f))
      .map((f) => ({ params: { slug: extractIdFromFileName(f) } }));
  } catch (error) {
    console.error("获取文章ID出错:", error);
    return [];
  }
}

export async function getPostById(id: string): Promise<
  PostData & {
    prevPost?: { id: string; title: string };
    nextPost?: { id: string; title: string };
  }
> {
  try {
    const fileNames = await fs.readdir(postsDirectory);
    const matchingFile = fileNames.find(
      (f) => extractIdFromFileName(f) === id && f.endsWith(".md")
    );

    if (!matchingFile) throw new Error(`找不到ID为 "${id}" 的文章`);
    if (isDraftFile(matchingFile)) throw new Error("草稿文章不允许访问");

    const fullPath = path.join(postsDirectory, matchingFile);
    const fileContents = await fs.readFile(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const fm = normalizeFrontMatter(data);
    const isHidden = isHiddenFile(matchingFile);

    const post: PostData = {
      id,
      content,
      isDraft: false,
      isHidden,
      title: fm.title,
      date: fm.date,
      description: fm.description,
      tags: fm.tags,
      author: fm.author,
      cover: fm.cover,
    };

    let prevPost: { id: string; title: string } | undefined;
    let nextPost: { id: string; title: string } | undefined;

    if (!post.isHidden) {
      const allPublic = await getAllPosts({
        includeDrafts: false,
        includeHidden: false,
      });
      const index = allPublic.findIndex((p) => p.id === id);
      prevPost =
        index < allPublic.length - 1
          ? { id: allPublic[index + 1].id, title: allPublic[index + 1].title }
          : undefined;
      nextPost =
        index > 0
          ? { id: allPublic[index - 1].id, title: allPublic[index - 1].title }
          : undefined;
    }

    return { ...post, prevPost, nextPost };
  } catch (error) {
    console.error(`获取文章 ${id} 出错:`, error);
    throw error;
  }
}

// =====================
// 分页
// =====================
export async function getAllPostsWithPagination(
  page = 1,
  pageSize = 10
): Promise<PaginatedPosts> {
  const all = await getAllPosts({ includeDrafts: false, includeHidden: false });
  const totalPosts = all.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const start = (validPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    posts: all.slice(start, end),
    totalPosts,
    totalPages,
    currentPage: validPage,
    pageSize,
  };
}

export async function getPostsByTagWithPagination(
  tagName: string,
  page = 1,
  pageSize = 10
): Promise<PaginatedPosts> {
  const all = await getPostsByTag(tagName);
  const totalPosts = all.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const start = (validPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    posts: all.slice(start, end),
    totalPosts,
    totalPages,
    currentPage: validPage,
    pageSize,
  };
}

// =====================
// 搜索
// =====================
export async function searchPosts(
  keyword: string
): Promise<SearchResultItem[]> {
  if (!keyword.trim()) return [];

  const all = await getAllPosts({ includeDrafts: false, includeHidden: false });
  const q = keyword.toLowerCase();

  const scored = all.map((post) => {
    let score = 0;
    const matches = {
      title: false,
      tags: [] as string[],
      description: false,
      content: { matched: false, excerpt: "" },
    };

    if (post.title.toLowerCase().includes(q)) {
      score += 10;
      matches.title = true;
      if (post.title.toLowerCase().startsWith(q)) score += 5;
    }

    (post.tags || []).forEach((tag) => {
      if (tag.toLowerCase().includes(q)) {
        score += 8;
        matches.tags.push(tag);
        if (tag.toLowerCase() === q) score += 5;
      }
    });

    if (post.description.toLowerCase().includes(q)) {
      score += 5;
      matches.description = true;
    }

    if (post.content.toLowerCase().includes(q)) {
      score += 3;
      matches.content.matched = true;
      const idx = post.content.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(post.content.length, idx + q.length + 50);
        let excerpt = post.content.substring(start, end);
        if (start > 0) excerpt = "..." + excerpt;
        if (end < post.content.length) excerpt += "...";
        matches.content.excerpt = excerpt;
      }
    }

    const hasMatches =
      matches.title ||
      matches.description ||
      matches.content.matched ||
      matches.tags.length > 0;
    if (hasMatches)
      score += new Date(post.date).getTime() / (1000 * 60 * 60 * 24) / 100;

    return { post, score, matches };
  });

  const matched = scored.filter(
    (m) =>
      m.matches.title ||
      m.matches.description ||
      m.matches.content.matched ||
      m.matches.tags.length > 0
  );

  matched.sort((a, b) => b.score - a.score);
  return matched;
}

export async function searchPostsWithPagination(
  keyword: string,
  page = 1,
  pageSize = 10
) {
  const allResults = await searchPosts(keyword);
  const totalPosts = allResults.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const start = (validPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    posts: allResults.slice(start, end),
    totalPosts,
    totalPages,
    currentPage: validPage,
    pageSize,
  };
}
