import { Metadata } from 'next';
import { TournamentsListPage } from '@/components/tournament/TournamentsListPage';

export const metadata: Metadata = {
  title: 'Tournaments • StatJam',
  description: 'Browse and discover live basketball tournaments',
};

export default function TournamentsPage() {
  return <TournamentsListPage />;
}

