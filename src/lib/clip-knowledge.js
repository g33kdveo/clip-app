// The clipping craft the AI reasons from.
//
// This is the general body of knowledge from people who clip for a living —
// editors, clippers and channel managers working in the same space. It is the
// baseline every job is judged against. Real performance from your own accounts
// is a later layer on top of this, never a replacement for it.

export const CLIP_DOCTRINE = `Judge every moment against how clipping actually works, not against the source creator's own taste.

THE FIRST SECOND
- A clip is won or lost before anyone hears a word. The frame it opens on has to already be the action: the reaction, the hit, the number, the face.
- The first spoken line must work as a cold open. A claim, a question, a number, a contradiction, a confession, a threat of a story. Never "so", "anyway", "as I was saying", or the tail end of a sentence.
- If the line before the good part is needed to understand it, start one line earlier, not two. Context is a cost, not a gift.

STRUCTURE
- One clip, one turn. Setup, turn, payoff, in that order, compressed. If the subject changes, that is the next clip.
- Cut on the punch. The beat after the laugh is dead weight; end while it still lands.
- Cold open on the payoff, then rewind into how it happened. This works when the payoff is visual and the setup is a single line.
- Silence is not suspense in short form. Trim pauses to a beat, keep breaths short, cut stutters and filler.

WHAT ACTUALLY TRAVELS
- Emotional spikes: disbelief, anger, joy, embarrassment, sudden competence. Flat explanation rarely travels, however true it is.
- Stakes a viewer can feel in one line: money, rank, a bet, a record, a promise.
- Conflict between two people, or between a person and their own earlier claim.
- Reveals and reversals, where the thing you assumed was true is not.
- Impressive execution, but only when the difficulty is visible without context.
- Direct address: the speaker talks to the viewer, not to a chat the viewer cannot see.
- Nothing that needs the stream's inside knowledge. An unfamiliar name or running joke is a reason to skip, not a reason to explain.

THE LOOP
- A clip that ends where it began gets watched twice. Prefer moments whose last line can lead straight back into their first.

CAPTIONS AND ON-SCREEN TEXT
- Most of the feed meets a clip with the sound off. Captions are the default, not a decoration.
- Two to four words per beat, one idea per line, high contrast, no more than about six words wide.
- The hook headline adds tension the audio does not already say. Repeating the spoken line spends the only free attention you get.
- Vertical safe zones: keep text out of the bottom fifth and the top tenth, where the apps put their own chrome.

WHAT TO REJECT
- Intros, sponsor reads, countdowns, sub and follow thank-yous, housekeeping, "let me explain", and any moment whose best part is a single word or a sound effect.
- Anything that only lands because of something said twenty minutes earlier.
- Anything that is mostly the creator reacting to their own chat.

SCORING
- Rate hook, standalone, payoff and energy separately and honestly. A five means "fine, not posting it". Most of a stream is a five.`;

// What each feed rewards. Used for the note under each account section.
export const PLATFORM_CRAFT = {
  youtube: "Long-form lives or dies on the thumbnail and the first line of the title.",
  instagram: "A square crop of the best frame beats a busy composition. Saves travel further than likes.",
  tiktok: "The hook lands in the first second, and the loop is what carries it to the next feed.",
  x: "The first line is the whole post. Everything after it is for the people already interested.",
};