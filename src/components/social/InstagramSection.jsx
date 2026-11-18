import { ExternalLink, Clapperboard } from "lucide-react";
import { Image } from "@/components/ui/image";
import ViewCount from "@/components/social/ViewCount";

export default function InstagramSection({ posts }) {
  if (!posts.length) return null;

  return (
    <div className="mt-4 grid grid-cols-3 gap-[3px] sm:gap-1.5">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative aspect-square overflow-hidden rounded-[6px] bg-[#F1F1F1]"
        >
          {post.thumbnail_url ? (
            <Image src={post.thumbnail_url} alt={post.title} className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#FED50C] p-2.5">
              <span className="line-clamp-3 text-center text-[11px] font-semibold leading-tight">
                {post.title}
              </span>
            </div>
          )}

          <span className="absolute right-1.5 top-1.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            <Clapperboard className="h-3.5 w-3.5" />
          </span>

          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="absolute left-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label="Open the post"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div className="absolute bottom-1.5 right-1.5">
            <ViewCount views={post.views} />
          </div>
        </div>
      ))}
    </div>
  );
}