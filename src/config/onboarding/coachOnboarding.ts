import type { ChecklistStep } from "@/components/onboarding/WelcomeChecklist";
import type { FeatureTourStep } from "@/components/onboarding/FeatureTour";
import type { HelpFAQ } from "@/components/support/HelpPanel";

export const coachChecklistSteps: ChecklistStep[] = [
  {
    title: "Create your team",
    description: "Head to My Teams, tap Create Team, and save your roster shell.",
    action: { label: "Go to My Teams", href: "/dashboard/coach?section=teams" }
  },
  {
    title: "Add your players",
    description: "Use Manage → Add Player to search existing profiles or add custom entries.",
    action: { label: "Manage Players", href: "/dashboard/coach?section=teams" }
  },
  {
    title: "Set up a game",
    description: "From your team card choose Quick Track or New Game and enter opponent details.",
    action: { label: "Start Quick Track", href: "/dashboard/coach?section=quick-track" }
  },
  {
    title: "Run the stat tracker",
    description: "Select a player, tap the stat buttons, and manage the clock and substitutions live.",
    action: { label: "Launch Tracker", href: "/dashboard/coach?section=quick-track" }
  },
  {
    title: "Complete the game",
    description: "When the final buzzer hits, press End Game to lock scores and close the session."
  },
  {
    title: "Review analytics",
    description: "Back on the dashboard, open the finished game to view box score and trend insights.",
    action: { label: "View Analytics", href: "/dashboard/coach?section=overview" }
  }
];

export const coachFAQs: HelpFAQ[] = [
  {
    question: "How do I add or edit players?",
    answer: "Open your team card, select Manage, and add players from existing profiles or create custom ones."
  },
  {
    question: "What if my opponent changes?",
    answer: "Edit the game details from the dashboard before you start tracking, or update the opponent name in the tracker header."
  },
  {
    question: "When do analytics populate?",
    answer: "Once you tap End Game in the tracker, the system locks stats and generates analytics automatically."
  }
];

export const coachFeatureTourSteps: FeatureTourStep[] = [
  {
    target: "[data-coach-tour=back-button]",
    title: "Return to dashboard",
    description: "Use this shortcut to jump back to your coach dashboard without ending the game."
  },
  {
    target: "[data-coach-tour=scoreboard]",
    title: "Control the clock",
    description: "Start, stop, or reset the game and shot clocks. Update the quarter and possession here."
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
    description: "When the game ends, tap End Game here to lock stats and unlock analytics."
  }
];


