import { spawn } from 'child_process'
import { existsSync, mkdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import ffmpegPath from 'ffmpeg-static'
import type { OutputFormat, RecordingMeta } from '../../shared/ipc-channels'
import { randomUUID } from 'crypto'

interface MuxOptions {
  videoPath: string | null
  audioPath: string | null
  outputDir: string
  format: OutputFormat
  resolution: { width: number; height: number }
}

function formatTimestamp(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

export class Muxer {
  async mux(opts: MuxOptions): Promise<RecordingMeta> {
    const { videoPath, audioPath, outputDir, format, resolution } = opts

    if (!videoPath && !audioPath) {
      throw new Error('No media files to mux')
    }

    mkdirSync(outputDir, { recursive: true })

    const filename = `demoframe-${formatTimestamp()}.${format}`
    const outputPath = join(outputDir, filename)

    const args = this.buildArgs({ videoPath, audioPath, outputPath, format })

    const ffmpeg = ffmpegPath as unknown as string
    if (!ffmpeg || !existsSync(ffmpeg)) {
      throw new Error(`ffmpeg binary not found at: ${ffmpeg}`)
    }

    await this.runFfmpeg(ffmpeg, args)

    const stat = statSync(outputPath)
    const durationMs = await this.probeDuration(ffmpeg, outputPath)

    return {
      id: randomUUID(),
      filename: basename(outputPath),
      path: outputPath,
      format,
      createdAt: new Date().toISOString(),
      durationMs,
      fileSize: stat.size,
      resolution
    }
  }

  private buildArgs(opts: {
    videoPath: string | null
    audioPath: string | null
    outputPath: string
    format: OutputFormat
  }): string[] {
    const { videoPath, audioPath, outputPath, format } = opts
    const args: string[] = ['-y']

    if (videoPath) args.push('-i', videoPath)
    if (audioPath) args.push('-i', audioPath)

    if (format === 'mp4') {
      if (videoPath) args.push('-c:v', 'copy')
      if (audioPath) args.push('-c:a', 'aac')
    } else {
      args.push('-c', 'copy')
    }

    args.push(outputPath)
    return args
  }

  private runFfmpeg(binary: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })

      let stderr = ''
      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`ffmpeg exited with code ${code}:\n${stderr}`))
      })

      proc.on('error', reject)
    })
  }

  private async probeDuration(binary: string, filePath: string): Promise<number> {
    return new Promise((resolve) => {
      const proc = spawn(binary, [
        '-i', filePath,
        '-show_entries', 'format=duration',
        '-v', 'quiet',
        '-of', 'csv=p=0'
      ], { stdio: ['ignore', 'pipe', 'pipe'] })

      let output = ''
      proc.stdout.on('data', (chunk) => {
        output += chunk.toString()
      })

      proc.on('close', () => {
        const seconds = parseFloat(output.trim())
        resolve(isNaN(seconds) ? 0 : Math.round(seconds * 1000))
      })

      proc.on('error', () => resolve(0))
    })
  }
}
