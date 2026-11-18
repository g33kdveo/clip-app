import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// The preview is one of crayo's own clip frames, shown whole: the frame is
// already 9:16, so it fills the card without being stretched or squashed.
// Wide frames (letterbox) sit contained on black, the way they play.
export default function TemplateGlyph({ template }) {
  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[8px] bg-[#0A0A0A]">
      <Image
        src={template.shot}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full",
          template.fit === "contain" ? "object-contain" : "object-cover"
        )}
      />
    </div>
  );
}