import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Upload, X } from 'lucide-react';

interface PlayerProfile {
  name: string;
  jerseyNumber: string;
  position: string;
  height: string;
  weight: string;
  age: number;
  team: string;
  profilePhoto: string;
  posePhoto: string;
  seasonAverages: {
    rebounds: number;
    assists: number;
    fieldGoalPercent: number;
  };
  careerHigh: {
    points: number;
    rebounds: number;
    assists: number;
  };
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerProfile;
  onSave: (data: PlayerProfile) => void;
}

const positions = [
  'Point Guard',
  'Shooting Guard', 
  'Small Forward',
  'Power Forward',
  'Center'
];

export function EditProfileModal({ isOpen, onClose, playerData, onSave }: EditProfileModalProps) {
  // Ensure all form fields have valid string values (never null/undefined)
  const sanitizePlayerData = (data: PlayerProfile): PlayerProfile => ({
    name: data.name || '',
    jerseyNumber: data.jerseyNumber || '',
    position: data.position || '',
    height: data.height || '',
    weight: data.weight || '',
    age: data.age || 0,
    team: data.team || '',
    profilePhoto: data.profilePhoto || '',
    posePhoto: data.posePhoto || '',
    seasonAverages: data.seasonAverages,
    careerHigh: data.careerHigh,
  });

  const [formData, setFormData] = useState<PlayerProfile>(sanitizePlayerData(playerData));
  const [previewProfilePhoto, setPreviewProfilePhoto] = useState<string | null>(null);
  const [previewPosePhoto, setPreviewPosePhoto] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PlayerProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = async (field: keyof PlayerProfile) => {
    // Validate field on blur
    const { validatePlayerProfile } = await import('@/lib/validation/profileValidation');
    const errors = validatePlayerProfile({ [field]: formData[field] });
    
    if (errors[field as keyof typeof errors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: errors[field as keyof typeof errors]!
      }));
    }
  };

  const handlePhotoUpload = (type: 'profile' | 'pose', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'profile') {
          setPreviewProfilePhoto(result);
          handleInputChange('profilePhoto', result);
        } else {
          setPreviewPosePhoto(result);
          handleInputChange('posePhoto', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validate all fields before saving
    const { validatePlayerProfile } = await import('@/lib/validation/profileValidation');
    const { notify } = await import('@/lib/services/notificationService');
    
    const errors = validatePlayerProfile(formData);
    
    if (Object.keys(errors).length > 0) {
      // Convert ProfileValidationErrors to Record<string, string>
      const errorRecord: Record<string, string> = {};
      (Object.keys(errors) as Array<keyof typeof errors>).forEach(key => {
        if (errors[key]) {
          errorRecord[key] = errors[key]!;
        }
      });
      setValidationErrors(errorRecord);
      notify.error('Validation error', 'Please fix the errors before saving');
      return;
    }

    try {
      onSave(formData);
      notify.success('Profile updated successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      notify.error('Failed to save profile', errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData(sanitizePlayerData(playerData));
    setPreviewProfilePhoto(null);
    setPreviewPosePhoto(null);
    setValidationErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="glass-modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="glass-modal-header p-6 -m-6 mb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Make changes to your profile information and save them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 px-2">
          {/* Photo Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Photo */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Profile Photo</Label>
              <div className="relative">
                <div className="w-full aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                  {previewProfilePhoto || formData.profilePhoto ? (
                    <div className="relative w-full h-full">
                      <ImageWithFallback
                        src={previewProfilePhoto || formData.profilePhoto}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewProfilePhoto(null);
                          handleInputChange('profilePhoto', '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground text-center px-2">
                        Click to upload profile photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload('profile', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Pose Photo */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Action/Pose Photo</Label>
              <div className="relative">
                <div className="w-full aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                  {previewPosePhoto || formData.posePhoto ? (
                    <div className="relative w-full h-full">
                      <ImageWithFallback
                        src={previewPosePhoto || formData.posePhoto}
                        alt="Pose preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewPosePhoto(null);
                          handleInputChange('posePhoto', '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground text-center px-2">
                        Click to upload action photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload('pose', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Enter your full name"
                className="bg-input-background"
                aria-invalid={!!validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleInputChange('position', value)}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('age')}
                placeholder="Enter your age"
                min="10"
                max="99"
                className="bg-input-background"
                aria-invalid={!!validationErrors.age}
              />
              {validationErrors.age && (
                <p className="text-sm text-destructive">{validationErrors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jersey">Jersey Number</Label>
              <Input
                id="jersey"
                value={formData.jerseyNumber}
                onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                onBlur={() => handleBlur('jerseyNumber')}
                placeholder="Enter jersey number"
                maxLength={2}
                className="bg-input-background"
                aria-invalid={!!validationErrors.jerseyNumber}
              />
              {validationErrors.jerseyNumber && (
                <p className="text-sm text-destructive">{validationErrors.jerseyNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                onBlur={() => handleBlur('height')}
                placeholder="e.g., 6'8&quot;"
                className="bg-input-background"
                aria-invalid={!!validationErrors.height}
              />
              {validationErrors.height && (
                <p className="text-sm text-destructive">{validationErrors.height}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                onBlur={() => handleBlur('weight')}
                placeholder="e.g., 235 lbs"
                className="bg-input-background"
                aria-invalid={!!validationErrors.weight}
              />
              {validationErrors.weight && (
                <p className="text-sm text-destructive">{validationErrors.weight}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                placeholder="Enter your team name"
                className="bg-input-background"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 glass-card hover:glass-card-light border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(validationErrors).length > 0}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}