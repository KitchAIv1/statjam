import { Separator } from "@/components/ui/separator";
import { Facebook, Instagram, Twitter } from "lucide-react";

// TikTok icon as a custom SVG since it's not in lucide-react
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Three columns */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Column 1 - StatJam */}
          <div>
            <h3 className="text-xl font-bold text-orange-500 mb-6">StatJam</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Blog
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>

          {/* Column 2 - For Organizers */}
          <div>
            <h3 className="text-xl font-bold text-orange-500 mb-6">For Organizers</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Host a Tournament
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
            </div>
          </div>

          {/* Column 3 - For Players */}
          <div>
            <h3 className="text-xl font-bold text-orange-500 mb-6">For Players</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Player Premium
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                Create Your Profile
              </a>
            </div>
          </div>
        </div>

        <Separator className="mb-8 bg-gray-700" />

        {/* Unifying tagline */}
        <div className="text-center mb-8">
          <p className="text-lg text-gray-300 italic">
            StatJam — Built for ballers, coaches, and organizers who play anywhere but want to look pro.
          </p>
        </div>

        <Separator className="mb-8 bg-gray-700" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-gray-400">
              &copy; 2025 StatJam. All Rights Reserved.
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Facebook className="w-6 h-6" />
              <span className="sr-only">Facebook</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Instagram className="w-6 h-6" />
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-6 h-6" />
              <span className="sr-only">X (Twitter)</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <TikTokIcon className="w-6 h-6" />
              <span className="sr-only">TikTok</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}