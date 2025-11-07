"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface SmartTooltipProps {
  id: string;
  content: string;
  children: React.ReactElement;
  side?: TooltipSide;
  duration?: number;
  storagePrefix?: string;
}

const DEFAULT_DURATION = 3500;

export function SmartTooltip({
  id,
  content,
  children,
  side = "top",
  duration = DEFAULT_DURATION,
  storagePrefix = "onboarding-tooltip"
}: SmartTooltipProps) {
  const storageKey = `${storagePrefix}-${id}`;
  const [autoMode, setAutoMode] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSeen = window.localStorage.getItem(storageKey) === "true";

    if (!hasSeen) {
      setAutoMode(true);
      setOpen(true);

      const timer = window.setTimeout(() => {
        setOpen(false);
        setAutoMode(false);
        window.localStorage.setItem(storageKey, "true");
      }, duration);

      return () => window.clearTimeout(timer);
    }

    setAutoMode(false);
  }, [duration, storageKey]);

  return (
    <Tooltip open={autoMode ? open : undefined} onOpenChange={autoMode ? setOpen : undefined}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-left">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}


