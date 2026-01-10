// ============================================================================
// COACH ONBOARDING CONFIG (<120 lines)
// Purpose: Checklist steps, FAQs, and feature tour for coach dashboard
// Follows .cursorrules: Single responsibility, <150 lines
// ============================================================================

import type { ChecklistStep } from "@/components/onboarding/WelcomeChecklist";
import type { FeatureTourStep } from "@/components/onboarding/FeatureTour";
import type { HelpFAQ } from "@/components/support/HelpPanel";

export const coachChecklistSteps: ChecklistStep[] = [
  {
    title: "Create your team",
    description: "From your dashboard, click Create Team to set up your roster.",
    action: { label: "Create Team", href: "/dashboard/coach" }
  },
  {
    title: "Add your players",
    description: "Open team card → Manage Players → Add from existing profiles or create custom players.",
    action: { label: "Manage Players", href: "/dashboard/coach" }
  },
  {
    title: "Start a game",
    description: "Use 'Start New Game' for manual tracking, or 'Upload Video' for AI-assisted tracking with clips.",
    action: { label: "Quick Actions", href: "/dashboard/coach" }
  },
  {
    title: "Track stats",
    description: "Manual: Use stat buttons live. Video: Wait for processing to complete.",
  },
  {
    title: "Review in Game Viewer",
    description: "Open completed games to see box scores, play-by-play, and highlight clips.",
    action: { label: "Recent Games", href: "/dashboard/coach" }
  },
  {
    title: "Create a Season (optional)",
    description: "Organize games into seasons for ESPN-like standings and player stats.",
    action: { label: "Team → Seasons", href: "/dashboard/coach" }
  }
];

export const coachFAQs: HelpFAQ[] = [
  {
    question: "How do I start tracking a game?",
    answer: "Click 'Start New Game' in Quick Actions, select a team, enter opponent details, and use the stat tracker."
  },
  {
    question: "What's Manual vs Video tracking?",
    answer: "Manual: Track stats live during the game. Video: Upload recorded footage for AI-assisted stat tracking plus auto-generated highlight clips."
  },
  {
    question: "How do video credits work?",
    answer: "Each video upload uses 1 credit. You get AI-tracked stats plus highlight clips. Buy more credits from Quick Actions when needed."
  },
  {
    question: "What's the daily upload limit?",
    answer: "Free accounts: 2 uploads per day (resets every 24 hours). Premium subscribers have unlimited uploads."
  },
  {
    question: "How do I add players to my team?",
    answer: "Open your team card → Manage Players → Add from existing profiles or create custom players."
  },
  {
    question: "Official vs Practice teams?",
    answer: "Official: Stats count toward player profiles and season totals. Practice: For scrimmages/training, stats stay private."
  },
  {
    question: "What are Seasons?",
    answer: "Organize games into seasons for ESPN-like standings and player stats. Access via team card → Seasons.",
    href: "/dashboard/coach",
    hrefLabel: "Open Dashboard"
  },
  {
    question: "Where do I view completed games?",
    answer: "Click any game from Recent Games or your team card to open the Game Viewer with box scores, play-by-play, and clips."
  },
  {
    question: "How do I get Verified status?",
    answer: "Subscribe to a premium plan to display the verified badge on your profile and unlock unlimited uploads."
  }
];

export const coachFeatureTourSteps: FeatureTourStep[] = [
  {
    target: "[data-coach-tour=quick-actions]",
    title: "Quick Actions",
    description: "Start a new game for manual tracking, or upload video for AI-assisted tracking with highlights."
  },
  {
    target: "[data-coach-tour=teams-strip]",
    title: "Your Teams",
    description: "Manage your teams, players, seasons, and access game tracking from here."
  },
  {
    target: "[data-coach-tour=scoreboard]",
    title: "Control the clock",
    description: "Start, stop, or reset the game and shot clocks. Update the quarter and possession."
  },
  {
    target: "[data-coach-tour=player-selector]",
    title: "Select a player",
    description: "Tap on any on-court player to make them active. Stats apply to the highlighted player."
  },
  {
    target: "[data-coach-tour=stat-buttons]",
    title: "Record stats",
    description: "Use these action buttons to capture field goals, assists, rebounds, fouls, and more."
  },
  {
    target: "[data-coach-tour=action-bar]",
    title: "Finish the game",
    description: "When the game ends, tap End Game to lock stats and view analytics in the Game Viewer."
  }
];


