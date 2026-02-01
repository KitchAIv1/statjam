import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTournamentPageData } from '@/lib/services/tournamentPublicService';
import { TournamentPageShell } from '@/components/tournament/TournamentPageShell';

// Force dynamic rendering for live streaming - ensures fresh stream URL on each request
export const dynamic = 'force-dynamic';

interface TournamentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTournamentPageData(slug);

  if (!data) {
    return {
      title: 'Tournament Not Found • StatJam',
    };
  }

  const { tournament } = data;
  const title = `${tournament.name} • StatJam`;
  const description = tournament.location
    ? `${tournament.name} — ${tournament.location}`
    : `${tournament.name} on StatJam`;

  const images = tournament.logo
    ? [{ url: tournament.logo, alt: `${tournament.name} logo` }]
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

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params;
  const data = await getTournamentPageData(slug);

  if (!data) {
    notFound();
  }

  return <TournamentPageShell data={data} />;
}
