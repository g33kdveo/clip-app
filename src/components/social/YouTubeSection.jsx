import { ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import ViewCount from "@/components/social/ViewCount";
import { formatWhen } from "@/lib/social";

export default function YouTubeSection({ posts }) {
  if (!posts.length) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <div key={post.id}>
          <div className="relative aspect-video overflow-hidden rounded-[12px] bg-[#F1F1F1]">
            {post.thumbnail_url ? (
              <Image src={post.thumbnail_url} alt={post.title} className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#FED50C] p-3">
                <span className="line-clamp-3 text-center text-[12px] font-semibold leading-tight">
                  {post.title}
                </span>
              </div>
            )}

            <div className="absolute bottom-1.5 right-1.5">
              <ViewCount views={post.views} />
            </div>
          </div>

          <div className="mt-2 flex items-start gap-2">
            <p className="line-clamp-2 flex-1 text-[12.5px] font-semibold leading-snug">
              {post.title}
            </p>
            {post.url ? (
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 shrink-0 text-black/20 transition-colors hover:text-black"
                aria-label="Open the upload"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-black/35">{formatWhen(post.posted_at)}</p>
        </div>
      ))}
    </div>
  );
}