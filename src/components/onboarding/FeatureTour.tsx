"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export interface FeatureTourStep {
  target: string;
  title: string;
  description: string;
  media?: ReactNode;
}

interface FeatureTourProps {
  tourId: string;
  steps: FeatureTourStep[];
  shouldStart?: boolean;
  storageKey?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const HIGHLIGHT_PADDING = 12;

const ensureRectWithinViewport = (rect: DOMRect): HighlightRect => {
  const top = Math.max(rect.top - HIGHLIGHT_PADDING, 8);
  const left = Math.max(rect.left - HIGHLIGHT_PADDING, 8);
  const width = rect.width + HIGHLIGHT_PADDING * 2;
  const height = rect.height + HIGHLIGHT_PADDING * 2;

  return {
    top,
    left,
    width: Math.min(width, window.innerWidth - left - 8),
    height: Math.min(height, window.innerHeight - top - 8)
  };
};

export function FeatureTour({
  tourId,
  steps,
  shouldStart = true,
  storageKey,
  onComplete,
  onSkip
}: FeatureTourProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const key = storageKey ?? `onboarding-tour-${tourId}-completed`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !shouldStart || steps.length === 0) {
      return;
    }

    const completed = typeof window !== "undefined" && window.localStorage.getItem(key) === "true";
    if (!completed) {
      setActive(true);
      setStepIndex(0);
    }
  }, [hydrated, key, shouldStart, steps.length]);

  const updateHighlight = useCallback(() => {
    if (!active) {
      return;
    }
    const step = steps[stepIndex];
    if (!step) {
      return;
    }
    const element = document.querySelector(step.target) as HTMLElement | null;
    if (!element) {
      setHighlightRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setHighlightRect(ensureRectWithinViewport(rect));
  }, [active, stepIndex, steps]);

  useEffect(() => {
    if (!active) {
      return;
    }

    updateHighlight();

    const handleResize = () => updateHighlight();
    window.addEventListener("resize", handleResize);
    document.addEventListener("scroll", handleResize, true);

    const interval = window.setInterval(updateHighlight, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("scroll", handleResize, true);
      window.clearInterval(interval);
    };
  }, [active, updateHighlight]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const step = steps[stepIndex];
    const element = step ? (document.querySelector(step.target) as HTMLElement | null) : null;
    if (element) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [active, stepIndex, steps]);

  const handleClose = useCallback(
    (completed: boolean) => {
      setActive(false);
      if (completed && typeof window !== "undefined") {
        window.localStorage.setItem(key, "true");
      }
      if (completed) {
        onComplete?.();
      } else {
        onSkip?.();
      }
    },
    [key, onComplete, onSkip]
  );

  const totalSteps = steps.length;
  const currentStep = active ? steps[stepIndex] : undefined;

  const tooltipPosition = useMemo(() => {
    if (!highlightRect) {
      return {
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - 160
      };
    }

    const preferredTop = highlightRect.top + highlightRect.height + 16;
    const fitsBelow = preferredTop + 200 < window.innerHeight;
    const top = fitsBelow ? preferredTop : Math.max(highlightRect.top - 220, 16);

    let left = highlightRect.left + highlightRect.width / 2 - 160;
    left = Math.max(16, Math.min(left, window.innerWidth - 320 - 16));

    return { top, left };
  }, [highlightRect]);

  if (!hydrated || !active || !currentStep) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {highlightRect ? (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-200"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.65), 0 0 0 2px rgba(59,130,246,0.8)",
            borderRadius: "14px"
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0" />
      )}

      <div
        className="absolute w-[min(90vw,320px)] rounded-xl bg-white p-5 shadow-2xl"
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <button
            type="button"
            className="text-slate-400 transition hover:text-slate-600"
            onClick={() => handleClose(false)}
          >
            Skip tour
          </button>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-slate-900">{currentStep.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{currentStep.description}</p>

        {currentStep.media && <div className="mt-3">{currentStep.media}</div>}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>{highlightRect ? "" : "Element not visible yet"}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (stepIndex + 1 < totalSteps) {
                  setStepIndex((index) => Math.min(index + 1, totalSteps - 1));
                } else {
                  handleClose(true);
                }
              }}
            >
              {stepIndex + 1 === totalSteps ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


