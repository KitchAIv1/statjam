'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Zap, Clock, DollarSign } from 'lucide-react';
import { PlayerCardService, QuickCardGenerationRequest, QuickCardResult } from '@/lib/services/playerCardService';
import { PhotoUploadCropper } from './PhotoUploadCropper';

interface QuickCardGeneratorProps {
  playerData?: {
    name: string;
    jerseyNumber: string;
    position: string;
    team: string;
    stats: {
      ppg: number;
      rpg: number;
      apg: number;
    };
  };
  onCardGenerated?: (result: QuickCardResult) => void;
}

export function QuickCardGenerator({ playerData, onCardGenerated }: QuickCardGeneratorProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ base64: string; cropData?: any } | null>(null);
  const [templatePreference, setTemplatePreference] = useState<'holographic' | 'vintage' | 'modern' | 'random'>('random');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QuickCardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default player data if not provided
  const defaultPlayerData = {
    name: 'Player Name',
    jerseyNumber: '23',
    position: 'Guard',
    team: 'Team Name',
    stats: {
      ppg: 25.0,
      rpg: 8.0,
      apg: 6.0
    }
  };

  const currentPlayerData = playerData || defaultPlayerData;

  const templateOptions = [
    {
      id: 'random' as const,
      name: 'Surprise Me!',
      description: 'Random template for maximum surprise',
      icon: <Sparkles className="w-5 h-5" />,
      cost: '$0.06',
      badge: 'Popular'
    },
    {
      id: 'holographic' as const,
      name: 'Holographic Foil',
      description: 'Premium rainbow foil effects',
      icon: <Zap className="w-5 h-5" />,
      cost: '$0.08',
      badge: 'Premium'
    },
    {
      id: 'vintage' as const,
      name: 'Vintage Classic',
      description: 'Retro 80s-90s basketball card style',
      icon: <Clock className="w-5 h-5" />,
      cost: '$0.05',
      badge: 'Classic'
    },
    {
      id: 'modern' as const,
      name: 'Modern Minimalist',
      description: 'Clean contemporary design',
      icon: <DollarSign className="w-5 h-5" />,
      cost: '$0.04',
      badge: 'Sleek'
    }
  ];

  const handlePhotoSelected = (photoBase64: string, cropData?: any) => {
    console.log('📸 Photo selected (base64 length):', photoBase64.length, { cropData });
    setSelectedPhoto({ base64: photoBase64, cropData });
    setError(null);
  };

  const handleGenerateCard = async () => {
    // Photo is optional for now since we're using AI-generated player figures
    console.log('🖼️ Selected photo for generation:', selectedPhoto || 'Using AI-generated player');

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const request: QuickCardGenerationRequest = {
        photoBase64: selectedPhoto?.base64 || null, // Pass base64 directly or null for AI-generated player
        playerData: currentPlayerData,
        templatePreference: templatePreference,
        tier: 'freemium'
      };

      console.log('📋 Card generation request:', request);

      const cardResult = await PlayerCardService.generateQuickCard(request);
      
      setResult(cardResult);
      if (onCardGenerated) {
        onCardGenerated(cardResult);
      }
    } catch (err) {
      console.error('❌ Quick card generation failed:', err);
      let errorMessage = 'Failed to generate card. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Card generation timed out. Please try again.';
        } else if (err.message.includes('photo')) {
          errorMessage = 'There was an issue with your photo. Please try uploading a different image.';
        } else if (err.message.includes('renders remaining')) {
          errorMessage = 'You have no renders remaining. Please upgrade to continue.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ⚡ Quick NBA Card Generator
        </h2>
        <p className="text-gray-600">
          Upload your photo and get a stunning NBA card in seconds!
        </p>
      </div>

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📸 Upload Your Basketball Photo (Optional)
          </CardTitle>
          <CardDescription>
            Upload a photo for a personalized card, or skip to generate with an AI-created player figure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUploadCropper
            onPhotoSelected={handlePhotoSelected}
            templatePhotoZone={{ width: 400, height: 600, aspectRatio: 2/3 }}
          />
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Choose Your Style</CardTitle>
          <CardDescription>
            Select a template style or let us surprise you with a random design!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateOptions.map((template) => (
              <div
                key={template.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  templatePreference === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setTemplatePreference(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {template.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Est. cost: {template.cost}</p>
                    </div>
                  </div>
                  <Badge variant={template.id === 'holographic' ? 'default' : 'secondary'}>
                    {template.badge}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Info Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🏀 Player Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>
              <p className="font-semibold">{currentPlayerData.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Number:</span>
              <p className="font-semibold">#{currentPlayerData.jerseyNumber}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Position:</span>
              <p className="font-semibold">{currentPlayerData.position}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Team:</span>
              <p className="font-semibold">{currentPlayerData.team}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-600">Season Stats:</span>
            <div className="flex gap-6 mt-2">
              <span className="text-sm">
                <strong>{currentPlayerData.stats.ppg}</strong> PPG
              </span>
              <span className="text-sm">
                <strong>{currentPlayerData.stats.rpg}</strong> RPG
              </span>
              <span className="text-sm">
                <strong>{currentPlayerData.stats.apg}</strong> APG
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-4">
        {selectedPhoto && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-sm text-green-700">
              ✅ <strong>Photo uploaded!</strong> Your card will feature your photo with AI background removal.
            </p>
          </div>
        )}
        
        {!selectedPhoto && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-700">
              🤖 <strong>AI-Generated Player:</strong> Your card will feature an AI-created basketball player figure.
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerateCard}
          disabled={generating}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {selectedPhoto ? 'Removing Background & Creating Your Card...' : 'Generating Your NBA Card...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {selectedPhoto ? 'Generate Card with My Photo' : 'Generate Card with AI Player'}
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {result && result.status === 'success' && result.outputs && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              ✅ Your NBA Card is Ready!
            </CardTitle>
            <CardDescription className="text-green-700">
              Generated using {result.template_used} in {result.processing_time_ms}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <img
                src={result.outputs.web}
                alt="Generated NBA Card"
                className="mx-auto max-w-sm rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Failed to load generated card image');
                  e.currentTarget.src = '/placeholder-card.png';
                }}
              />
              <div className="mt-4 flex justify-center gap-4">
                <Button
                  onClick={() => window.open(result.outputs!.web, '_blank')}
                  variant="outline"
                >
                  View Full Size
                </Button>
                {result.outputs.hires && (
                  <Button
                    onClick={() => window.open(result.outputs!.hires!, '_blank')}
                    variant="outline"
                  >
                    Download HD
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Cost: ${result.cost_estimate.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
