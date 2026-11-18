import { ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import ViewCount from "@/components/social/ViewCount";

export default function TikTokSection({ posts }) {
  if (!posts.length) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative aspect-[9/16] overflow-hidden rounded-[12px] bg-[#111111]"
        >
          {post.thumbnail_url ? (
            <Image src={post.thumbnail_url} alt={post.title} className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1B1B1B] p-3">
              <span className="line-clamp-4 text-center text-[11.5px] font-semibold leading-tight text-white/80">
                {post.title}
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />

          <p className="absolute inset-x-2 bottom-9 line-clamp-2 text-[11.5px] font-medium leading-tight text-white">
            {post.title}
          </p>

          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label="Open the post"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div className="absolute bottom-2 right-2">
            <ViewCount views={post.views} />
          </div>
        </div>
      ))}
    </div>
  );
}