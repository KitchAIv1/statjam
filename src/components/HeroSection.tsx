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
    router.push('/auth');
  };
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2190&auto=format&fit=crop"
          alt="Basketball game action"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content - Takes up available space */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Logo and tagline */}
            <div className="text-white">
              <div className="mb-8">
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  StatJam
                </h1>
                <div className="text-xl lg:text-2xl opacity-90 leading-relaxed">
                  Your Courtside Command Center
                </div>
                <div className="text-lg lg:text-xl opacity-80 leading-relaxed mt-2">
                  Track every point, rebound, and clutch moment — live, anywhere.
                </div>
                <div className="text-base lg:text-lg opacity-70 leading-relaxed mt-1">
                  For organizers, players, and fans who want real stats that feel pro.
                </div>
              </div>
            </div>

            {/* Right side - CTA Buttons */}
            <div className="flex flex-col gap-4 lg:justify-end">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold flex-1"
                >
                  Get Started
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onWatchLive}
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold transition-all duration-300 flex-1 h-auto rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50"
                >
                  Watch Live
                </Button>
                <Button 
                  onClick={onViewTournament}
                  className="border-2 border-orange-400 bg-transparent text-orange-400 hover:bg-orange-400 hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300 flex-1 h-auto rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50"
                >
                  Explore Tournaments
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tagline - Separated section */}
      <div className="relative z-10 px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <p className="text-lg lg:text-xl leading-relaxed">
            <span className="font-semibold text-orange-300">StatJam doesn't just keep score — it builds your basketball legacy.</span>
            <br className="hidden sm:block" />
            <span className="hidden sm:inline"> </span>
            Every shot, assist, and highlight becomes part of your permanent record.
          </p>
        </div>
      </div>
    </section>
  );
}