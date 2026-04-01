interface EncoderConfig {
  video: {
    width: number
    height: number
    frameRate: number
    bitrate: number
  }
  audio?: {
    sampleRate: number
    channels: number
    bitrate: number
  }
}

let videoEncoder: VideoEncoder | null = null
let audioEncoder: AudioEncoder | null = null

function computeVideoBitrate(width: number, height: number, frameRate: number): number {
  const pixels = width * height
  const bitsPerPixel = 0.1
  return Math.round(pixels * bitsPerPixel * frameRate)
}

function handleEncodedVideo(chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata): void {
  const buffer = new ArrayBuffer(chunk.byteLength)
  chunk.copyTo(buffer)

  const msg: WorkerOutMessage = {
    type: 'encoded-video',
    data: buffer,
    timestamp: chunk.timestamp,
    duration: chunk.duration ?? 0,
    keyFrame: chunk.type === 'key',
    ...(metadata?.decoderConfig ? { decoderConfig: metadata.decoderConfig } : {})
  }
  postMessage(msg, { transfer: [buffer] })
}

function handleEncodedAudio(chunk: EncodedAudioChunk, metadata?: EncodedAudioChunkMetadata): void {
  const buffer = new ArrayBuffer(chunk.byteLength)
  chunk.copyTo(buffer)

  const msg: WorkerOutMessage = {
    type: 'encoded-audio',
    data: buffer,
    timestamp: chunk.timestamp,
    duration: chunk.duration ?? 0,
    ...(metadata?.decoderConfig ? { decoderConfig: metadata.decoderConfig } : {})
  }
  postMessage(msg, { transfer: [buffer] })
}

function init(config: EncoderConfig): void {
  const videoBitrate = config.video.bitrate || computeVideoBitrate(
    config.video.width,
    config.video.height,
    config.video.frameRate
  )

  videoEncoder = new VideoEncoder({
    output: handleEncodedVideo,
    error: (e) => postMessage({ type: 'error', error: e.message })
  })

  videoEncoder.configure({
    codec: 'avc1.42001f',
    width: config.video.width,
    height: config.video.height,
    bitrate: videoBitrate,
    framerate: config.video.frameRate,
    latencyMode: 'realtime',
    avc: { format: 'annexb' }
  })

  if (config.audio) {
    audioEncoder = new AudioEncoder({
      output: handleEncodedAudio,
      error: (e) => postMessage({ type: 'error', error: e.message })
    })

    audioEncoder.configure({
      codec: 'opus',
      sampleRate: config.audio.sampleRate,
      numberOfChannels: config.audio.channels,
      bitrate: config.audio.bitrate
    })
  }

  postMessage({ type: 'ready' })
}

async function stop(): Promise<void> {
  if (videoEncoder && videoEncoder.state !== 'closed') {
    await videoEncoder.flush()
    videoEncoder.close()
  }
  if (audioEncoder && audioEncoder.state !== 'closed') {
    await audioEncoder.flush()
    audioEncoder.close()
  }
  postMessage({ type: 'done' })
}

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data

  switch (msg.type) {
    case 'init':
      init(msg.config)
      break

    case 'video-frame': {
      if (!videoEncoder || videoEncoder.state !== 'configured') break
      const frame = msg.frame as VideoFrame
      const keyFrame = videoEncoder.encodeQueueSize === 0
      videoEncoder.encode(frame, { keyFrame })
      frame.close()
      break
    }

    case 'audio-data': {
      if (!audioEncoder || audioEncoder.state !== 'configured') break
      const audioData = msg.data as AudioData
      audioEncoder.encode(audioData)
      audioData.close()
      break
    }

    case 'stop':
      stop()
      break
  }
}

type WorkerInMessage =
  | { type: 'init'; config: EncoderConfig }
  | { type: 'video-frame'; frame: VideoFrame }
  | { type: 'audio-data'; data: AudioData }
  | { type: 'stop' }

type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'done' }
  | { type: 'error'; error: string }
  | {
      type: 'encoded-video'
      data: ArrayBuffer
      timestamp: number
      duration: number
      keyFrame: boolean
      decoderConfig?: VideoDecoderConfig
    }
  | {
      type: 'encoded-audio'
      data: ArrayBuffer
      timestamp: number
      duration: number
      decoderConfig?: AudioDecoderConfig
    }

export type { WorkerInMessage, WorkerOutMessage, EncoderConfig }
