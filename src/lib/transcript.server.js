function toSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\[\s*__\s*\]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1);
}

const WORDS_PER_SECOND = 2.6;
const round2 = (value) => Math.round(value * 100) / 100;

// Timing comes from a speaking-rate model: every line gets the time its words
// actually take, and whatever is left over becomes a pause between lines. That
// keeps captions sitting on the speech instead of drifting across the whole file.
export function timedLines(text, duration) {
  const lines = toSentences(text);
  if (!lines.length) return [];
  const spans = lines.map((line) => Math.max(0.5, line.split(/\s+/).length / WORDS_PER_SECOND));
  const totalSpan = spans.reduce((sum, value) => sum + value, 0);
  const total = Number(duration) || 0;
  const scale = total && totalSpan > total ? total / totalSpan : 1;
  const speech = totalSpan * scale;
  const gap = lines.length > 1 && total > speech ? (total - speech) / (lines.length - 1) : 0;
  let cursor = 0;
  return lines.map((line, index) => {
    const start = cursor;
    const end = cursor + spans[index] * scale;
    cursor = end + gap;
    return { t: round2(start), e: round2(end), text: line };
  });
}

export function wordsFor(lines, start, end) {
  const inside = lines.filter((l) => l.e > start && l.t < end);
  const words = [];
  for (const line of inside) {
    const tokens = line.text.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const from = Math.max(line.t, start);
    const to = Math.min(line.e, end);
    const span = Math.max(0.1, to - from);
    // longer words take longer to say, so weight each word by its own length
    const weights = tokens.map((token) => Math.max(2, token.replace(/[^\w']/g, "").length + 1));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
    let t = from - start;
    tokens.forEach((token, index) => {
      const slice = span * (weights[index] / totalWeight);
      words.push({ w: token, s: round2(t), e: round2(t + slice) });
      t += slice;
    });
  }
  return words;
}