import { Lock } from "lucide-react";

interface Achievement {
  type: string;
  value: string | number;
  label: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const isLocked = achievement.type === "locked";
  
  return (
    <div className={`
      w-16 h-16 rounded-full flex flex-col items-center justify-center
      ${isLocked 
        ? 'bg-muted text-muted-foreground' 
        : achievement.type === 'rebounds' 
          ? 'bg-red-600 text-white'
          : 'bg-orange-600 text-white'
      }
    `}>
      {isLocked ? (
        <Lock className="w-6 h-6" />
      ) : (
        <>
          <div className="font-bold text-lg">{achievement.value}</div>
          <div className="text-xs">{achievement.label}</div>
        </>
      )}
    </div>
  );
}