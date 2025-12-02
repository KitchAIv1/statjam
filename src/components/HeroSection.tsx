import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  onWatchLive?: () => void;
  onViewTournament?: () => void;
}

export function HeroSection({ onWatchLive, onViewTournament }: HeroSectionProps) {
  const router = useRouter();

  const handleClaimProfile = () => {
    router.push('/auth?mode=signup&role=player');
  };

  const handleRunTournament = () => {
    router.push('/auth?mode=signup&role=organizer');
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
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Main Content - Centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto w-full text-center">
          {/* Logo */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            StatJam
          </h1>
          
          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Your Basketball Identity Starts Here
          </h2>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            StatJam is where players build verified profiles, coaches discover talent, and organizers run tournaments — all in one connected platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              size="lg" 
              onClick={handleClaimProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 text-xl font-bold shadow-2xl shadow-orange-500/30 hover:shadow-orange-600/40 transform hover:scale-105 transition-all duration-200"
            >
              Claim Your Profile
            </Button>
            <Button 
              onClick={handleRunTournament}
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900 px-8 py-5 text-lg font-semibold backdrop-blur-sm transition-all duration-200"
            >
              Run a Tournament
            </Button>
          </div>

          {/* Social Proof */}
          <p className="text-white/70 text-lg mb-4">
            Building basketball communities worldwide
          </p>

          {/* Country Flags */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-white/80 text-sm sm:text-base">
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇺🇸</span> USA</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇵🇭</span> Philippines</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇦🇺</span> Australia</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇮🇳</span> India</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇮🇹</span> Italy</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇨🇦</span> Canada</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5"><span className="text-2xl">🇬🇧</span> UK</span>
          </div>
        </div>
      </div>
    </section>
  );
}