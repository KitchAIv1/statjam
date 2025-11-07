"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import { AlertTriangle, Trophy } from "lucide-react";

interface CompletionNudgeProps {
  message: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "info" | "warning" | "success";
  className?: string;
}

const variantStyles: Record<NonNullable<CompletionNudgeProps["variant"]>, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700"
};

export function CompletionNudge({
  message,
  primaryAction,
  secondaryAction,
  variant = "info",
  className
}: CompletionNudgeProps) {
  const styles = variantStyles[variant];
  const Icon = variant === "success" ? Trophy : AlertTriangle;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        styles,
        className
      )}
    >
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/60">
          <Icon className="h-4 w-4" />
        </div>
        <p className="font-medium leading-tight">{message}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {secondaryAction && (
          <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        <Button size="sm" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
      </div>
    </div>
  );
}


