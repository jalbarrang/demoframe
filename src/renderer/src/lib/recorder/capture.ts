interface CaptureOptions {
  sourceId: string
  resolution: { width: number; height: number }
  frameRate?: number
}

export async function startCapture(options: CaptureOptions): Promise<MediaStream> {
  const { sourceId, resolution, frameRate = 30 } = options

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
        maxWidth: resolution.width,
        maxHeight: resolution.height,
        maxFrameRate: frameRate
      }
    } as MediaTrackConstraints
  })

  return stream
}

export function stopCapture(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop()
  }
}
