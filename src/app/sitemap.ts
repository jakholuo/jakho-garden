import { MetadataRoute } from "next";
import { getAllPostIds, getAllTags, getPostById } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.jakho.net";

  // 获取所有文章ID
  const postIds = await getAllPostIds();

  // 获取每篇文章的详细信息并过滤
  const postEntries = await Promise.all(
    postIds.map(async (postId) => {
      const post = await getPostById(postId.params.slug);

      // 只包含非隐藏文章
      if (!post.isHidden) {
        return {
          url: `${baseUrl}/${postId.params.slug}`,
          lastModified: post.date ? new Date(post.date) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      }

      return null;
    })
  );

  // 过滤掉 null 值（隐藏文章）
  const filteredPostEntries = postEntries.filter((entry) => entry !== null);

  // 获取所有标签
  const tags = await getAllTags();
  const tagEntries = tags.map((tag) => ({
    url: `${baseUrl}/tags/${encodeURIComponent(tag.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // 固定页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/post`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ];

  return [...staticPages, ...filteredPostEntries, ...tagEntries];
}
