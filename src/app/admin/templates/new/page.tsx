'use client';

import React, { useState } from 'react';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TemplateService } from '@/lib/services/templateService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';

const NewTemplatePage = () => {
  const { user } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    template_key: '',
    display_name: '',
    style: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth check
  if (!user || userRole !== 'admin') {
    router.push('/auth');
    return null;
  }

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Generate template key from display name
  const generateTemplateKey = (displayName: string) => {
    const baseKey = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${baseKey}_${timestamp}`;
  };

  // Handle display name change with auto-key generation
  const handleDisplayNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      display_name: value,
      template_key: generateTemplateKey(value)
    }));
    setError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.display_name.trim()) {
      setError('Display name is required');
      return false;
    }
    if (!formData.template_key.trim()) {
      setError('Template key is required');
      return false;
    }
    if (!formData.style) {
      setError('Style is required');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const template = await TemplateService.createTemplate({
        template_key: formData.template_key,
        display_name: formData.display_name,
        style: formData.style,
        description: formData.description || undefined
      });

      console.log('✅ Template created successfully:', template.id);
      
      // Redirect to template builder
      router.push(`/admin/templates/${template.id}`);
      
    } catch (error) {
      console.error('❌ Error creating template:', error);
      setError(error instanceof Error ? error.message : 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styleOptions = [
    { value: 'modern', label: 'Modern', description: 'Clean geometric shapes with metallic chrome effects' },
    { value: 'vintage', label: 'Vintage', description: 'Classic basketball card aesthetics with aged textures' },
    { value: 'championship', label: 'Championship', description: 'Premium gold accents with trophy-like elements' },
    { value: 'neon', label: 'Neon', description: 'Electric blue/purple neons with futuristic elements' },
    { value: 'holographic', label: 'Holographic', description: 'Rainbow foil effects with prismatic elements' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ErrorBoundary>
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 mt-6">
              
              {/* Header */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Create New Template</h1>
                  <p className="text-muted-foreground">
                    Design a new NBA-style card template family
                  </p>
                </div>
              </div>

              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Template Details
                  </CardTitle>
                  <CardDescription>
                    Configure the basic properties for your new template family
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name *</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => handleDisplayNameChange(e.target.value)}
                        placeholder="e.g., Modern Chrome"
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        The name that will be shown to users
                      </p>
                    </div>

                    {/* Template Key */}
                    <div className="space-y-2">
                      <Label htmlFor="template_key">Template Key *</Label>
                      <Input
                        id="template_key"
                        value={formData.template_key}
                        onChange={(e) => handleInputChange('template_key', e.target.value)}
                        placeholder="e.g., modern_chrome"
                        className="text-base font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for this template (auto-generated from display name)
                      </p>
                    </div>

                    {/* Style */}
                    <div className="space-y-2">
                      <Label htmlFor="style">Style *</Label>
                      <Select value={formData.style} onValueChange={(value) => handleInputChange('style', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a style category" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The visual style category for this template
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the visual characteristics and use cases for this template..."
                        rows={3}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional description to help users understand this template
                      </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Template
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Next Steps Info */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">What happens next?</h3>
                      <p className="text-sm text-muted-foreground">
                        After creating the template, you'll be taken to the Template Builder where you can:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Generate design variants using Gemini 2.5 AI</li>
                        <li>• Configure coordinate positioning for stats and photos</li>
                        <li>• Set up color theming and visual effects</li>
                        <li>• Preview and publish your template variants</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
};

export default NewTemplatePage;
