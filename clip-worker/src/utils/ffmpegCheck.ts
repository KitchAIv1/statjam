/**
 * FFmpeg Availability Check
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if FFmpeg is available in the system
 */
export async function checkFFmpeg(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    return stdout.includes('ffmpeg version');
  } catch {
    return false;
  }
}

/**
 * Get FFmpeg version string
 */
export async function getFFmpegVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const match = stdout.match(/ffmpeg version ([^\s]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

