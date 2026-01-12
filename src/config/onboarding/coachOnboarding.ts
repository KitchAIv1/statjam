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
    description: "Click Create Team to set up your roster. Free accounts: 1 team, Premium: unlimited.",
    action: { label: "Create Team", href: "/dashboard/coach" }
  },
  {
    title: "Add your players",
    description: "Open team card → Manage Players → Add from existing profiles or create custom players.",
    action: { label: "Manage Players", href: "/dashboard/coach" }
  },
  {
    title: "Start a game",
    description: "Click 'Start New Game' for manual tracking. Free: 10 games max. Premium: unlimited + video tracking.",
    action: { label: "Quick Actions", href: "/dashboard/coach" }
  },
  {
    title: "Track stats",
    description: "Use stat buttons to record plays live. Tap players, then tap stat buttons.",
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
    question: "What can I do with a Free account?",
    answer: "Free accounts get 1 team with up to 10 manually tracked games. Perfect for getting started with basic stat tracking and analytics."
  },
  {
    question: "How do I start tracking a game?",
    answer: "Click 'Start New Game' in Quick Actions, select a team, enter opponent details, and use the stat tracker."
  },
  {
    question: "What's Manual vs Video tracking?",
    answer: "Manual: Track stats live during the game (free). Video: Upload recorded footage for AI tracking + auto-generated highlight clips (premium only)."
  },
  {
    question: "Can free accounts upload videos?",
    answer: "No. Video tracking is exclusive to premium subscribers. Free accounts can manually track up to 10 games with 1 team."
  },
  {
    question: "How do I add players to my team?",
    answer: "Open your team card → Manage Players → Add from existing profiles or create custom players."
  },
  {
    question: "Official vs Practice teams?",
    answer: "Official: Stats count toward player profiles. Practice: For scrimmages/training, stats stay private."
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
    question: "What do Premium plans include?",
    answer: "Unlimited teams, unlimited games, video tracking with AI highlights, advanced analytics, and the Verified badge on your profile."
  }
];

export const coachFeatureTourSteps: FeatureTourStep[] = [
  {
    target: "[data-coach-tour=quick-actions]",
    title: "Quick Actions",
    description: "Start a game for manual tracking. Premium subscribers can also upload video for AI-assisted tracking."
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


