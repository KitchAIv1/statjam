/**
 * Video Rotation Utilities
 * 
 * Detects and handles video stream orientation issues,
 * particularly for iPhone cameras where rotation metadata
 * may be lost during WebRTC transmission.
 */

export interface VideoOrientation {
  isPortrait: boolean;
  needsRotation: boolean;
  rotationAngle: number; // 0, 90, 180, 270
  originalWidth: number;
  originalHeight: number;
}

/**
 * Detect if a video stream needs rotation based on dimensions.
 * iPhone cameras in landscape mode may still output portrait streams
 * with rotation metadata that gets stripped during WebRTC.
 */
export function detectVideoOrientation(video: HTMLVideoElement): VideoOrientation {
  const { videoWidth, videoHeight } = video;
  const isPortrait = videoHeight > videoWidth;
  
  // If height > width, the stream is portrait but likely should be landscape
  // This is common with iPhone cameras where rotation metadata is lost
  const needsRotation = isPortrait;
  const rotationAngle = needsRotation ? 90 : 0;
  
  console.log(`📐 [Rotation] Video: ${videoWidth}x${videoHeight}, portrait: ${isPortrait}, rotate: ${rotationAngle}°`);
  
  return {
    isPortrait,
    needsRotation,
    rotationAngle,
    originalWidth: videoWidth,
    originalHeight: videoHeight,
  };
}

/**
 * Get the effective dimensions after rotation correction.
 * If rotation is needed, width and height are swapped.
 */
export function getEffectiveDimensions(orientation: VideoOrientation): { width: number; height: number } {
  if (orientation.needsRotation) {
    return {
      width: orientation.originalHeight,
      height: orientation.originalWidth,
    };
  }
  return {
    width: orientation.originalWidth,
    height: orientation.originalHeight,
  };
}
