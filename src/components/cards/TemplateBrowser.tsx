'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerCardService, Template, TemplateVariant } from '@/lib/services/playerCardService';
import { Palette, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface TemplateBrowserProps {
  onTemplateSelect: (templateId: string, variantId: string) => void;
  onClose?: () => void;
}

export function TemplateBrowser({ onTemplateSelect, onClose }: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [variants, setVariants] = useState<TemplateVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlayerCardService.getAvailableTemplates();
      setTemplates(data.templates);
      setVariants(data.variants);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVariantsForTemplate = (templateId: string) => {
    return variants.filter(v => v.template_id === templateId);
  };

  const getUniqueStyles = () => {
    const styles = [...new Set(templates.map(t => t.style))];
    return styles.filter(Boolean);
  };

  const filteredTemplates = selectedStyle === 'all' 
    ? templates 
    : templates.filter(t => t.style === selectedStyle);

  const handleVariantSelect = (templateId: string, variantId: string) => {
    onTemplateSelect(templateId, variantId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading NBA card templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Unable to Load Templates</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTemplates} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
          <p className="text-muted-foreground">
            No NBA card templates have been created yet. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Choose Your NBA Card Template
        </h2>
        <p className="text-muted-foreground">
          Select from professionally designed templates created by our admins
        </p>
      </div>

      {/* Style Filter */}
      <Tabs value={selectedStyle} onValueChange={setSelectedStyle} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
          <TabsTrigger value="all">All Styles</TabsTrigger>
          {getUniqueStyles().slice(0, 3).map(style => (
            <TabsTrigger key={style} value={style} className="capitalize">
              {style}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedStyle} className="mt-6">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              const templateVariants = getVariantsForTemplate(template.id);
              
              return (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {template.style}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Template Variants */}
                    {templateVariants.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Available Designs ({templateVariants.length})
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {templateVariants.slice(0, 4).map(variant => (
                            <div
                              key={variant.id}
                              className="relative group/variant cursor-pointer"
                              onClick={() => handleVariantSelect(template.id, variant.id)}
                            >
                              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-primary/50">
                                {variant.preview_url ? (
                                  <img
                                    src={variant.preview_url}
                                    alt={variant.display_name}
                                    className="w-full h-full object-cover group-hover/variant:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Palette className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/variant:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                                    <ArrowRight className="w-4 h-4 mr-1" />
                                    Select
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-xs text-center mt-1 font-medium">
                                {variant.display_name}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        {templateVariants.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{templateVariants.length - 4} more designs available
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Palette className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No designs available for this template
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Close Button */}
      {onClose && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
