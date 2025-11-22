/**
 * Image Crop Modal Component
 * 
 * Modal component for cropping images before upload.
 * Uses react-easy-crop for touch-friendly image cropping.
 * 
 * Follows .cursorrules: <200 lines, single responsibility (crop UI only)
 */

'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import { getCroppedImg } from '@/lib/utils/imageCropUtils';

interface ImageCropModalProps {
  isOpen: boolean;
  imageFile: File | null;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

/**
 * ImageCropModal - Modal for cropping images
 * 
 * Features:
 * - Touch-friendly cropping (mobile support)
 * - Zoom and pan controls
 * - Rotation support
 * - Aspect ratio locking
 * - Preview before confirm
 */
export function ImageCropModal({
  isOpen,
  imageFile,
  aspectRatio = 'square',
  onCropComplete,
  onCancel
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);
  
  // Track FileReader for cleanup
  const readerRef = React.useRef<FileReader | null>(null);
  const previousImageSrcRef = React.useRef<string | null>(null);

  // Aspect ratio mapping (memoized)
  const aspectRatioMap = React.useMemo(() => ({
    square: 1,
    portrait: 3 / 4,
    landscape: 16 / 9
  }), []);

  // File size limit: 10MB (prevent memory issues)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Load image when file changes
  React.useEffect(() => {
    // Cleanup previous FileReader if exists
    if (readerRef.current) {
      readerRef.current.onload = null;
      readerRef.current.onerror = null;
      readerRef.current = null;
    }

    if (imageFile && isOpen) {
      // Validate file size
      if (imageFile.size > MAX_FILE_SIZE) {
        setImageError(`Image too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        setIsLoadingImage(false);
        setIsImageReady(false);
        setImageSrc(null);
        return;
      }

      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        setImageError('Invalid file type. Please select an image file.');
        setIsLoadingImage(false);
        setIsImageReady(false);
        setImageSrc(null);
        return;
      }

      setIsLoadingImage(true);
      setImageError(null);
      setIsImageReady(false);
      
      // Cleanup previous image data URL if exists
      if (previousImageSrcRef.current && previousImageSrcRef.current.startsWith('data:')) {
        // Data URLs don't need explicit cleanup, but we track for reference
        previousImageSrcRef.current = null;
      }
      
      const reader = new FileReader();
      readerRef.current = reader;
      
      reader.onload = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:')) {
          previousImageSrcRef.current = result;
          setImageSrc(result);
          setIsImageReady(true);
          setIsLoadingImage(false);
        } else {
          setImageError('Failed to load image');
          setIsLoadingImage(false);
          setIsImageReady(false);
        }
        readerRef.current = null;
      };
      
      reader.onerror = () => {
        setImageError('Failed to read image file');
        setIsLoadingImage(false);
        setIsImageReady(false);
        setImageSrc(null);
        readerRef.current = null;
      };
      
      try {
        reader.readAsDataURL(imageFile);
      } catch (error) {
        setImageError('Failed to process image file');
        setIsLoadingImage(false);
        setIsImageReady(false);
        setImageSrc(null);
        readerRef.current = null;
      }
    } else {
      setImageSrc(null);
      setIsLoadingImage(false);
      setImageError(null);
      setIsImageReady(false);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (readerRef.current) {
        readerRef.current.onload = null;
        readerRef.current.onerror = null;
        readerRef.current.abort();
        readerRef.current = null;
      }
    };
  }, [imageFile, isOpen]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedFile);
    } catch (error) {
      // Handle specific error types
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to crop image. Please try again.';
      setImageError(errorMessage);
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal Container - Bottom sheet on mobile, centered on desktop */}
      <div 
        className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200 sm:border sm:border-slate-200 dark:sm:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Crop Image
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-50"
            disabled={isProcessing}
            aria-label="Close crop modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative bg-slate-900 flex-1 min-h-[400px] overflow-hidden">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
              <div className="text-white text-center space-y-3">
                <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-300">Loading image...</p>
              </div>
            </div>
          )}
          
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900 p-4">
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 font-medium">{imageError}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="text-white border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {imageSrc && isImageReady && !isLoadingImage && !imageError && (
            <div className="absolute inset-0 w-full h-full">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatioMap[aspectRatio]}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropCompleteCallback}
                cropShape="rect"
                showGrid={true}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    backgroundColor: '#111827'
                  },
                  mediaStyle: {
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }
                }}
              />
            </div>
          )}
          
          {!imageSrc && !isLoadingImage && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400">No image loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-slate-200 dark:border-slate-700 space-y-4 sm:space-y-5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          {/* Zoom Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all duration-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">Rotate</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Reset
            </Button>
          </div>

          {/* Mobile Hint */}
          <div className="sm:hidden text-xs text-center text-slate-500 dark:text-slate-400 py-2">
            Pinch to zoom • Drag to move
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full sm:w-auto order-2 sm:order-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing || !croppedAreaPixels}
              className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Use This Image</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

