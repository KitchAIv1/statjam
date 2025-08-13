import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Target, Palette } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "10 AI-Generated NBA Cards",
      description: "Create stunning trading cards monthly"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "AI Coaching & Analysis",
      description: "Personalized performance insights and training"
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Priority Draft Visibility",
      description: "Stand out during recruitment and drafts"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Premium Profile Skins",
      description: "Exclusive themes and customization options"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 border-0 bg-transparent shadow-none overflow-hidden backdrop-blur-sm">
        <div className="glass-modal-accent rounded-xl overflow-hidden">
          {/* Header */}
          <div className="relative p-8 text-center glass-modal-header">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                <Crown className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl text-center font-bold text-foreground">
                Unlock StatJam Pro
              </DialogTitle>
              <DialogDescription className="text-foreground/80 text-center">
                Take your basketball journey to the next level with premium features and AI-powered insights
              </DialogDescription>
            </DialogHeader>

            {/* Pricing */}
            <div className="mt-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary">$10</span>
                <span className="text-foreground/80">/month</span>
              </div>
              <Badge variant="secondary" className="mt-2 bg-primary/20 text-primary border-primary/30">
                Most Popular
              </Badge>
            </div>
          </div>

          {/* Features */}
          <div className="p-8 space-y-6 bg-card/50">
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-card/80 border border-border/50">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20 text-primary">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* What's included */}
            <div className="bg-card/90 border border-border/50 rounded-lg p-4">
              <h5 className="font-semibold mb-3 text-center text-foreground">What's Included</h5>
              <div className="grid grid-cols-2 gap-3 text-sm text-foreground/90">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Monthly cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>AI insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Draft priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Custom themes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full h-12 bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-white shadow-lg"
                size="lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full h-10 hover:bg-card/20 text-foreground/80"
                onClick={onClose}
              >
                Maybe Later
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs text-foreground/70">
                Cancel anytime • Secure payment • Used by 10k+ players
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}