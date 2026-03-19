# Project: Silhouette Hoops Squad

## Project Context
Silhouette Hoops Squad is a web-based NBA player guessing game where users identify players from silhouettes across different eras. The experience is optimized for quick, addictive rounds on mobile, with support for solo play and real-time multiplayer party modes.

Primary goals:
- Deliver fast, low-friction rounds (ideal for 30–120 second sessions).
- Support multiple modes (daily challenge, endless mode, party lobbies).
- Encourage replayability via era variety, streaks, and stats tracking.

## Tech Stack
- Frontend: React (hooks-based, SPA or Next.js app router if applicable).
- Backend/Database: Supabase (Postgres, Auth, Realtime, Storage).
- Deployment/Hosting: Vercel (preview environments for branches, edge functions if used).

If the actual stack differs in this repo, update this section first.

## AI Assistant Role
- Act as a senior React/front-end engineer and game logic designer.
- Prioritize clear separation of concerns between UI, game state, and data access.
- When implementation details are missing or ambiguous (e.g., scoring rules, difficulty curves), propose 1–2 reasonable options and ask the user to choose before making deep changes.

## Codebase & Architecture Guidelines

### Components and Structure
- Use function components with hooks; avoid class components.
- Group by feature/domain where possible, for example:
  - `features/game/` (core game loop, state machine, scoring)
  - `features/multiplayer/` (party lobbies, real-time sync)
  - `features/ui/` (buttons, layout, responsive containers)
  - `lib/` (utility functions, Supabase client, shared config)
- Keep components small and focused. If a component exceeds ~200 lines or handles multiple responsibilities (rendering, game logic, networking), extract subcomponents or hooks.

### State Management
- Prefer local `useState` / `useReducer` for UI-specific state.
- Use React Context or a small state library (if present) only for:
  - Authenticated user state.
  - Global game session metadata (current mode, era filters).
  - Multiplayer/party session state that must be shared across screens.
- Represent the game as a simple finite-state machine (e.g., `idle → loading → showingQuestion → evaluatingGuess → showingResult → finished`) to avoid tangled boolean flags.

### Game Loop & Mechanics
When modifying or adding game mechanics:

- Isolate game logic in pure functions or custom hooks under `features/game/`, for example:
  - `generateChoicesForPlayer(player, eraFilter)`
  - `calculateScore(previousScore, wasCorrect, streak, difficulty)`
  - `getNextQuestion(state, config)`
- Keep timing logic (heat-check timers, countdowns) in a dedicated hook like `useCountdownTimer`, not inside UI components.
- For new mechanics (e.g., streak multipliers, hint penalties), add tests for:
  - Scoring over multiple rounds.
  - Edge cases (timer expiry, no more questions, user leaving mid-round).
- Era-weighted distribution:
  - Centralize logic that decides which eras appear and how often (e.g., config object like `{ "80s": 0.2, "90s": 0.3, "2000s": 0.3, "2010s": 0.2 }`).
  - Avoid hardcoding era weights in multiple places; reference a single config file.

### Multiplayer & Realtime
- Use Supabase Realtime channels (or existing abstraction) for party lobbies and synchronized rounds.
- Treat the server (or host) as the source of truth for:
  - Round start and end times.
  - Correct answers and scoring confirmation.
- Ensure idempotency for events (e.g., avoid double-scoring on duplicate messages).
- Handle disconnects gracefully:
  - Rejoin logic based on `partyId` + `userId`.
  - Fallback paths if the host leaves (e.g., promote another player or end session).

## UI/UX and Responsiveness
- Mobile-first layout; design assuming portrait phone screens.
- Ensure answer buttons and primary CTAs remain visible without vertical scrolling during a round:
  - Use sticky bottom bars or constrained layout containers.
  - Test on common viewport sizes (e.g., 360×640, 390×844).
- Maintain silhouette visibility:
  - Keep a fixed aspect ratio container for silhouette images.
  - Avoid layout shifts when timers or hints appear/disappear.
- Prefer subtle animations (e.g., CSS transitions) over heavy JS animations to keep performance smooth on low-end devices.

Accessibility:
- Ensure sufficient color contrast for timers and feedback (correct/incorrect).
- Use ARIA attributes and keyboard navigation where feasible, especially for desktop users.

## Supabase Integration
- Use a single configured Supabase client with typed helpers in `lib/supabaseClient`.
- For game data:
  - Separate “static” data (players, eras) from “dynamic” data (scores, user stats).
  - Cache static data where appropriate to reduce round-trip latency.
- For multiplayer:
  - Use a stable channel naming convention (e.g., `party:{partyId}`).
  - Clean up subscriptions on unmount to prevent memory leaks.

## Testing & Quality
- For new core game logic, always add tests (unit or integration) around:
  - Scoring rules.
  - Era distribution functions.
  - Timer/timeout edge cases.
- Prefer pure, deterministic functions that can be tested without DOM or network.

## AI Coding Style & Process
- Code Style:
  - Follow existing linting and formatting (ESLint, Prettier) if present.
  - Use descriptive names for components and hooks (e.g., `SilhouetteRound`, `useGameEngine`).
- When editing:
  - Prefer incremental, well-scoped changes.
  - Describe the impact of your changes (what behavior is added/modified).
- When uncertain:
  - Ask for clarification on UX flows, scoring rules, or era distribution before implementing major changes.
- Avoid introducing new libraries unless they significantly simplify the codebase; if needed, explain trade-offs and propose alternatives.
