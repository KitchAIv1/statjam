"use client";

import { useState } from "react";
import { LifeBuoy, MessageCircle, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import { type UserRole } from "@/components/auth/RoleSelector";
import Link from "next/link";

export interface HelpFAQ {
  question: string;
  answer: string;
  href?: string;
  hrefLabel?: string;
}

interface HelpPanelProps {
  role: UserRole;
  faqs: HelpFAQ[];
  checklistLink?: string;
  onChecklistOpen?: () => void;
  supportHref?: string;
  className?: string;
}

const roleAccentClasses: Record<UserRole, string> = {
  coach: "bg-blue-600 hover:bg-blue-500",
  organizer: "bg-orange-600 hover:bg-orange-500",
  stat_admin: "bg-purple-600 hover:bg-purple-500",
  player: "bg-emerald-600 hover:bg-emerald-500"
};

const panelTitles: Record<UserRole, string> = {
  coach: "Coach Help Center",
  organizer: "Organizer Help Center",
  stat_admin: "Stat Admin Help Center",
  player: "Player Help Center"
};

export function HelpPanel({
  role,
  faqs,
  checklistLink,
  onChecklistOpen,
  supportHref = "mailto:support@statjam.net",
  className
}: HelpPanelProps) {
  const [open, setOpen] = useState(false);
  const panelTitle = panelTitles[role] ?? "Help Center";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "fixed bottom-8 right-24 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-xl transition",
            roleAccentClasses[role],
            className
          )}
        >
          <LifeBuoy className="h-4 w-4" />
          Need Help?
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            {panelTitle}
          </SheetTitle>
          <SheetDescription>
            Get quick answers or reach out to support. Close the panel to return to tracking.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-full flex-col gap-6 overflow-y-auto pb-10 pr-2">
          {(checklistLink || onChecklistOpen) && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-semibold">Need a refresher?</p>
              <p className="mt-1">Open the quick-start checklist any time to review the essentials.</p>
              {onChecklistOpen ? (
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  onClick={() => {
                    onChecklistOpen();
                    setOpen(false);
                  }}
                >
                  View Checklist
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <Link
                  href={checklistLink ?? "#"}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View Checklist
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900">{faq.question}</h4>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                  {faq.href && (
                    <Link
                      href={faq.href}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      {faq.hrefLabel ?? "Learn more"}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Need more help?</h3>
            <p className="mt-1 text-sm text-slate-600">
              Reach out to our support team and we’ll get back to you quickly.
            </p>
            <Button
              className="mt-3"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(supportHref, "_blank", "noopener");
                }
                setOpen(false);
              }}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


