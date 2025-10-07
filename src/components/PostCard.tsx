import Link from "next/link";

export interface PostCardProps {
  post: {
    id: string;
    title: string;
    date: string;
    description: string;
    tags: string[];
    author?: string;
    cover?: string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="relative border border-border p-6 overflow-hidden">
      {/* 封面图 */}
      {post.cover && (
        <img
          src={post.cover}
          alt={post.title + " 封面图"}
          className="absolute bottom-0 right-0 h-full object-cover opacity-20 pointer-events-none select-none hidden md:block"
          style={{
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
          }}
        />
      )}

      <Link href={`/${post.id}`}>
        <h3 className="text-xl font-semibold mb-2 text-card-foreground hover:text-primary transition-colors">
          {post.title}
        </h3>
      </Link>

      <p className="text-muted-foreground text-sm mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 inline-block mr-1 align-[-2px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {new Date(post.date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <p className="text-card-foreground mb-4">{post.description}</p>

      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag: string) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground px-2 py-1 rounded-md text-xs transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
