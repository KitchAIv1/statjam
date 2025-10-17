'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, RotateCcw, ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PhotoUploadCropperProps {
  onPhotoSelected: (photoBase64: string, cropData: CropData) => void;
  templatePhotoZone?: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: number;
  };
  currentPhotoUrl?: string;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export function PhotoUploadCropper({ 
  onPhotoSelected, 
  templatePhotoZone = { x: 0, y: 0, width: 300, height: 400, aspectRatio: 0.75 },
  currentPhotoUrl 
}: PhotoUploadCropperProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentPhotoUrl || null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: templatePhotoZone.width,
    height: templatePhotoZone.height,
    scale: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  // Helper function to compress and convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal size (max 1024px on longest side)
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (0.8 quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        console.log(`📸 Image compressed: ${file.size} bytes → ${compressedDataUrl.length * 0.75} bytes`);
        // Return the FULL data URL with prefix (data:image/jpeg;base64,...)
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB');
      return;
    }

    setUploading(true);
    
    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(previewUrl);

      // Convert to base64 for direct processing
      const base64String = await convertFileToBase64(file);
      setPhotoBase64(base64String);
      console.log('✅ Photo converted to base64, length:', base64String.length);
      
      // Reset crop data for new image
      setCropData({
        x: 0,
        y: 0,
        width: templatePhotoZone.width,
        height: templatePhotoZone.height,
        scale: 1,
        rotation: 0
      });

    } catch (error) {
      console.error('Photo processing error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to process image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('FileReader')) {
          errorMessage = 'Unable to read the image file. Please try a different image.';
        } else if (error.message.includes('base64')) {
          errorMessage = 'Failed to process image. Please try a different format.';
        }
      }
      
      alert(errorMessage);
      setSelectedImage(null);
      setPhotoBase64(null);
    } finally {
      setUploading(false);
    }
  }, [templatePhotoZone]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleCropStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleCropMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const container = e.currentTarget.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = ((e.clientX - containerRect.left - dragStart.x) / containerRect.width) * templatePhotoZone.width;
    const newY = ((e.clientY - containerRect.top - dragStart.y) / containerRect.height) * templatePhotoZone.height;
    
    setCropData(prev => ({
      ...prev,
      x: Math.max(0, Math.min(newX, templatePhotoZone.width - prev.width)),
      y: Math.max(0, Math.min(newY, templatePhotoZone.height - prev.height))
    }));
  }, [isDragging, dragStart, templatePhotoZone]);

  const handleCropEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse move and up handlers for better drag experience
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('[data-crop-container]') as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = ((e.clientX - containerRect.left - dragStart.x) / containerRect.width) * templatePhotoZone.width;
    const newY = ((e.clientY - containerRect.top - dragStart.y) / containerRect.height) * templatePhotoZone.height;
    
    setCropData(prev => ({
      ...prev,
      x: Math.max(0, Math.min(newX, templatePhotoZone.width - prev.width)),
      y: Math.max(0, Math.min(newY, templatePhotoZone.height - prev.height))
    }));
  }, [isDragging, dragStart, templatePhotoZone]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  const adjustScale = useCallback((delta: number) => {
    setCropData(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta))
    }));
  }, []);

  const adjustRotation = useCallback((delta: number) => {
    setCropData(prev => ({
      ...prev,
      rotation: (prev.rotation + delta) % 360
    }));
  }, []);

  const resetCrop = useCallback(() => {
    setCropData({
      x: 0,
      y: 0,
      width: templatePhotoZone.width,
      height: templatePhotoZone.height,
      scale: 1,
      rotation: 0
    });
  }, [templatePhotoZone]);

  const handleConfirmCrop = useCallback(() => {
    if (photoBase64) {
      onPhotoSelected(photoBase64, cropData);
    }
  }, [photoBase64, cropData, onPhotoSelected]);

  const handleRemovePhoto = useCallback(() => {
    setSelectedImage(null);
    setPhotoBase64(null);
    setCropData({
      x: 0,
      y: 0,
      width: templatePhotoZone.width,
      height: templatePhotoZone.height,
      scale: 1,
      rotation: 0
    });
  }, [templatePhotoZone]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Basketball Pose Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedImage ? (
          // Upload Area - Simple and Clear
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Basketball Photo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your photo here, or click to browse
              </p>
              
              {uploading ? (
                <div className="mt-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Uploading photo...</p>
                </div>
              ) : (
                <Button className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• Supports JPG, PNG • Max 10MB</p>
              <p>• Action shots with good lighting work best</p>
            </div>
          </div>
        ) : (
          // Photo Editing Interface - Simplified
          <div className="space-y-6">
            {/* Photo Preview */}
            <div className="relative">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Your basketball photo"
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                style={{
                  transform: `scale(${cropData.scale}) rotate(${cropData.rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Preview
              </div>
            </div>

            {/* Simple Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Size ({Math.round(cropData.scale * 100)}%)</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={cropData.scale}
                  onChange={(e) => setCropData(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Rotation ({cropData.rotation}°)</Label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="5"
                  value={cropData.rotation}
                  onChange={(e) => setCropData(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
              >
                <X className="w-4 h-4 mr-2" />
                Remove Photo
              </Button>
              
              <Button
                variant="outline"
                onClick={resetCrop}
              >
                <Move className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button
                onClick={handleConfirmCrop}
                className="bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Photo
              </Button>
            </div>

            {/* Simple Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-700 text-center space-y-1">
                <p>💡 <strong>Adjust size and rotation</strong> to get the perfect look</p>
                <p>🏀 <strong>Action shots</strong> with good lighting work best for NBA cards</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
