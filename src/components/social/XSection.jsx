import { ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import ViewCount from "@/components/social/ViewCount";
import { formatViews, formatWhen } from "@/lib/social";

export default function XSection({ posts }) {
  if (!posts.length) return null;

  return (
    <ul className="mt-4 divide-y divide-black/[0.07] border-t border-black/[0.07]">
      {posts.map((post) => (
        <li key={post.id} className="py-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-black/[0.06]" />

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11.5px] text-black/35">
                <span>{formatWhen(post.posted_at)}</span>
                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-black/20 transition-colors hover:text-black"
                    aria-label="Open the post"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </p>

              <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed">{post.title}</p>

              {post.thumbnail_url ? (
                <div className="mt-2.5 overflow-hidden rounded-[14px] border border-black/10">
                  <Image src={post.thumbnail_url} alt="" className="aspect-video w-full" />
                </div>
              ) : null}

              {post.likes || post.comments || post.views ? (
                <div className="mt-2 flex items-center gap-4 text-[11.5px] text-black/35">
                  {post.likes ? <span>{formatViews(post.likes)} likes</span> : null}
                  {post.comments ? <span>{formatViews(post.comments)} replies</span> : null}
                  {post.views ? (
                    <div className="ml-auto">
                      <ViewCount views={post.views} tone="light" />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}