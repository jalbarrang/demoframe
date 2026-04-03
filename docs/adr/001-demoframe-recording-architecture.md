# ADR-001: DemoFrame Recording Architecture

**Status:** Accepted  
**Date:** 2026-03-31  
**Authors:** Juan Albarrán

## Context

We need DemoFrame: a personal desktop app for recording short product demos, tutorials, and walkthroughs that output MKV and MP4 files for sharing on Slack and Discord. Existing tools (Loom, ScreenStudio, macOS recorder) were rejected because they require online accounts or provide insufficient control over video output.

The app is built as an Electron 39 desktop application with a Svelte 5 frontend.

## Decisions

### Video Capture Pipeline

**Decision:** WebCodecs API (`VideoEncoder`) in a Web Worker, with FFmpeg for container muxing.

**Alternatives considered:**
- `MediaRecorder` → FFmpeg transcode (two-stage): simpler but has unbounded memory growth on long 4K recordings (~20 min OOM)
- Raw frame piping to FFmpeg in real-time: fragile backpressure, dropped frames
- Native capture via Swift/ScreenCaptureKit: macOS-only, massive complexity for a personal tool

**Rationale:** WebCodecs provides frame-level control with hardware-accelerated H.264 encoding, no memory accumulation (chunks flush to disk immediately), and crash-safe recordings. FFmpeg's role simplifies to muxing pre-encoded H.264 + Opus into containers — near-instant for MKV (remux) and fast for MP4 (audio transcode to AAC).

### Encoding Configuration

- **Video codec:** H.264 (AVC) — universal Slack/Discord inline playback
- **Audio codec:** Opus (transcoded to AAC for MP4 container)
- **Resolution:** Configurable, defaults to logical screen resolution at 30fps
- **Output formats:** MP4 (default) and MKV, user-selectable in settings

### Process Architecture

| Process | Responsibility |
|---------|---------------|
| Renderer | UI (Svelte), `desktopCapturer` MediaStream, thin `VideoEncoder` API calls |
| Web Worker | `VideoEncoder` + `AudioEncoder` (hardware-accelerated, off-thread) |
| Main | Chunk writing to disk, FFmpeg muxing, settings, tray, window management |

Encoded chunks flow: Worker → Renderer (Transferable ArrayBuffers) → Main process (IPC) → temp files on disk. If performance becomes an issue, Electron's `MessagePort` can replace the renderer relay as a drop-in optimization.

### FFmpeg Distribution

**Decision:** Bundle `ffmpeg-static` in the app's `resources/` directory via `asarUnpack`.

**Rationale:** This is a personal tool — guaranteed correct version, no path debugging. Adds ~70-100MB to app size which is acceptable.

### Audio Architecture

- Microphone: selectable input device, persisted as default in settings
- Desktop audio: settings toggle exists, implementation deferred to future milestone
- Disconnect handling: if the selected mic disconnects mid-recording, continue recording silently with a visual warning (losing video is worse than losing audio)

### Settings Persistence

**Decision:** `electron-store` with async initialization via dynamic `import()`.

**Rationale:** Handles app data paths automatically, atomic writes, used for all user preferences. Dynamic import avoids CJS/ESM interop issues since `electron-store` v11 is ESM-only and electron-vite outputs CJS for the main process.

### IPC Contract

All 23 IPC channels are typed in `src/shared/ipc-channels.ts` with a `IpcChannelMap` type that maps channel names to request/response payload types. The preload exposes a typed `window.api` with `invoke`, `send`, `on`, and `once` methods. This makes it impossible to send the wrong payload shape or call a non-existent channel.

Event channels (main → renderer push): `recording:status`, `recording:complete`, `devices:changed`  
Invoke channels (renderer → main request/response): everything else

### Window Architecture

Three window types, each a separate `BrowserWindow`:

| Window | Size | Behavior |
|--------|------|----------|
| Main window | 900×670, resizable | Library/Settings/Onboarding. Hides to tray on close (macOS). Hides during recording. |
| Recording bar | 320×56, frameless, always-on-top | Floating draggable mini-bar with timer, pause, stop, mic, cancel. Separate process. |
| Tray | System tray icon | Always present, shows recording state, right-click menu |

The recording bar loads the same renderer bundle with `#/recording-bar` hash, rendering only the `RecordingBar.svelte` view in a minimal layout. It never navigates to other routes — the main process orchestrates showing/hiding windows on state transitions.

**Window state machine:**
```
Recording starts:   main.hide() → recordingBar.show()
Recording stops:    recordingBar.hide() → main.show() → navigate to /post-recording
Recording cancels:  recordingBar.hide() → main.show()
Recording errors:   recordingBar.hide() → main.show()
```

### Recording State Machine

```
idle → countdown → recording ↔ paused → stopping → muxing → complete
                                                 ↘ cancelled
                                        error ← (any state)
```

