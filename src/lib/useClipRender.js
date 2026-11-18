import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { renderClip, dataUrlToFile } from "@/lib/clipRender";
import { saveRenderedClip, sourceSignedUrl } from "@/lib/server-fns";

export function useClipRender() {
  const [states, setStates] = useState({});

  function patch(id, value) {
    setStates((current) => ({ ...current, [id]: { ...(current[id] || {}), ...value } }));
  }

  async function render(clip, jobId) {
    patch(clip.id, { busy: true, progress: 0, error: "" });
    try {
      const { url } = await sourceSignedUrl({ data: { jobId } });
      const { blob, thumbnail, ext, muted } = await renderClip({
        sourceUrl: url,
        clip,
        onProgress: (progress) => patch(clip.id, { progress }),
      });

      const videoFile = new File([blob], `${clip.id}.${ext}`, { type: blob.type });
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: videoFile });
      const thumbFile = dataUrlToFile(thumbnail, `${clip.id}.jpg`);
      const thumb = await base44.integrations.Core.UploadPrivateFile({ file: thumbFile });

      const saved = await saveRenderedClip({
        data: {
          id: clip.id,
          rendered_uri: uploaded.file_uri,
          thumbnail_uri: thumb.file_uri,
          rendered_ext: ext,
        },
      });

      patch(clip.id, { busy: false, progress: 1, error: "", muted: Boolean(muted) });
      return saved;
    } catch (error) {
      patch(clip.id, { busy: false, error: String(error?.message || error) });
      return null;
    }
  }

  return { states, render };
}