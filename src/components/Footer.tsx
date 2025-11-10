'use client';

import { Separator } from "@/components/ui/separator";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useState } from "react";
import { FeedbackModal } from "./feedback/FeedbackModal";

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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="block text-gray-300 hover:text-white transition-colors text-left"
              >
                Give Feedback
              </button>
            </div>
          </div>

          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

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

        <Separator className="mb-12 bg-gray-700" />

        {/* Tagline */}
        <div className="text-center mb-12 px-4">
          <p className="text-lg text-gray-300 italic max-w-3xl mx-auto">
            Built for ballers, coaches, and organizers who play anywhere but want to look pro.
          </p>
        </div>

        {/* Bottom section - Copyright, Social, Product Hunt */}
        <div className="flex flex-col items-center gap-8">
          {/* Social Media Icons + Product Hunt Badge */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Social Icons */}
            <div className="flex items-center gap-6">
              <a
                href="https://www.facebook.com/people/Statjam/61583861420167/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Facebook className="w-6 h-6" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://instagram.com/stat.jam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Instagram className="w-6 h-6" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="w-6 h-6" />
                <span className="sr-only">X (Twitter)</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <TikTokIcon className="w-6 h-6" />
                <span className="sr-only">TikTok</span>
              </a>
            </div>

            {/* Vertical divider on desktop */}
            <div className="hidden md:block w-px h-12 bg-gray-700" />

            {/* Product Hunt Badge */}
            <a 
              href="https://www.producthunt.com/products/statjam?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-statjam" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-90 transition-opacity"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1035008&theme=light&t=1762437800195" 
                alt="StatJam - Level stats, real-time, zero friction | Product Hunt" 
                style={{ width: '200px', height: '43px' }} 
                width="200" 
                height="43" 
              />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              &copy; 2025 StatJam by Stratpremier. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}