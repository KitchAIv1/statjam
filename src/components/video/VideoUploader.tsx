'use client';

/**
 * VideoUploader - Video upload component with progress tracking
 * 
 * Handles file selection, validation, and upload to Bunny.net.
 * Shows progress and status during upload.
 * 
 * @module VideoUploader
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Film, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { BunnyUploadService, validateVideoFile, getUploadErrorMessage } from '@/lib/services/bunnyUploadService';
import { errorLoggingService } from '@/lib/services/errorLoggingService';
import { UPLOAD_CONFIG } from '@/lib/config/videoConfig';
import type { VideoUploadProgress } from '@/lib/types/video';
import { useVideoUpload } from '@/contexts/VideoUploadContext';
import { Analytics } from '@/lib/analytics';

interface VideoUploaderProps {
  gameId: string;
  userId?: string; // For ownership verification
  onUploadComplete: (videoId: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function VideoUploader({
  gameId,
  userId,
  onUploadComplete,
  onUploadError,
  className = '',
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<VideoUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Global upload context for cross-page status
  const uploadContext = useVideoUpload();
  
  // Warn user before leaving page during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (progress && progress.status === 'uploading') {
        e.preventDefault();
        e.returnValue = 'Upload in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [progress]);
  
  // Large file threshold (1GB)
  const LARGE_FILE_THRESHOLD = 1 * 1024 * 1024 * 1024;
  const isLargeFile = file && file.size > LARGE_FILE_THRESHOLD;
  
  // Estimate upload time (rough: assumes 10 Mbps average)
  const estimateUploadMinutes = (bytes: number): number => {
    const mbps = 10; // Conservative estimate
    const seconds = (bytes * 8) / (mbps * 1000000);
    return Math.ceil(seconds / 60);
  };
  
  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    
    // Validate file
    const validation = validateVideoFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setFile(selectedFile);
  }, []);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };
  
  // Handle progress updates - sync with local and global state
  const handleProgress = useCallback((newProgress: VideoUploadProgress) => {
    setProgress(newProgress);
    uploadContext.updateProgress(newProgress);
  }, [uploadContext]);

  // Start upload
  const startUpload = async () => {
    if (!file) return;
    
    setError(null);
    setCanRetry(false);
    abortControllerRef.current = new AbortController();
    
    // Update global context
    uploadContext.startUpload(gameId, file.name, file.size);
    Analytics.videoUploadStarted(gameId, Math.round(file.size / 1024 / 1024));

    const result = await BunnyUploadService.uploadVideo({
      file,
      gameId,
      userId, // Pass userId for ownership verification
      onProgress: handleProgress,
      abortSignal: abortControllerRef.current.signal,
    });
    
    if (result.success && result.videoId) {
      setCanRetry(false);
      uploadContext.completeUpload();
      Analytics.videoUploadCompleted(gameId);
      onUploadComplete(result.videoId);
    } else {
      const rawError = result.error || 'Upload failed';
      const friendlyError = getUploadErrorMessage(rawError);
      errorLoggingService.logError(new Error(rawError), { gameId, action: 'video_upload_failed', userId });
      setError(friendlyError);
      setCanRetry(true); // Enable retry button
      uploadContext.cancelUpload();
      onUploadError?.(friendlyError);
    }
  };
  
  // Retry upload
  const retryUpload = () => {
    setProgress(null);
    setError(null);
    setCanRetry(false);
    startUpload();
  };
  
  // Cancel upload
  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setProgress(null);
    setFile(null);
    uploadContext.cancelUpload();
  };
  
  // Clear selection
  const clearSelection = () => {
    setFile(null);
    setError(null);
    setProgress(null);
    setCanRetry(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  // Render upload status
  const renderStatus = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'uploading':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-900 font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatSize(progress.bytesUploaded)} / {formatSize(progress.totalBytes)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelUpload}
                className="text-red-500 hover:text-red-600 h-6 px-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex items-center gap-3 text-orange-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing video...</span>
          </div>
        );
        
      case 'complete':
        return (
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Upload complete!</span>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{progress.errorMessage || 'Upload failed'}</span>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_CONFIG.allowedExtensions.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {/* Drop zone */}
      {!file && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
              }
            `}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              Drop video file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports MP4, MOV, WebM, AVI, MKV (max {UPLOAD_CONFIG.maxFileSizeGB}GB)
            </p>
          </div>
          
          {/* Explicit browse button as fallback */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </div>
      )}
      
      {/* Selected file */}
      {file && !progress && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 rounded-lg p-3">
              <Film className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Large file warning */}
          {isLargeFile && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">
                    Large file (~{estimateUploadMinutes(file.size)} min upload)
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    Do not close this page during upload. You can switch tabs.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-3">
            <Button
              onClick={startUpload}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Upload
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Upload progress */}
      {progress && (
        <div className="space-y-3">
          {/* Persistent warning during upload */}
          {progress.status === 'uploading' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Do not close this page — upload in progress
                </span>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Film className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file?.name}</p>
              </div>
            </div>
            {renderStatus()}
          </div>
        </div>
      )}
      
      {/* Error message with retry */}
      {error && !progress && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
              {canRetry && file && (
                <Button
                  onClick={retryUpload}
                  variant="outline"
                  size="sm"
                  className="mt-3 text-red-600 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Upload
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Full-screen upload overlay - blocks navigation during upload */}
      {progress && progress.status === 'uploading' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Upload className="w-6 h-6 text-orange-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Uploading Video</h3>
                <p className="text-sm text-gray-500 truncate max-w-[250px]">{file?.name}</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {formatSize(progress.bytesUploaded)} / {formatSize(progress.totalBytes)}
                </span>
                <span className="font-bold text-orange-600">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-3" />
            </div>
            
            {/* Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Do not navigate away</p>
                  <p className="text-amber-700 mt-0.5">
                    Closing this page or navigating will cancel the upload.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cancel button */}
            <Button
              variant="outline"
              onClick={cancelUpload}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Upload
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

