import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useAuthContext } from '@/contexts/AuthContext';

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
  { value: 'PG', label: 'Point Guard' },
  { value: 'SG', label: 'Shooting Guard' },
  { value: 'SF', label: 'Small Forward' },
  { value: 'PF', label: 'Power Forward' },
  { value: 'C', label: 'Center' },
  { value: 'G', label: 'Guard' },
  { value: 'F', label: 'Forward' },
];

export function EditProfileModal({ isOpen, onClose, playerData, onSave }: EditProfileModalProps) {
  const { user } = useAuthContext();
  
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Photo upload hooks (with cleanup of old photos)
  const profilePhotoUpload = usePhotoUpload({
    userId: user?.id || '',
    photoType: 'profile',
    currentPhotoUrl: playerData.profilePhoto, // For cleanup
    onSuccess: (url) => handleInputChange('profilePhoto', url),
    onError: (error) => console.error('Profile photo upload error:', error)
  });
  
  const posePhotoUpload = usePhotoUpload({
    userId: user?.id || '',
    photoType: 'pose',
    currentPhotoUrl: playerData.posePhoto, // For cleanup
    onSuccess: (url) => handleInputChange('posePhoto', url),
    onError: (error) => console.error('Pose photo upload error:', error)
  });
  
  // Separate state for height (feet and inches)
  const [heightFeet, setHeightFeet] = useState<string>('');
  const [heightInches, setHeightInches] = useState<string>('');
  
  // Update formData when playerData prop changes
  useEffect(() => {
    setFormData(sanitizePlayerData(playerData));
  }, [playerData]);
  
  // Initialize height from formData on mount or when formData.height changes
  useEffect(() => {
    const parseHeight = (heightStr: string): { feet: string; inches: string } => {
      if (!heightStr || heightStr === 'N/A') return { feet: '', inches: '' };
      
      // Try feet'inches" format
      const feetInchesMatch = heightStr.match(/(\d+)'(\d+)/);
      if (feetInchesMatch) {
        return {
          feet: feetInchesMatch[1],
          inches: feetInchesMatch[2]
        };
      }
      
      // Try plain number (assumed inches) - convert to feet/inches
      const totalInches = parseInt(heightStr);
      if (!isNaN(totalInches)) {
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        return {
          feet: feet.toString(),
          inches: inches.toString()
        };
      }
      
      return { feet: '', inches: '' };
    };
    
    const { feet, inches } = parseHeight(formData.height);
    setHeightFeet(feet);
    setHeightInches(inches);
  }, [formData.height]);

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

  // Handle height feet/inches changes
  const handleHeightChange = (type: 'feet' | 'inches', value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    if (type === 'feet') {
      setHeightFeet(value);
    } else {
      setHeightInches(value);
    }
    
    // Calculate total inches and update formData
    const feet = type === 'feet' ? parseInt(value) || 0 : parseInt(heightFeet) || 0;
    const inches = type === 'inches' ? parseInt(value) || 0 : parseInt(heightInches) || 0;
    
    // Construct height string in feet'inches" format
    const heightString = feet > 0 || inches > 0 ? `${feet}'${inches}"` : '';
    handleInputChange('height', heightString);
    
    // Clear validation error when user types
    if (validationErrors.height) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.height;
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
      // ✅ FIX: Await save completion before closing modal (ensures photos update)
      await onSave(formData);
      notify.success('Profile updated successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      notify.error('Failed to save profile', errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData(sanitizePlayerData(playerData));
    setValidationErrors({});
    
    // Reset height inputs
    const parseHeight = (heightStr: string): { feet: string; inches: string } => {
      if (!heightStr || heightStr === 'N/A') return { feet: '', inches: '' };
      const feetInchesMatch = heightStr.match(/(\d+)'(\d+)/);
      if (feetInchesMatch) {
        return { feet: feetInchesMatch[1], inches: feetInchesMatch[2] };
      }
      const totalInches = parseInt(heightStr);
      if (!isNaN(totalInches)) {
        return { feet: Math.floor(totalInches / 12).toString(), inches: (totalInches % 12).toString() };
      }
      return { feet: '', inches: '' };
    };
    const { feet, inches } = parseHeight(playerData.height);
    setHeightFeet(feet);
    setHeightInches(inches);
    
    // Reset photo upload states
    profilePhotoUpload.clearPreview();
    profilePhotoUpload.clearError();
    posePhotoUpload.clearPreview();
    posePhotoUpload.clearError();
    
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
            <PhotoUploadField
              label="Profile Photo"
              value={formData.profilePhoto}
              previewUrl={profilePhotoUpload.previewUrl}
              uploading={profilePhotoUpload.uploading}
              error={profilePhotoUpload.error}
              aspectRatio="square"
              onFileSelect={profilePhotoUpload.handleFileSelect}
              onRemove={() => {
                profilePhotoUpload.clearPreview();
                handleInputChange('profilePhoto', '');
              }}
            />
            
            <PhotoUploadField
              label="Action/Pose Photo"
              value={formData.posePhoto}
              previewUrl={posePhotoUpload.previewUrl}
              uploading={posePhotoUpload.uploading}
              error={posePhotoUpload.error}
              aspectRatio="portrait"
              onFileSelect={posePhotoUpload.handleFileSelect}
              onRemove={() => {
                posePhotoUpload.clearPreview();
                handleInputChange('posePhoto', '');
              }}
            />
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
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
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
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                onBlur={() => handleBlur('jerseyNumber')}
                placeholder="0-999"
                min="0"
                max="999"
                className="bg-input-background"
                aria-invalid={!!validationErrors.jerseyNumber}
              />
              {validationErrors.jerseyNumber && (
                <p className="text-sm text-destructive">{validationErrors.jerseyNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height-feet">Height</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    id="height-feet"
                    type="number"
                    value={heightFeet}
                    onChange={(e) => handleHeightChange('feet', e.target.value)}
                    onBlur={() => handleBlur('height')}
                    placeholder="Feet"
                    min="4"
                    max="7"
                    className="bg-input-background text-center"
                    aria-invalid={!!validationErrors.height}
                    aria-label="Height in feet"
                  />
                </div>
                <span className="text-2xl font-light text-muted-foreground">′</span>
                <div className="flex-1">
                  <Input
                    id="height-inches"
                    type="number"
                    value={heightInches}
                    onChange={(e) => handleHeightChange('inches', e.target.value)}
                    onBlur={() => handleBlur('height')}
                    placeholder="Inches"
                    min="0"
                    max="11"
                    className="bg-input-background text-center"
                    aria-invalid={!!validationErrors.height}
                    aria-label="Height in inches"
                  />
                </div>
                <span className="text-2xl font-light text-muted-foreground">″</span>
              </div>
              <p className="text-xs text-muted-foreground">Example: 6 feet 8 inches</p>
              {validationErrors.height && (
                <p className="text-sm text-destructive">{validationErrors.height}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight.replace(/[^\d]/g, '')}
                onChange={(e) => handleInputChange('weight', e.target.value ? `${e.target.value} lbs` : '')}
                onBlur={() => handleBlur('weight')}
                placeholder="180"
                min="50"
                max="400"
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