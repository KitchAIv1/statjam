import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamPublicProfile } from '@/lib/services/publicTeamService';
import { PublicTeamPageShell } from '@/components/team/PublicTeamPageShell';

export const dynamic = 'force-dynamic';

interface TeamPageProps {
  params: Promise<{ slug: string; teamId: string }>;
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { slug, teamId } = await params;
  const profile = await getTeamPublicProfile(teamId, slug);

  if (!profile) {
    return {
      title: 'Team Not Found • StatJam',
    };
  }

  const title = `${profile.name} • ${profile.tournamentName || 'StatJam'}`;
  const description = profile.division
    ? `${profile.name} — ${profile.division} team in ${profile.tournamentName}`
    : `${profile.name} on StatJam`;

  const images = profile.logoUrl
    ? [{ url: profile.logoUrl, alt: `${profile.name} logo` }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function PublicTeamPage({ params }: TeamPageProps) {
  const { slug, teamId } = await params;

  const profile = await getTeamPublicProfile(teamId, slug);
  if (!profile) {
    notFound();
  }

  return (
    <PublicTeamPageShell
      tournamentId={slug}
      teamId={teamId}
      tournamentSlug={slug}
    />
  );
}
