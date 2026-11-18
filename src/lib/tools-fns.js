import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const STYLE_NOTE = {
  none: "",
  photo: "Shot like a real photograph: natural light, shallow depth of field, believable detail.",
  cinematic: "Cinematic still: anamorphic framing, dramatic lighting, film grain, rich contrast.",
  illustration: "Modern editorial illustration: flat shapes, confident line work, limited palette.",
  three_d: "Soft 3D render: rounded geometry, matte materials, gentle studio lighting.",
  anime: "Anime key art: clean linework, expressive eyes, bold color, dynamic angle.",
  product: "Product shot on a seamless backdrop: crisp studio light, sharp focus, generous negative space.",
};

function clean(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

export const generateImageTool = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      prompt: z.string().min(3).max(1200),
      style: z
        .enum(["none", "photo", "cinematic", "illustration", "three_d", "anime", "product"])
        .optional(),
      ratio: z.enum(["9:16", "1:1", "16:9"]).optional(),
      kind: z.enum(["image", "icon"]).optional(),
      title: z.string().max(200).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const style = data.style || "none";
    const ratio = data.ratio || "9:16";
    const kind = data.kind || "image";

    const framing =
      kind === "icon"
        ? "A single centered app icon, bold silhouette, flat background, no text, no letters, no device frame."
        : `Vertical composition built for ${ratio} framing, main subject centered with breathing room.`;

    const prompt = [
      clean(data.prompt),
      STYLE_NOTE[style],
      framing,
      "High quality, no watermark, no text overlays.",
    ]
      .filter(Boolean)
      .join(" ");

    const { url } = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });

    const record = await base44.entities.ToolOutput.create({
      tool: kind === "icon" ? "icon" : "image",
      title: clean(data.title) || clean(data.prompt).slice(0, 90),
      prompt: clean(data.prompt),
      url,
      meta: JSON.stringify({ style, ratio, kind }),
    });

    return { id: record?.id || "", url };
  });

export const generateIconSet = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      brand: z.string().min(2).max(120),
      vibe: z.enum(["bold", "playful", "minimal", "retro", "premium"]).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const vibe = data.vibe || "bold";
    const vibeNote = {
      bold: "high contrast, thick shapes, confident",
      playful: "rounded, friendly, saturated color",
      minimal: "single simple mark, lots of negative space",
      retro: "chunky outline, 70s palette, print feel",
      premium: "restrained, monochrome with one accent, jewel-like",
    }[vibe];

    const concepts = [
      "a monogram built from the brand initial",
      "a symbol that suggests the brand's subject",
      "an abstract geometric mark",
      "a mascot-style character mark",
    ];

    const urls = await Promise.all(
      concepts.map(async (concept) => {
        const prompt = `App icon for a creator brand called "${clean(
          data.brand
        )}". The mark is ${concept}. Style: ${vibeNote}. Single centered icon, flat background, no text or letters beyond the monogram, no device frame, no mockup. Crisp edges, readable at small sizes.`;
        const { url } = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        return url;
      })
    );

    const record = await base44.entities.ToolOutput.create({
      tool: "icon",
      title: clean(data.brand),
      prompt: `${clean(data.brand)} · ${vibe}`,
      url: urls[0],
      text: JSON.stringify(urls),
      meta: JSON.stringify({ vibe, count: urls.length }),
    });

    return { id: record?.id || "", urls };
  });

export const generateVoiceover = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      script: z.string().min(3).max(3000),
      voice: z.enum(["river", "honey", "sunny", "storm", "spark"]).optional(),
      language: z.string().max(6).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const script = String(data.script).slice(0, 3000);
    const { url } = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text: script,
      voice: data.voice || "river",
      language_code: data.language || undefined,
    });

    const record = await base44.entities.ToolOutput.create({
      tool: "voiceover",
      title: clean(script).slice(0, 90),
      prompt: script.slice(0, 400),
      url,
      meta: JSON.stringify({ voice: data.voice || "river", language: data.language || "auto" }),
    });

    return { id: record?.id || "", url };
  });

export const brainstorm = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      topic: z.string().min(2).max(600),
      platform: z.enum(["tiktok", "reels", "shorts", "x"]).optional(),
      tone: z.enum(["punchy", "funny", "hype", "calm", "analytical"]).optional(),
      audience: z.string().max(200).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const platform = data.platform || "tiktok";
    const tone = data.tone || "punchy";

    const prompt = `You are a short-form content strategist for a streamer's clip page.

Topic or niche: ${clean(data.topic)}
Platform: ${platform}
Tone: ${tone}
${data.audience ? `Audience: ${clean(data.audience)}` : ""}

Give eight clip ideas that could actually be cut from a stream around this topic. Each idea must name the moment to look for in the footage, not a vague theme.

Rules:
- Titles are at most 60 characters, curiosity over clickbait.
- The hook is the literal first line spoken on screen, at most 45 characters.
- "moment" says what to look for in the source, in one sentence.
- "why" says why it would travel, in one sentence.
- Also give five standalone opening lines the streamer can say to set up a clip.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                hook: { type: "string" },
                moment: { type: "string" },
                why: { type: "string" },
              },
              required: ["title", "hook", "moment", "why"],
            },
          },
          openers: { type: "array", items: { type: "string" } },
        },
        required: ["ideas", "openers"],
      },
    });

    const ideas = (result?.ideas || []).slice(0, 8);
    const openers = (result?.openers || []).slice(0, 5);

    const record = await base44.entities.ToolOutput.create({
      tool: "brainstorm",
      title: clean(data.topic).slice(0, 90),
      prompt: `${clean(data.topic)} · ${platform} · ${tone}`,
      text: JSON.stringify({ ideas, openers }),
      meta: JSON.stringify({ platform, tone }),
    });

    return { id: record?.id || "", ideas, openers };
  });