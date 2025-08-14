import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Video, Play } from "lucide-react";

export function OrganizerLiveStream() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Stream</h2>
          <p className="text-muted-foreground">Manage live streaming for your tournaments</p>
        </div>
        <Button className="gap-2">
          <Play className="w-4 h-4" />
          Start Stream
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <CardTitle>Live Streaming</CardTitle>
          </div>
          <CardDescription>Live streaming integration coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">Live Streaming</h3>
            <p className="text-sm text-muted-foreground mb-4">Advanced live streaming features are being integrated</p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
