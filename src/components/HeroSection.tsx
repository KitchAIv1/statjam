import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  onWatchLive?: () => void;
  onViewTournament?: () => void;
}

export function HeroSection({ onWatchLive, onViewTournament }: HeroSectionProps) {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth?mode=signup');
  };
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2190&auto=format&fit=crop&fm=webp"
          alt="Basketball game action"
          className="w-full h-full object-cover"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content - Takes up available space */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Logo and tagline */}
            <div className="text-white">
              <div className="mb-10">
                <h1 className="text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  StatJam
                </h1>
                <div className="text-2xl sm:text-3xl lg:text-4xl opacity-95 leading-tight mb-4">
                  NBA‑Level Stats. Real‑Time. Zero Friction.
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl opacity-85 leading-relaxed mb-3">
                  Automation handles clock, possession, and sequences — you focus on the game.
                </div>
                <div className="text-base sm:text-lg lg:text-xl opacity-75 leading-relaxed">
                  Built for organizers, stat admins, coaches, players, and fans.
                </div>
              </div>
            </div>

            {/* Right side - CTA Buttons */}
            <div className="flex flex-col gap-4 lg:justify-end">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 text-xl font-bold shadow-2xl shadow-orange-500/30 hover:shadow-orange-600/40 transform hover:scale-105 transition-all duration-200"
                >
                  Start Tracking Like the Pros
                </Button>
                <Button 
                  onClick={onWatchLive}
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900 px-8 py-5 text-lg font-semibold backdrop-blur-sm transition-all duration-200"
                >
                  Watch Live Games
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tagline - Separated section */}
      <div className="relative z-10 px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed">
            <span className="font-bold text-orange-300">StatJam doesn't just keep score — it builds your basketball legacy.</span>
            {" "}
            Every shot, assist, and highlight becomes part of your permanent record.
          </p>
        </div>
      </div>
    </section>
  );
}