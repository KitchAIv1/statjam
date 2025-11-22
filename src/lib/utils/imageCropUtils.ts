/**
 * Image Crop Utilities
 * 
 * Utility functions for converting cropped image areas to File objects.
 * Used by ImageCropModal component.
 */

import { Area } from 'react-easy-crop';

/**
 * Convert cropped area to File object
 * 
 * Optimized for large images with memory management.
 * 
 * @param imageSrc - Source image URL (blob URL or data URL)
 * @param pixelCrop - Cropped area in pixels
 * @param rotation - Image rotation in degrees (0-360)
 * @returns Promise<File> - Cropped image as File object
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<File> {
  // Validate inputs
  if (!imageSrc || !pixelCrop || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error('Invalid crop parameters');
  }

  const image = await createImage(imageSrc);
  
  // Validate image dimensions
  if (image.width === 0 || image.height === 0) {
    throw new Error('Invalid image dimensions');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', {
    willReadFrequently: false, // Optimize for write operations
    alpha: true
  });

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate rotated image dimensions
  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match rotated image
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate to center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(1, 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Get rotated image data
  const rotatedImageData = ctx.getImageData(
    bBoxWidth / 2 - image.width / 2,
    bBoxHeight / 2 - image.height / 2,
    image.width,
    image.height
  );

  // Create new canvas for cropped image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d', {
    willReadFrequently: false,
    alpha: true
  });

  if (!croppedCtx) {
    throw new Error('Could not get cropped canvas context');
  }

  // Set canvas size to crop area
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Calculate source position accounting for rotation
  const sourceX = bBoxWidth / 2 - image.width / 2 + pixelCrop.x;
  const sourceY = bBoxHeight / 2 - image.height / 2 + pixelCrop.y;

  // Draw cropped area
  croppedCtx.putImageData(
    rotatedImageData,
    -sourceX,
    -sourceY
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }

        // Create File object from blob
        const file = new File([blob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        resolve(file);
      },
      'image/jpeg',
      0.92 // Quality (92%)
    );
  });
}

/**
 * Create Image object from URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

/**
 * Calculate rotated image dimensions
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

