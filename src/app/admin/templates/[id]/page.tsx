'use client';

import React, { useEffect, useState, use } from 'react';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TemplateService, Template, TemplateVariant, GeminiGenerationRequest } from '@/lib/services/templateService';
import { safeSupabase } from '@/lib/supabaseClient';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Settings, 
  Eye, 
  Upload,
  Palette,
  Grid,
  CheckCircle
} from 'lucide-react';

interface TemplateBuilderPageProps {
  params: Promise<{ id: string }>;
}

const TemplateBuilderPage = ({ params }: TemplateBuilderPageProps) => {
  const { user } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const { id: templateId } = use(params);
  
  // State
  const [template, setTemplate] = useState<Template | null>(null);
  const [variants, setVariants] = useState<TemplateVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  // Simple preview modal state
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  

  // Auth check with useEffect to avoid setState during render
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      router.push('/auth');
    }
  }, [user, userRole, router]);

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Checking permissions...
        </div>
      </div>
    );
  }

  // Load template data
  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load template and variants in parallel
        const [templateData, variantsData] = await Promise.all([
          TemplateService.getAllTemplates().then(templates => 
            templates.find(t => t.id === templateId)
          ),
          TemplateService.getAllTemplateVariants(templateId)
        ]);

        if (!templateData) {
          throw new Error('Template not found');
        }

        setTemplate(templateData);
        setVariants(variantsData);

      } catch (error) {
        console.error('❌ Error loading template data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplateData();
    }
  }, [templateId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Template Builder...
        </div>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p className="font-medium">Failed to load template</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/admin/templates')}
                  >
                    Back to Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Simple preview functions
  const openPreview = (imageUrl: string, title: string) => {
    setPreviewImage({ url: imageUrl, title });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ErrorBoundary>
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6 mt-6">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/admin/templates')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">{template.display_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? 'Active' : 'Draft'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {template.style}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        v{template.version} • {variants.length} variants
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                </div>
              </div>

              {/* Template Builder Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="generate" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="layers" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Layers
                  </TabsTrigger>
                  <TabsTrigger value="coordinates" className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Coordinates
                  </TabsTrigger>
                  <TabsTrigger value="theming" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theming
                  </TabsTrigger>
                  <TabsTrigger value="publish" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Publish
                  </TabsTrigger>
                </TabsList>

                {/* Generate Tab */}
                <TabsContent value="generate" className="mt-6">
                  <GenerateTab 
                    template={template}
                    variants={variants}
                    onVariantsUpdate={setVariants}
                    onPreviewImage={openPreview}
                  />
                </TabsContent>

                {/* Layers Tab */}
                <TabsContent value="layers" className="mt-6">
                  <LayersTab 
                    template={template}
                    variants={variants}
                  />
                </TabsContent>

                {/* Coordinates Tab */}
                <TabsContent value="coordinates" className="mt-6">
                  <CoordinatesTab 
                    template={template}
                    variants={variants}
                  />
                </TabsContent>

                {/* Theming Tab */}
                <TabsContent value="theming" className="mt-6">
                  <ThemingTab 
                    template={template}
                    variants={variants}
                  />
                </TabsContent>

                {/* Publish Tab */}
                <TabsContent value="publish" className="mt-6">
                  <PublishTab 
                    template={template}
                    variants={variants}
                    onTemplateUpdate={setTemplate}
                    onVariantsUpdate={setVariants}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </ErrorBoundary>

      {/* Simple Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
              <h3 className="font-medium">{previewImage.title}</h3>
              <p className="text-sm text-gray-300">Click outside to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Generate Tab Component
interface GenerateTabProps {
  template: Template;
  variants: TemplateVariant[];
  onVariantsUpdate: (variants: TemplateVariant[]) => void;
  onPreviewImage: (imageUrl: string, title: string) => void;
}

const GenerateTab: React.FC<GenerateTabProps> = ({ template, variants, onVariantsUpdate, onPreviewImage }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationConfig, setGenerationConfig] = useState<Partial<GeminiGenerationRequest>>({
    style: template.style as any,
    visual_motifs: [
      'metallic/chrome beveled borders',
      'hexagonal stat box area (top-right)',
      'arena crowd/court ambiance',
      'layered depth with shadows and light streaks'
    ],
    palette: {
      base: ['#0E1014', '#222733'],
      accents: ['#C9A74A', '#5BC0EB']
    },
    render_size: { w: 1080, h: 1920 },
    deliver_layers: [
      'background',
      'overlay_border', 
      'overlay_glow',
      'photo_mask',
      'foil_map',
      'light_map',
      'nameplate.svg',
      'statbox.svg'
    ],
    constraints: {
      no_trademarks: true,
      no_team_specific_icons: true,
      high_text_legibility: true,
      photo_silhouette_center: true
    },
    variants: 2
  });

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // Get current session token
      const { data: { session } } = await safeSupabase().auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      // Call the generate-template Edge Function with timeout
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...generationConfig,
          template_id: template.id
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Generation failed:', response.status, errorText);
        throw new Error(`Generation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Template generation completed:', result);
      
      // Check if variants were actually created
      const variantCount = result.variants || result.packs?.length || 0;
      if (variantCount > 0) {
        console.log(`✅ Generated ${variantCount} variants`);
      } else {
        console.warn('⚠️ No variants returned from generation');
        console.log('Response structure:', result);
      }
      
      // Refresh variants
      const updatedVariants = await TemplateService.getAllTemplateVariants(template.id);
      console.log('🔄 Refreshed variants:', updatedVariants.length);
      console.log('🖼️ Variant preview URLs:', updatedVariants.map(v => ({ key: v.variant_key, url: v.preview_url })));
      onVariantsUpdate(updatedVariants);
      
    } catch (error) {
      console.error('❌ Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Generation
          </CardTitle>
          <CardDescription>
            Generate template variants using Gemini 2.5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Style: {template.style}</p>
            <p className="text-sm text-muted-foreground">
              {template.description || 'No description provided'}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Variants to Generate</p>
            <p className="text-sm text-muted-foreground">4 cohesive variants (A, B, C, D)</p>
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Variants
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Variants</CardTitle>
          <CardDescription>
            {variants.length} variants created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No variants generated yet</p>
              <p className="text-sm">Click "Generate Variants" to create template designs</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {variants.map((variant) => (
                <div key={variant.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Variant {variant.variant_key}</span>
                    <Badge variant={variant.is_active ? "default" : "secondary"} className="text-xs">
                      {variant.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                  <div 
                    className="h-20 bg-muted rounded mb-2 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors group"
                    onClick={() => variant.preview_url && onPreviewImage(variant.preview_url, `Variant ${variant.variant_key}`)}
                  >
                    {variant.preview_url ? (
                      <img 
                        src={variant.preview_url} 
                        alt={`Variant ${variant.variant_key}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          console.error('Failed to load preview image:', variant.preview_url);
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-xs text-muted-foreground"
                      style={{ display: variant.preview_url ? 'none' : 'block' }}
                    >
                      {variant.preview_url ? 'Loading...' : 'No Preview'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{variant.display_name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder components for other tabs
const LayersTab: React.FC<{ template: Template; variants: TemplateVariant[] }> = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center py-8">
        <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">Layer Management</h3>
        <p className="text-muted-foreground">Toggle layer visibility and inspect assets</p>
      </div>
    </CardContent>
  </Card>
);

const CoordinatesTab: React.FC<{ template: Template; variants: TemplateVariant[] }> = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center py-8">
        <Grid className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">Coordinate Editor</h3>
        <p className="text-muted-foreground">Drag and position elements on the card</p>
      </div>
    </CardContent>
  </Card>
);

const ThemingTab: React.FC<{ template: Template; variants: TemplateVariant[] }> = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center py-8">
        <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">Theming & Effects</h3>
        <p className="text-muted-foreground">Configure colors, effects, and typography</p>
      </div>
    </CardContent>
  </Card>
);

const PublishTab: React.FC<{ 
  template: Template; 
  variants: TemplateVariant[];
  onTemplateUpdate: (template: Template) => void;
  onVariantsUpdate: (variants: TemplateVariant[]) => void;
}> = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center py-8">
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">Publish Template</h3>
        <p className="text-muted-foreground">Validate and publish template variants</p>
      </div>
    </CardContent>
  </Card>
);

export default TemplateBuilderPage;
