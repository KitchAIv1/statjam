import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuideSection as GuideSectionType } from '@/lib/types/guide';

interface GuideSectionProps {
  section: GuideSectionType;
}

export function GuideSection({ section }: GuideSectionProps) {
  const IconComponent = section.icon;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {section.content}
      </CardContent>
    </Card>
  );
}
