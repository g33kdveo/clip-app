import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { creatorClips, importTwitchClip } from "@/lib/twitch-fns";
import FormatBar from "@/components/twitch/FormatBar";
import TwitchClips from "@/components/twitch/TwitchClips";
import ImportedList from "@/components/twitch/ImportedList";

export default function CreatorPanel({ creator }) {
  const load = useServerFn(creatorClips);
  const importClip = useServerFn(importTwitchClip);

  const [clips, setClips] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState([]);
  const [importing, setImporting] = useState(null);
  const [imported, setImported] = useState([]);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    let alive = true;
    setReady(false);
    setError("");
    setClips([]);
    setPicked([]);
    setImported([]);
    setImportError("");

    load({ data: { id: creator.id } })
      .then((result) => {
        if (!alive) return;
        const list = result.clips || [];
        setClips(list);
        setPicked(
          [...list]
            .sort((a, b) => b.views - a.views)
            .slice(0, 3)
            .map((clip) => clip.id)
        );
      })
      .catch((problem) => {
        if (alive) setError(problem?.message || "Twitch clips could not be read.");
      })
      .finally(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [creator.id, load]);

  const toggle = (id) => {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const formatSelected = async () => {
    const targets = clips.filter((clip) => picked.includes(clip.id));
    if (!targets.length) return;
    setImportError("");
    setImported([]);
    const done = [];

    for (let index = 0; index < targets.length; index += 1) {
      setImporting({ index: index + 1, total: targets.length, title: targets[index].title });
      try {
        const result = await importClip({ data: { clipId: targets[index].id } });
        done.push(result);
        setImported([...done]);
      } catch (problem) {
        setImportError(`${targets[index].title}: ${problem?.message || "could not be imported."}`);
        break;
      }
    }
    setImporting(null);
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow">{creator.display_name} · recent clips</span>
        <span className="text-[11.5px] text-black/30">
          {ready ? `${clips.length} most recent` : "Reading Twitch…"}
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-[14px] bg-[#FDECEA] px-4 py-3 text-[12.5px] text-[#A32D1E]">
          {error}
        </p>
      ) : null}

      {clips.length ? (
        <FormatBar
          count={picked.length}
          onFormat={formatSelected}
          importing={importing}
          error={importError}
        />
      ) : null}

      {ready && !error && !clips.length ? (
        <p className="mt-4 rounded-[18px] border border-dashed border-black/15 bg-[#FAFAFA] p-6 text-[13px] text-black/40">
          Nothing clipped from this creator yet. While they're live, their moments show up here as
          soon as someone clips them.
        </p>
      ) : (
        <TwitchClips clips={clips} picked={picked} onToggle={toggle} />
      )}

      <ImportedList items={imported} />
    </section>
  );
}