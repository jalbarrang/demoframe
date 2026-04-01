import type {
  RecordingConfig,
  RecordingState,
  RecordingMeta
} from '../../../../shared/ipc-channels'
import { ipc } from '../ipc'

let state = $state<RecordingState>('idle')
let elapsedMs = $state(0)
let error = $state<string | null>(null)
let outputPath = $state<string | null>(null)
let lastMeta = $state<RecordingMeta | null>(null)

let timerHandle: ReturnType<typeof setInterval> | null = null
let timerStart = 0
let timerAccumulated = 0

function startTimer(): void {
  timerStart = performance.now()
  timerHandle = setInterval(() => {
    elapsedMs = timerAccumulated + (performance.now() - timerStart)
  }, 50)
}

function pauseTimer(): void {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
    timerAccumulated += performance.now() - timerStart
  }
}

function resetTimer(): void {
  if (timerHandle) clearInterval(timerHandle)
  timerHandle = null
  timerStart = 0
  timerAccumulated = 0
  elapsedMs = 0
}

async function startRecording(config: RecordingConfig): Promise<void> {
  state = 'countdown'
  error = null
  outputPath = null
  lastMeta = null
  resetTimer()

  try {
    await ipc.invoke('recording:start', config)
  } catch (e) {
    state = 'error'
    error = e instanceof Error ? e.message : String(e)
  }
}

async function stopRecording(): Promise<void> {
  state = 'stopping'
  pauseTimer()
  try {
    await ipc.invoke('recording:stop')
  } catch (e) {
    state = 'error'
    error = e instanceof Error ? e.message : String(e)
  }
}

async function pauseRecording(): Promise<void> {
  pauseTimer()
  try {
    await ipc.invoke('recording:pause')
    state = 'paused'
  } catch (e) {
    state = 'error'
    error = e instanceof Error ? e.message : String(e)
  }
}

async function resumeRecording(): Promise<void> {
  try {
    await ipc.invoke('recording:resume')
    state = 'recording'
    startTimer()
  } catch (e) {
    state = 'error'
    error = e instanceof Error ? e.message : String(e)
  }
}

async function cancelRecording(): Promise<void> {
  resetTimer()
  try {
    await ipc.invoke('recording:cancel')
    state = 'cancelled'
  } catch (e) {
    state = 'error'
    error = e instanceof Error ? e.message : String(e)
  }
}

function setupListeners(): () => void {
  const unsubStatus = ipc.on('recording:status', (status) => {
    const prev = state
    state = status.state
    if (status.error) error = status.error
    if (status.outputPath) outputPath = status.outputPath

    if (status.state === 'recording' && prev !== 'recording') {
      startTimer()
    } else if (status.state === 'paused') {
      pauseTimer()
    } else if (
      status.state === 'stopping' ||
      status.state === 'muxing' ||
      status.state === 'complete' ||
      status.state === 'cancelled' ||
      status.state === 'error'
    ) {
      pauseTimer()
    }
  })

  const unsubComplete = ipc.on('recording:complete', (result) => {
    state = 'complete'
    outputPath = result.path
    lastMeta = result.meta
    pauseTimer()
  })

  return () => {
    unsubStatus()
    unsubComplete()
  }
}

function reset(): void {
  state = 'idle'
  error = null
  outputPath = null
  lastMeta = null
  resetTimer()
}

export function getRecording() {
  return {
    get state() { return state },
    get elapsedMs() { return elapsedMs },
    get error() { return error },
    get outputPath() { return outputPath },
    get lastMeta() { return lastMeta },
    get isPaused() { return state === 'paused' },
    get isRecording() { return state === 'recording' || state === 'paused' },
    get isActive() {
      return state !== 'idle' && state !== 'complete' && state !== 'cancelled' && state !== 'error'
    },
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    setupListeners,
    reset
  }
}
