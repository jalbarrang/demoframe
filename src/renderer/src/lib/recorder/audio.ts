export async function getMicStream(deviceId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: deviceId },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    },
    video: false
  })
}

export function stopMicStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop()
  }
}
