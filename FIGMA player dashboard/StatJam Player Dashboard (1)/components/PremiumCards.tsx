import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Star, Sparkles } from "lucide-react";

interface PremiumCardsProps {
  playerName: string;
  onPremiumClick?: () => void;
}

export function PremiumCards({ playerName, onPremiumClick }: PremiumCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Card 1 */}
      <div className="relative group">
        <div className="aspect-[3/4] bg-gradient-to-br from-red-600 to-orange-600 rounded-lg overflow-hidden border-2 border-red-500">
          <div className="p-4 h-full flex flex-col">
            <div className="flex-1 relative">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=250&fit=crop&crop=faces"
                alt="Player card"
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1">
                <span className="text-white text-xs font-bold">STATJAM</span>
              </div>
              <div className="absolute bottom-2 right-2 text-2xl font-bold text-white">
                24
              </div>
            </div>
            <div className="mt-2">
              <div className="text-orange-200 font-bold text-sm">AND Rᵉ</div>
              <div className="text-white text-xs">23.4 RB 2.14:37</div>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-orange-200 text-red-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">22</span>
          </div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="relative">
        <div className="aspect-[3/4] bg-gradient-to-br from-orange-600 to-red-700 rounded-lg overflow-hidden border-2 border-orange-500">
          <div className="p-4 h-full flex flex-col">
            <div className="flex-1 relative">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=250&fit=crop&crop=faces"
                alt="Player card premium"
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute top-2 left-2">
                <Sparkles className="w-4 h-4 text-orange-200" />
              </div>
              <div className="absolute bottom-2 right-2 text-2xl font-bold text-white">
                24
              </div>
            </div>
            <div className="mt-2">
              <div className="text-white font-bold text-sm">ANDRE</div>
              <div className="text-white font-bold text-sm">SIMPSON</div>
              <div className="text-orange-200 text-xs flex gap-2">
                <span>23.4</span>
                <span>82</span>
                <span>7.1</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onPremiumClick}
          >
            <Star className="w-4 h-4 mr-2" />
            GENERATE NEW CARD
          </Button>
        </div>
      </div>
    </div>
  );
}