import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useSignedFile(uri, expires = 3600) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!uri) {
      setUrl("");
      return undefined;
    }
    let live = true;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: expires })
      .then((result) => {
        if (live) setUrl(result?.signed_url || "");
      })
      .catch(() => {
        if (live) setUrl("");
      });
    return () => {
      live = false;
    };
  }, [uri, expires]);

  return url;
}