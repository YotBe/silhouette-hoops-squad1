# Growth loop

The game was not short on features — daily challenge, endless tiers, duels,
party mode, achievements, quests, seasons, a global leaderboard. What it was
missing was a **loop**: a path where one player's session reliably produces
another player's session.

This document describes the loop as it now stands, the leaks that were closed,
and what to measure.

## The loop

```
play → share a challenge → link unfurls with the sender's score
     → friend lands on the stakes (one tap to play) → friend plays
     → friend sends it back → original player plays again
```

Step 5 is the important one. Before, answering a challenge was a dead end: the
only follow-up was replaying alone. A rally between two people generates far
more sessions than a broadcast to many, and it needs no audience to work.

## Leaks that were closed

**1. Shared links did not unfurl.** The app is client-rendered, so every share
resolved to the same generic social card no matter who sent it or what they
scored. A challenge posted in a group chat looked identical to a cold link.

`/s` (`api/s.ts`) now renders per-share Open Graph tags server-side —
"Yotam scored 2,450. Can you beat it?" — then bounces real visitors into the
game. Dependency-free, runs on Vercel's Node runtime, cannot affect the client
bundle.

**2. Challenge links were silently corrupting themselves.** Payloads were
encoded with plain `btoa` and dropped raw into a query string. Standard base64
emits `+` and `/`, and a query string reads `+` back as a space — so a share
whose payload happened to contain a `+` decoded to nothing, and the recipient
landed on the home screen with no idea a challenge existed. Separately, `btoa`
throws outright on any name with an accent or emoji, which silently produced an
empty link.

Encoding is now URL-safe base64 over UTF-8. The decoder still reads
already-shared legacy links, including ones whose `+` was eaten in transit.

**3. Arriving on a challenge meant arriving in a menu.** A challenge link
landed on the home screen — behind a first-run tutorial overlay and an open
name-entry form. The recipient had to work out what was being asked before
they could act on it.

`ChallengeIntroScreen` now shows the stakes and nothing else, with one tap to
play. The name is asked for later, when it is actually needed.

**4. Shares ended in unclickable text.** Share copy ended with the bare string
`whoisit.app`, which is not a link in most chat clients and carries no
attribution. Every share now ends in a real URL that also identifies the
sender.

**5. The loop was unmeasurable.** There was a single `share` event and nothing
downstream of it, so there was no way to tell a share that worked from one that
vanished.

## What to measure

Every visitor gets an anonymous, local-only id (`sg_visitor_id`) used purely to
attribute an invite. No personal data is involved and nothing is sent to a
third party.

| Event | Fires when |
|---|---|
| `invite_sent` | A share link is created (carries `kind`, running total) |
| `invite_opened` | A visitor arrives on someone's link |
| `invite_converted` | A referred visitor finishes their first game |
| `challenge_landed` / `challenge_accepted` | Challenge intro shown / accepted |
| `rematch_sent` | The return leg of a challenge is sent |
| `share` | Score copied or shared (carries `method`, `mode`) |

The number that matters:

```
k = invite_converted / active players
```

`k > 1` grows on its own. Realistically you are tuning two ratios beneath it:
**invites per player** (`invite_sent`) and **conversion per invite**
(`invite_converted / invite_opened`). The gap between `challenge_landed` and
`challenge_accepted` tells you whether the landing is doing its job.

None of this reports anywhere yet — `addAnalyticsProvider` in
`src/utils/analytics.ts` is the single hook to wire up a real provider.

## Not done — needs a product decision

- **Per-share generated images.** The unfurled card's *text* is now per-share;
  the image is still the one static asset. A generated image (sender's name,
  score, emoji grid) is a meaningful further lift but needs a raster renderer
  on the server — one new dependency, and a decision about the design.
- **Push re-engagement.** `src/utils/notifications.ts` exists but nothing
  schedules a "your streak is about to break" nudge, which is the standard
  retention counterpart to an invite loop.
- **A reason to share a loss.** Right now the copy assumes a good score. The
  most shared Wordle results are the near-misses.
- **`twitter:site` in `index.html`** is unset — it previously pointed at an
  unrelated account. Add your own handle to get credited on every unfurl.