- Countdown: configurable 0/3/5 seconds, default 3
- Post-recording: summary screen with thumbnail, file path, actions
- Mid-recording quit attempt: dialog asking Stop & Save / Discard / Cancel
- Crash recovery: on launch, detect orphaned temp chunk files and offer to mux them

### Renderer Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **bits-ui** for headless accessible UI primitives (Switch, DropdownMenu)
- **svelte-spa-router v5** for hash-based client-side routing
- Dark mode only

### TypeScript Configuration

TypeScript 6 with maximum strictness:
- `strict: true` (TS6 default)
- `noImplicitAny: true` (overrides `@electron-toolkit/tsconfig` base which weakened this)
- `noUncheckedIndexedAccess: true` — array indexing returns `T | undefined`
- `exactOptionalPropertyTypes: true` — distinguishes missing vs `undefined`
- `noPropertyAccessFromIndexSignature: true` — forces bracket notation for index signatures
- `verbatimModuleSyntax: true`

### macOS Permissions

- Screen recording: no programmatic API to request — onboarding opens System Settings via `exec('open "x-apple.systempreferences:..."')`, polls for permission changes every 2s
- Microphone: `systemPreferences.askForMediaAccess('microphone')` triggers system dialog
- First-run onboarding: 3-step wizard (screen recording → microphone → save location) with skip options

### App Lifecycle

- Close window → minimize to tray (macOS)
- Launch on login: optional, configurable, off by default
- Global shortcuts: configurable, defaults `Cmd+Shift+R` (record), `Cmd+Shift+P` (pause), `Cmd+Shift+Escape` (cancel)

### File Management

- Save location: configurable directory, default `~/Movies/DemoFrame/`
- File naming: timestamp-based `demoframe-YYYY-MM-DD_HH-mm-ss.{mp4|mkv}`
- Library: grid of thumbnail cards, newest first, with Open/Delete/Re-export actions

## Project Structure

```
src/
├── shared/
│   └── ipc-channels.ts            # Typed IPC contract (shared types only)
├── main/
│   ├── index.ts                    # App lifecycle, shortcuts, orchestration
│   ├── settings.ts                 # electron-store with async init
│   ├── tray.ts                     # System tray manager
│   ├── devices.ts                  # Device change forwarding
│   ├── ipc-handlers.ts             # All ipcMain.handle registrations
│   ├── windows/
│   │   ├── main-window.ts          # Main/library window
│   │   └── recording-bar.ts        # Floating mini-bar window
│   └── recording/
│       ├── chunk-writer.ts         # Temp file management for encoded chunks
│       └── muxer.ts                # FFmpeg spawn for H.264+Opus → MKV/MP4
├── preload/
│   ├── index.ts                    # Typed contextBridge API
│   └── index.d.ts                  # Window type augmentation
└── renderer/src/
    ├── App.svelte                  # Root layout + router + state listeners
    ├── lib/
    │   ├── ipc.ts                  # Typed IPC client wrapper
    │   ├── format-utils.ts         # Duration, file size, timestamp formatters
    │   ├── recorder/
    │   │   ├── capture.ts          # desktopCapturer MediaStream setup
    │   │   ├── encoder.worker.ts   # WebCodecs VideoEncoder + AudioEncoder
    │   │   └── audio.ts            # Mic stream management
    │   └── stores/
    │       ├── recording.svelte.ts # Recording state machine + timer
    │       ├── devices.svelte.ts   # Audio device enumeration + disconnect
    │       └── settings.svelte.ts  # Settings synced with electron-store
    ├── views/
    │   ├── Library.svelte          # Recording grid (home)
    │   ├── Settings.svelte         # All user preferences
    │   ├── SourcePicker.svelte     # Screen selection before recording
    │   ├── Onboarding.svelte       # First-run permission wizard
    │   ├── RecordingBar.svelte     # Floating bar controls (separate window)
    │   └── PostRecording.svelte    # Post-recording summary + actions
    └── components/
        ├── Sidebar.svelte          # Icon navigation
        ├── RecordingCard.svelte    # Library grid item
        ├── MicSelector.svelte      # Microphone dropdown
        ├── CountdownOverlay.svelte # 3-2-1 countdown
        └── PermissionStep.svelte   # Onboarding step card
```

## Consequences

- WebCodecs is only available in browser/worker contexts, not Node.js main process — encoding must happen renderer-side even though main does the heavy I/O
- `electron-store` v11 ESM-only requires async dynamic import in electron-vite's CJS main process output
- Screen recording permission on macOS cannot be requested programmatically — requires manual System Settings navigation
- In dev mode, the Electron binary registers as "Electron" in macOS privacy settings, not the app name — onboarding has a skip option for this
- The recording bar is a separate BrowserWindow loading the same renderer bundle — it must never call `push()` to navigate, as that would render full views in its tiny frame
