# Video content pipeline

The disguise clip is the game. A round that falls back to a still silhouette
is a weaker, different game, so the app is configured **video-only**: it only
asks about players it can actually show a clip for.

That makes content the whole ballgame. Today 6 of 117 players have a clip that
plays everywhere, so a session revisits the same players quickly. Every clip
added widens the pool automatically.

## Adding a clip

Clips resolve **by player id**, not by the path written in `players.ts`:

1. Save the file as `public/videos/<playerId>.mp4`
2. Run `npm run videos:manifest`

That's it. No data edit — the player is live in the next build. The id is the
`id` field in `src/data/players.ts` (`jokic`, `wemby`, `sga`, …), and
`npm run videos:report --json` prints the exact `saveAs` filename for every
clip still needed.

## Format requirements

| | |
|---|---|
| Container | `.mp4` |
| Video codec | **H.264** (`avc1`) |
| Audio | none needed — clips play muted |
| Aspect | 4:3 area, `object-fit: cover`; keep the subject centred |
| Size | aim under ~4 MB; the current clips average 3.5 MB |

**H.264 is not optional.** Four clips in the repo are H.265/HEVC, which is
blank in Firefox and unreliable in Chrome. `npm run videos:report` fails the
build on an unplayable codec. To normalise anything:

```
ffmpeg -i input.mov -c:v libx264 -crf 23 -preset slow -an output.mp4
```

`durant` and `lebron` are HEVC-only and still need this treatment.

## Hosting

Ten clips already take 62 MB. A full 117-player roster at that average is
roughly **700 MB**, which cannot be committed to git or deployed to Vercel.

Before the library grows much past its current size, move clips to a CDN and
set `VITE_VIDEO_CDN_BASE`:

```
VITE_VIDEO_CDN_BASE=https://your-cdn.example.com/videos
```

`resolveVideoUrl` then serves every clip from there, keyed by the same
`<playerId>.mp4` filename, and `public/videos` can be emptied. Supabase
Storage is already a dependency and would work; so would Cloudinary or Mux.

## Policy override

`VITE_VIDEO_POLICY` overrides the default per deployment:

- `video-only` *(default)* — only players with a playable clip
- `video-first` — prefer clips, fall back to silhouettes when the pool runs dry
- `any` — ignore video availability

Useful for preview builds while the library is small.

## A note on generated clips

If clips are produced with AI or heavy editing, the subjects are real,
identifiable athletes. Name, image and likeness rights for NBA players are
actively licensed and enforced, and a game distributed publicly — especially
one designed to spread — is a commercial use. Worth getting a clear answer on
rights before the library scales, since the cost of finding out late grows
with every clip produced. That is a business question rather than a technical
one, and it does not affect anything in this pipeline.

## Commands

| | |
|---|---|
| `npm run videos:manifest` | Regenerate the manifest from `public/videos` |
| `npm run videos:report` | Coverage summary + every clip still needed |
| `npm run videos:report -- --json` | Same, machine-readable worklist |
