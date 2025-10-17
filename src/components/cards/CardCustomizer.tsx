'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerCardService, TemplateVariant, CardGenerationRequest } from '@/lib/services/playerCardService';
import { PhotoUploadCropper } from './PhotoUploadCropper';
import { ArrowLeft, Palette, User, BarChart3, Loader2, Download, Sparkles, Camera } from 'lucide-react';

interface CardCustomizerProps {
  templateId: string;
  variantId: string;
  playerData: {
    name: string;
    jerseyNumber: string;
    position: string;
    team: string;
    profilePhotoUrl?: string;
    posePhotoUrl?: string;
    stats: {
      points: number;
      rebounds: number;
      assists: number;
      fieldGoalPct: number;
      threePointPct: number;
      freeThrowPct: number;
    };
  };
  onBack: () => void;
  onCardGenerated?: (cardUrl: string) => void;
}

export function CardCustomizer({ 
  templateId, 
  variantId, 
  playerData: initialPlayerData, 
  onBack, 
  onCardGenerated 
}: CardCustomizerProps) {
  const [variant, setVariant] = useState<TemplateVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editable player data
  const [playerData, setPlayerData] = useState(initialPlayerData);
  
  // Customization options
  const [customizations, setCustomizations] = useState({
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#f97316'
  });

  // Photo state
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    cropData: any;
  } | null>(
    initialPlayerData.profilePhotoUrl ? {
      url: initialPlayerData.profilePhotoUrl,
      cropData: { x: 0, y: 0, width: 300, height: 400, scale: 1, rotation: 0 }
    } : null
  );

  useEffect(() => {
    loadVariant();
  }, [variantId]);

  const loadVariant = async () => {
    try {
      setLoading(true);
      const variants = await PlayerCardService.getTemplateVariants(templateId);
      const selectedVariant = variants.find(v => v.id === variantId);
      
      if (!selectedVariant) {
        throw new Error('Template variant not found');
      }
      
      setVariant(selectedVariant);
    } catch (err) {
      console.error('Error loading variant:', err);
      setError('Failed to load template variant');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerDataChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPlayerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setPlayerData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCustomizationChange = (field: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoSelected = (photoUrl: string, cropData: any) => {
    setSelectedPhoto({ url: photoUrl, cropData });
  };

  const handleGenerateCard = async () => {
    try {
      setGenerating(true);
      setError(null);

      const request: CardGenerationRequest = {
        templateVariantId: variantId,
        playerData: {
          ...playerData,
          profilePhotoUrl: selectedPhoto?.url,
          cropData: selectedPhoto?.cropData
        },
        customizations
      };

      console.log('🚀 Sending card generation request...');
      const generatedCard = await PlayerCardService.generatePlayerCard(request);
      
      console.log('✅ Card generation response:', generatedCard);
      
      if (generatedCard.generated_image_url) {
        onCardGenerated?.(generatedCard.generated_image_url);
      } else {
        console.warn('⚠️ No generated image URL in response');
      }
      
    } catch (err) {
      console.error('❌ Card generation failed:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to generate card. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Card generation timed out. Please try again.';
        } else if (err.message.includes('photo')) {
          errorMessage = 'There was an issue with your photo. Please try uploading a different image.';
        } else if (err.message.includes('template')) {
          errorMessage = 'Template not found. Please select a different template.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error && !variant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Unable to Load Template</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Customize Your NBA Card</h2>
            <p className="text-sm text-muted-foreground">
              {variant?.display_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Customization Options */}
        <div className="space-y-6">
          <Tabs defaultValue="photo" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="photo">
                <Camera className="w-4 h-4 mr-2" />
                Photo
              </TabsTrigger>
              <TabsTrigger value="player">
                <User className="w-4 h-4 mr-2" />
                Player
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="w-4 h-4 mr-2" />
                Design
              </TabsTrigger>
            </TabsList>

            {/* Photo Upload Tab */}
            <TabsContent value="photo" className="space-y-4">
              <PhotoUploadCropper
                onPhotoSelected={handlePhotoSelected}
                currentPhotoUrl={selectedPhoto?.url}
                templatePhotoZone={{
                  x: 0,
                  y: 0,
                  width: 400,
                  height: 600,
                  aspectRatio: 2/3 // Standard trading card ratio
                }}
              />
            </TabsContent>

            {/* Player Info Tab */}
            <TabsContent value="player" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Player Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Player Name</Label>
                      <Input
                        id="name"
                        value={playerData.name}
                        onChange={(e) => handlePlayerDataChange('name', e.target.value)}
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jersey">Jersey Number</Label>
                      <Input
                        id="jersey"
                        value={playerData.jerseyNumber}
                        onChange={(e) => handlePlayerDataChange('jerseyNumber', e.target.value)}
                        placeholder="23"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={playerData.position}
                        onChange={(e) => handlePlayerDataChange('position', e.target.value)}
                        placeholder="Point Guard"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team">Team</Label>
                      <Input
                        id="team"
                        value={playerData.team}
                        onChange={(e) => handlePlayerDataChange('team', e.target.value)}
                        placeholder="Lakers"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Season Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        value={playerData.stats.points}
                        onChange={(e) => handlePlayerDataChange('stats.points', parseFloat(e.target.value) || 0)}
                        placeholder="25.0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rebounds">Rebounds</Label>
                      <Input
                        id="rebounds"
                        type="number"
                        value={playerData.stats.rebounds}
                        onChange={(e) => handlePlayerDataChange('stats.rebounds', parseFloat(e.target.value) || 0)}
                        placeholder="8.0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="assists">Assists</Label>
                      <Input
                        id="assists"
                        type="number"
                        value={playerData.stats.assists}
                        onChange={(e) => handlePlayerDataChange('stats.assists', parseFloat(e.target.value) || 0)}
                        placeholder="6.0"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fg">Field Goal %</Label>
                      <Input
                        id="fg"
                        type="number"
                        value={playerData.stats.fieldGoalPct}
                        onChange={(e) => handlePlayerDataChange('stats.fieldGoalPct', parseFloat(e.target.value) || 0)}
                        placeholder="45.5"
                        step="0.1"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="three">3-Point %</Label>
                      <Input
                        id="three"
                        type="number"
                        value={playerData.stats.threePointPct}
                        onChange={(e) => handlePlayerDataChange('stats.threePointPct', parseFloat(e.target.value) || 0)}
                        placeholder="38.2"
                        step="0.1"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ft">Free Throw %</Label>
                      <Input
                        id="ft"
                        type="number"
                        value={playerData.stats.freeThrowPct}
                        onChange={(e) => handlePlayerDataChange('stats.freeThrowPct', parseFloat(e.target.value) || 0)}
                        placeholder="85.0"
                        step="0.1"
                        max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Design Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bg-color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bg-color"
                          type="color"
                          value={customizations.backgroundColor}
                          onChange={(e) => handleCustomizationChange('backgroundColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customizations.backgroundColor}
                          onChange={(e) => handleCustomizationChange('backgroundColor', e.target.value)}
                          placeholder="#1a1a1a"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="text-color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={customizations.textColor}
                          onChange={(e) => handleCustomizationChange('textColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customizations.textColor}
                          onChange={(e) => handleCustomizationChange('textColor', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent-color"
                          type="color"
                          value={customizations.accentColor}
                          onChange={(e) => handleCustomizationChange('accentColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customizations.accentColor}
                          onChange={(e) => handleCustomizationChange('accentColor', e.target.value)}
                          placeholder="#f97316"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                {variant?.preview_url ? (
                  <img
                    src={variant.preview_url}
                    alt="Template Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Template Preview</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Your customized card will be generated with your player data and design choices
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateCard} 
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Card...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate My NBA Card
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
