import { Activity, ArrowLeft, Calendar, Clock, Heart, MapPin, Thermometer, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams, useSearch } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Plot from 'react-plotly.js';

export default function SessionDetail() {
  const params = useParams();
  const sessionId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const horseIdFromUrl = new URLSearchParams(searchParams).get('horseId');
  const [activeTab, setActiveTab] = useState("summary");

  const { data: session, isLoading } = trpc.sessions.get.useQuery(
    { id: sessionId! },
    { enabled: !!sessionId }
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleBack = () => {
    if (horseIdFromUrl) {
      setLocation(`/sessions?horseId=${horseIdFromUrl}`);
    } else {
      setLocation('/sessions');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">Session not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceData = session.performanceData as any || {};
  const horseName = (session as any).horseName || "Unknown Horse";
  const trackName = (session as any).trackName || "Unknown Track";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Details</h1>
          <p className="text-muted-foreground mt-1">
            {horseName} • {new Date(session.sessionDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.duration ? formatDuration(performanceData.duration) : "—"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.avgHeartRate || "—"}
                  {performanceData.avgHeartRate && <span className="text-sm font-normal text-muted-foreground ml-1">bpm</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.avgTemperature || "—"}
                  {performanceData.avgTemperature && <span className="text-sm font-normal text-muted-foreground ml-1">°C</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Injury Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {session.injuryRisk ? (
                  <Badge variant={getRiskColor(session.injuryRisk)} className="text-base px-3 py-1">
                    {session.injuryRisk}
                  </Badge>
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.sessionDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Track</p>
                    <p className="text-sm text-muted-foreground">{trackName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Session Type</p>
                    <p className="text-sm text-muted-foreground">
                      {(session as any).sessionType || "Training"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Speed</span>
                  <span className="text-sm font-medium">
                    {performanceData.avgSpeed ? `${performanceData.avgSpeed} km/h` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Speed</span>
                  <span className="text-sm font-medium">
                    {performanceData.maxSpeed ? `${performanceData.maxSpeed} km/h` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Distance Covered</span>
                  <span className="text-sm font-medium">
                    {performanceData.distance ? `${performanceData.distance} km` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Heart Rate</span>
                  <span className="text-sm font-medium">
                    {performanceData.maxHeartRate ? `${performanceData.maxHeartRate} bpm` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Temperature</span>
                  <span className="text-sm font-medium">
                    {performanceData.maxTemperature ? `${performanceData.maxTemperature}°C` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {(session as any).notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {(session as any).notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Graphs Tab */}
        <TabsContent value="graphs" className="space-y-6">
          {/* Speed and Heart Rate Chart */}
          {performanceData.speedHeartRate?.speedHeartRateChart && (
            <Card>
              <CardHeader>
                <CardTitle>Speed & Heart Rate Over Time</CardTitle>
                <CardDescription>Real-time performance metrics during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.time / 1000),
                      y: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.speed),
                      name: 'Speed (km/h)',
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: '#3b82f6', width: 2 },
                      yaxis: 'y1',
                    },
                    {
                      x: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.time / 1000),
                      y: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.hr),
                      name: 'Heart Rate (bpm)',
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: '#ef4444', width: 2 },
                      yaxis: 'y2',
                    },
                  ]}
                  layout={{
                    title: '',
                    height: 400,
                    hovermode: 'x unified',
                    xaxis: {
                      title: 'Time (seconds)',
                    },
                    yaxis: {
                      title: 'Speed (km/h)',
                      titlefont: { color: '#3b82f6' },
                      tickfont: { color: '#3b82f6' },
                    },
                    yaxis2: {
                      title: 'Heart Rate (bpm)',
                      titlefont: { color: '#ef4444' },
                      tickfont: { color: '#ef4444' },
                      overlaying: 'y',
                      side: 'right',
                    },
                    margin: { l: 60, r: 60, t: 40, b: 40 },
                  }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Stride Frequency and Length Chart */}
          {performanceData.intervals?.stats && performanceData.intervals.stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Stride Analysis</CardTitle>
                <CardDescription>Stride frequency and length throughout the session</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: performanceData.intervals.stats.map((d: any, i: number) => i),
                      y: performanceData.intervals.stats.map((d: any) => d.stride.frequency),
                      name: 'Stride Frequency (Hz)',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#8b5cf6', width: 2 },
                      yaxis: 'y1',
                    },
                    {
                      x: performanceData.intervals.stats.map((d: any, i: number) => i),
                      y: performanceData.intervals.stats.map((d: any) => d.stride.length),
                      name: 'Stride Length (m)',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#06b6d4', width: 2 },
                      yaxis: 'y2',
                    },
                  ]}
                  layout={{
                    title: '',
                    height: 400,
                    hovermode: 'x unified',
                    xaxis: {
                      title: 'Interval Number',
                    },
                    yaxis: {
                      title: 'Stride Frequency (Hz)',
                      titlefont: { color: '#8b5cf6' },
                      tickfont: { color: '#8b5cf6' },
                    },
                    yaxis2: {
                      title: 'Stride Length (m)',
                      titlefont: { color: '#06b6d4' },
                      tickfont: { color: '#06b6d4' },
                      overlaying: 'y',
                      side: 'right',
                    },
                    margin: { l: 60, r: 60, t: 40, b: 40 },
                  }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Speed Zones Distribution */}
          {performanceData.intervals?.speedZoneDistance && (
            <Card>
              <CardHeader>
                <CardTitle>Speed Zone Distribution</CardTitle>
                <CardDescription>Distance covered in each gait zone</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: ['Walk', 'Canter', 'Pace', 'Slow Gallop', 'Fast Gallop', 'Very Fast Gallop'],
                      y: [
                        performanceData.intervals.speedZoneDistance.walk,
                        performanceData.intervals.speedZoneDistance.canter,
                        performanceData.intervals.speedZoneDistance.pace,
                        performanceData.intervals.speedZoneDistance.slowGallop,
                        performanceData.intervals.speedZoneDistance.fastGallop,
                        performanceData.intervals.speedZoneDistance.veryFastGallop,
                      ],
                      type: 'bar',
                      marker: {
                        color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                      },
                    },
                  ]}
                  layout={{
                    title: '',
                    height: 400,
                    xaxis: {
                      title: 'Gait Zone',
                    },
                    yaxis: {
                      title: 'Distance (m)',
                    },
                    margin: { l: 60, r: 40, t: 40, b: 60 },
                  }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Interval Speed Progression */}
          {performanceData.intervals?.stats && performanceData.intervals.stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Speed Progression by Interval</CardTitle>
                <CardDescription>Average speed throughout the session intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: performanceData.intervals.stats.map((d: any, i: number) => i),
                      y: performanceData.intervals.stats.map((d: any) => d.speed.avg),
                      name: 'Average Speed',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#3b82f6', width: 2 },
                      fill: 'tozeroy',
                      fillcolor: 'rgba(59, 130, 246, 0.1)',
                    },
                  ]}
                  layout={{
                    title: '',
                    height: 400,
                    hovermode: 'x unified',
                    xaxis: {
                      title: 'Interval Number',
                    },
                    yaxis: {
                      title: 'Average Speed (km/h)',
                    },
                    margin: { l: 60, r: 40, t: 40, b: 40 },
                  }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>Detailed session data points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="text-lg font-semibold">
                      {performanceData.duration ? formatDuration(performanceData.duration) : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Heart Rate</p>
                    <p className="text-lg font-semibold">
                      {performanceData.avgHeartRate ? `${performanceData.avgHeartRate} bpm` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Max Heart Rate</p>
                    <p className="text-lg font-semibold">
                      {performanceData.maxHeartRate ? `${performanceData.maxHeartRate} bpm` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Temperature</p>
                    <p className="text-lg font-semibold">
                      {performanceData.avgTemperature ? `${performanceData.avgTemperature}°C` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Max Temperature</p>
                    <p className="text-lg font-semibold">
                      {performanceData.maxTemperature ? `${performanceData.maxTemperature}°C` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Speed</p>
                    <p className="text-lg font-semibold">
                      {performanceData.avgSpeed ? `${performanceData.avgSpeed} km/h` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Max Speed</p>
                    <p className="text-lg font-semibold">
                      {performanceData.maxSpeed ? `${performanceData.maxSpeed} km/h` : "—"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Distance Covered</p>
                    <p className="text-lg font-semibold">
                      {performanceData.distance ? `${performanceData.distance} km` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Insights</CardTitle>
              <CardDescription>Analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Insights and analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

