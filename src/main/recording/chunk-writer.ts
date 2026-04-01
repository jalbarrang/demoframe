import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, appendFileSync, rmSync, existsSync, readdirSync, statSync } from 'fs'

const TEMP_ROOT = join(app.getPath('temp'), 'dreki-eye')

export class ChunkWriter {
  private sessionDir: string | null = null
  private videoPath: string | null = null
  private audioPath: string | null = null

  startSession(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.sessionDir = join(TEMP_ROOT, `session-${timestamp}`)
    mkdirSync(this.sessionDir, { recursive: true })

    this.videoPath = join(this.sessionDir, 'video.h264')
    this.audioPath = join(this.sessionDir, 'audio.opus')

    return this.sessionDir
  }

  writeChunk(data: { video?: ArrayBuffer; audio?: ArrayBuffer }): void {
    if (!this.sessionDir) throw new Error('No active recording session')

    if (data.video && this.videoPath) {
      appendFileSync(this.videoPath, Buffer.from(data.video))
    }
    if (data.audio && this.audioPath) {
      appendFileSync(this.audioPath, Buffer.from(data.audio))
    }
  }

  finalize(): { videoPath: string | null; audioPath: string | null; sessionDir: string } {
    if (!this.sessionDir) throw new Error('No active recording session')

    const result = {
      videoPath: this.videoPath && existsSync(this.videoPath) ? this.videoPath : null,
      audioPath: this.audioPath && existsSync(this.audioPath) ? this.audioPath : null,
      sessionDir: this.sessionDir
    }

    this.sessionDir = null
    this.videoPath = null
    this.audioPath = null

    return result
  }

  cancel(): void {
    if (this.sessionDir && existsSync(this.sessionDir)) {
      rmSync(this.sessionDir, { recursive: true, force: true })
    }
    this.sessionDir = null
    this.videoPath = null
    this.audioPath = null
  }

  static getRecoveryFiles(): { count: number; totalSize: number; sessionDir: string } | null {
    if (!existsSync(TEMP_ROOT)) return null

    const sessions = readdirSync(TEMP_ROOT).filter((d) =>
      d.startsWith('session-')
    )

    if (sessions.length === 0) return null

    let totalSize = 0
    let count = 0
    let latestSession = ''
    let latestTime = 0

    for (const session of sessions) {
      const dir = join(TEMP_ROOT, session)
      const stat = statSync(dir)
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs
        latestSession = dir
      }

      const files = readdirSync(dir)
      for (const file of files) {
        const fileStat = statSync(join(dir, file))
        totalSize += fileStat.size
        count++
      }
    }

    return count > 0 ? { count, totalSize, sessionDir: latestSession } : null
  }

  static discardRecoveryFiles(): void {
    if (existsSync(TEMP_ROOT)) {
      const sessions = readdirSync(TEMP_ROOT).filter((d) =>
        d.startsWith('session-')
      )
      for (const session of sessions) {
        rmSync(join(TEMP_ROOT, session), { recursive: true, force: true })
      }
    }
  }
}
