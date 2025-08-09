import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Clock, Eye, Play } from "lucide-react";

interface LiveTournamentSectionProps {
  onWatchLive?: () => void;
  onViewTournament?: () => void;
}

export function LiveTournamentSection({ onWatchLive, onViewTournament }: LiveTournamentSectionProps) {
  // Mock data for different tournaments
  const tournaments = [
    {
      name: "Summer League Championship",
      status: "LIVE",
      statusColor: "bg-red-500",
      teams: [
        { name: "Lightning Bolts", score: 82, logo: "⚡" },
        { name: "Thunder Hawks", score: 78, logo: "🦅" }
      ],
      time: "4th 2:34",
      viewers: "1,247"
    },
    {
      name: "City Basketball League",
      status: "LIVE", 
      statusColor: "bg-red-500",
      teams: [
        { name: "Court Crushers", score: 58, logo: "🏀" },
        { name: "Street Kings", score: 65, logo: "👑" }
      ],
      time: "3rd 8:12",
      viewers: "892"
    },
    {
      name: "Regional Championships",
      status: "FINAL",
      statusColor: "bg-gray-500",
      teams: [
        { name: "Ice Wolves", score: 98, logo: "🐺" },
        { name: "Fire Dragons", score: 103, logo: "🐲" }
      ],
      time: "Final",
      viewers: "2,156"
    },
    {
      name: "Youth Development League", 
      status: "LIVE",
      statusColor: "bg-red-500",
      teams: [
        { name: "Future Legends", score: 41, logo: "⭐" },
        { name: "Rising Stars", score: 45, logo: "🌟" }
      ],
      time: "2nd 4:55",
      viewers: "623"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-orange-500">Live</span> Tournament Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow real-time games from tournaments around the world. See how StatJam 
            tracks every play, score, and statistic as it happens.
          </p>
        </div>

        {/* Tournament Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {tournaments.map((tournament, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow border border-gray-200">
              {/* Tournament Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {tournament.name}
                </h3>
                <Badge className={`${tournament.statusColor} text-white text-xs px-2 py-1`}>
                  {tournament.status}
                </Badge>
              </div>

              {/* Teams and Scores */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {tournament.teams[0].logo}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {tournament.teams[0].name}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {tournament.teams[0].score}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {tournament.teams[1].logo}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {tournament.teams[1].name}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {tournament.teams[1].score}
                  </div>
                </div>
              </div>

              {/* Time and Viewers */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{tournament.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{tournament.viewers}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={onWatchLive}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={tournament.status === "FINAL"}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {tournament.status === "FINAL" ? "View Highlights" : "Watch Live"}
                </Button>
                <Button 
                  onClick={onViewTournament}
                  variant="outline"
                  className="w-full"
                >
                  View Tournament
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Experience every moment as it unfolds across multiple courts simultaneously.
          </p>
        </div>
      </div>
    </section>
  );
}