"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Rocket, X, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import { type UserRole } from "@/components/auth/RoleSelector";

export interface ChecklistStep {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: ReactNode;
}

interface WelcomeChecklistProps {
  role: UserRole;
  steps: ChecklistStep[];
  title?: string;
  subtitle?: string;
  storageKey?: string;
  className?: string;
  onDismiss?: () => void;
}

type RoleAccent = {
  badge: string;
  title: string;
  highlight: string;
};

const roleAccents: Record<UserRole, RoleAccent> = {
  coach: {
    badge: "border-blue-500 text-blue-600 bg-blue-50",
    title: "from-blue-600 to-teal-500",
    highlight: "text-blue-600"
  },
  organizer: {
    badge: "border-orange-500 text-orange-600 bg-orange-50",
    title: "from-orange-600 to-red-500",
    highlight: "text-orange-600"
  },
  stat_admin: {
    badge: "border-purple-500 text-purple-600 bg-purple-50",
    title: "from-purple-600 to-indigo-500",
    highlight: "text-purple-600"
  },
  player: {
    badge: "border-emerald-500 text-emerald-600 bg-emerald-50",
    title: "from-emerald-600 to-lime-500",
    highlight: "text-emerald-600"
  }
};

const defaultTitles: Record<UserRole, string> = {
  coach: "Coach Quick Start",
  organizer: "Organizer Quick Start",
  stat_admin: "Stat Admin Quick Start",
  player: "Player Quick Start"
};

export function WelcomeChecklist({
  role,
  steps,
  title,
  subtitle = "Follow these steps to get the most out of StatJam.",
  storageKey,
  className,
  onDismiss
}: WelcomeChecklistProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const key = storageKey ?? `onboarding-${role}-checklist-dismissed`;
  const accents = roleAccents[role];
  const resolvedTitle = title ?? defaultTitles[role];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hasDismissed = window.localStorage.getItem(key) === "true";
    if (!hasDismissed) {
      setIsVisible(true);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ role?: UserRole }>;
      if (customEvent.detail && customEvent.detail.role && customEvent.detail.role !== role) {
        return;
      }

      window.localStorage.removeItem(key);
      setIsVisible(true);
    };

    window.addEventListener("open-onboarding-checklist", handler as EventListener);

    return () => {
      window.removeEventListener("open-onboarding-checklist", handler as EventListener);
    };
  }, [key, role]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, "true");
    }
    setIsVisible(false);
    onDismiss?.();
  };

  const checklistSteps = useMemo(() => steps.slice(0, 8), [steps]);

  if (!hydrated || !isVisible || checklistSteps.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-slate-200 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge className={cn("w-fit border text-xs font-semibold", accents.badge)}>
            <Rocket className="mr-1 h-3 w-3" />
            Welcome Guide
          </Badge>
          <CardTitle className="text-2xl font-bold tracking-tight">
            <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", accents.title)}>
              {resolvedTitle}
            </span>
          </CardTitle>
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Dismiss welcome checklist"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <ol className="space-y-3">
          {checklistSteps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition hover:border-slate-200 hover:bg-white"
            >
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {index + 1}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", accents.highlight)} />
                  <h3 className="text-sm font-semibold text-slate-800">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.action && (
                  <Link
                    href={step.action.href}
                    className={cn(
                      "inline-flex items-center text-sm font-medium transition hover:underline",
                      accents.highlight
                    )}
                  >
                    {step.action.label}
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className={cn("h-4 w-4", accents.highlight)} />
            <span>Complete each step to unlock the full StatJam experience.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Hide
            </Button>
            <Button size="sm" onClick={handleDismiss} className="bg-slate-900 text-white hover:bg-slate-800">
              Got it, let's go
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


