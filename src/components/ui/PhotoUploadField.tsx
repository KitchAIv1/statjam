/**
 * Photo Upload Field Component
 * 
 * Reusable photo upload component with drag-and-drop support.
 * Single responsibility: Render photo upload UI with preview and validation.
 */

import { useRef, DragEvent } from 'react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface PhotoUploadFieldProps {
  label: string;
  value: string | null;
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  disabled?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PhotoUploadField({
  label,
  value,
  previewUrl,
  uploading,
  error,
  disabled = false,
  aspectRatio = 'square',
  onFileSelect,
  onRemove,
  className
}: PhotoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[16/9]'
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop
   * ✅ HARDENED: Prevents concurrent uploads
   */
  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    // ✅ FIX: Block drops while uploading to prevent race conditions
    if (disabled || uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = (): void => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Handle remove button
   */
  const handleRemove = (event: React.MouseEvent): void => {
    event.stopPropagation();
    onRemove();
  };

  // Show preview or upload prompt
  const hasPhoto = previewUrl || value;

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-semibold">{label}</Label>
      
      {/* Upload Area */}
      <div
        className={cn(
          'relative w-full max-w-[200px] mx-auto rounded-lg overflow-hidden',
          'bg-muted border-2 border-dashed transition-colors',
          aspectRatioClasses[aspectRatio],
          !hasPhoto && !uploading && 'hover:border-primary/50 cursor-pointer',
          uploading && 'opacity-50 cursor-wait',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive'
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={hasPhoto ? undefined : handleClick}
      >
        {/* Preview Image */}
        {hasPhoto && !uploading && (
          <div className="relative w-full h-full">
            <ImageWithFallback
              src={previewUrl || value || ''}
              alt={label}
              className="w-full h-full object-cover"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Upload Prompt */}
        {!hasPhoto && !uploading && (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground text-center px-2">
              Click or drag to upload
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Max 5MB
            </span>
          </label>
        )}

        {/* Loading State */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-muted-foreground text-center">
          Supported: JPEG, PNG, WebP, GIF
        </p>
      )}
    </div>
  );
}

