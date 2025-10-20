'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TemplateService, Template } from '@/lib/services/templateService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Palette, 
  Layers, 
  Settings,
  Activity,
  TrendingUp,
  Database
} from 'lucide-react';

const AdminTemplatesPage = () => {
  const { user, loading } = useAuthV2();
  const router = useRouter();
  const userRole = user?.role;
  
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    // ✅ Clear redirect flag when dashboard loads successfully
    sessionStorage.removeItem('auth-redirecting');
    
    if (!loading && (!user || userRole !== 'admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user || userRole !== 'admin') return;
      
      try {
        setTemplatesLoading(true);
        setError(null);
        const templatesData = await TemplateService.getAllTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('❌ Error loading templates:', error);
        setError(error instanceof Error ? error.message : 'Failed to load templates');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [user, userRole]);

  // Loading state
  if (loading || !user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeTemplates = templates.filter(t => t.is_active);
  const totalStyles = [...new Set(templates.map(t => t.style))].length;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ErrorBoundary>
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6 mt-6">
              
              {/* Header */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Template Builder
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create and manage NBA-style card templates with AI-powered design generation.
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{templates.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeTemplates.length} active
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Style Variants</CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStyles}</div>
                    <p className="text-xs text-muted-foreground">
                      Different design styles
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Generation Ready</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Online</div>
                    <p className="text-xs text-muted-foreground">
                      Gemini 2.5 connected
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/admin/templates/new')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </div>

              {/* Templates Grid */}
              {templatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 bg-muted rounded mb-4"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-muted rounded flex-1"></div>
                          <div className="h-8 bg-muted rounded w-16"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-center text-destructive">
                      <p className="font-medium">Failed to load templates</p>
                      <p className="text-sm mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : templates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first NBA-style card template to get started.
                      </p>
                      <Button onClick={() => router.push('/admin/templates/new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template}
                      onEdit={() => router.push(`/admin/templates/${template.id}`)}
                      onView={() => router.push(`/admin/templates/${template.id}/preview`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onView: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onView }) => {
  const getStyleColor = (style: string) => {
    const colors = {
      modern: 'bg-blue-100 text-blue-800',
      vintage: 'bg-amber-100 text-amber-800',
      championship: 'bg-yellow-100 text-yellow-800',
      neon: 'bg-purple-100 text-purple-800',
      holographic: 'bg-pink-100 text-pink-800'
    };
    return colors[style as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{template.display_name}</CardTitle>
            <CardDescription className="mt-1">
              {template.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Badge 
              variant={template.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {template.is_active ? 'Active' : 'Draft'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Style Badge */}
          <Badge className={`${getStyleColor(template.style)} capitalize`}>
            {template.style}
          </Badge>

          {/* Template Preview Placeholder */}
          <div className="h-32 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Layers className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Template Preview</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Version {template.version}</div>
            <div>Created {new Date(template.created_at).toLocaleDateString()}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onView}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTemplatesPage;
