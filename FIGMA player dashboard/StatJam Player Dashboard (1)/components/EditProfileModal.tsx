import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  const [formData, setFormData] = useState<PlayerProfile>(playerData);
  const [previewProfilePhoto, setPreviewProfilePhoto] = useState<string | null>(null);
  const [previewPosePhoto, setPreviewPosePhoto] = useState<string | null>(null);

  const handleInputChange = (field: keyof PlayerProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData(playerData);
    setPreviewProfilePhoto(null);
    setPreviewPosePhoto(null);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Photo */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Profile Photo</Label>
              <div className="relative">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors">
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
            <div className="space-y-3">
              <Label className="text-base font-semibold">Action/Pose Photo</Label>
              <div className="relative">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors">
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
                placeholder="Enter your full name"
                className="bg-input-background"
              />
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
                value={formData.age}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                placeholder="Enter your age"
                min="15"
                max="50"
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jersey">Jersey Number</Label>
              <Input
                id="jersey"
                value={formData.jerseyNumber}
                onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                placeholder="Enter jersey number"
                maxLength={2}
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                placeholder="e.g., 6'8&quot;"
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="e.g., 235 lbs"
                className="bg-input-background"
              />
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
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}