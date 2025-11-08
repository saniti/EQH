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
  const [isMetric, setIsMetric] = useState(true);

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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate summary metrics from performance data
  const calculateMetrics = () => {
    if (!performanceData) return null;

    // Get duration in seconds
    const duration = performanceData.duration || 0;

    // Calculate metrics from sectional stats
    const stats = performanceData.intervals?.stats || [];
    
    // Average heart rate from sectional data
    let avgHeartRate = performanceData.avgHeartRate || 0;
    if (stats.length > 0) {
      const hrValues = stats.map((s: any) => s.hr.avg).filter((hr: number) => hr > 0);
      if (hrValues.length > 0) {
        avgHeartRate = Math.round(hrValues.reduce((a: number, b: number) => a + b, 0) / hrValues.length);
      }
    }

    // Max heart rate
    let maxHeartRate = performanceData.maxHeartRate || 0;
    if (stats.length > 0) {
      const hrMaxValues = stats.map((s: any) => s.hr.max);
      maxHeartRate = Math.max(...hrMaxValues);
    }

    // Average and max speed from sectional data
    let avgSpeed = performanceData.avgSpeed || 0;
    let maxSpeed = performanceData.maxSpeed || 0;
    if (stats.length > 0) {
      const speedValues = stats.map((s: any) => s.speed.avg);
      avgSpeed = speedValues.reduce((a: number, b: number) => a + b, 0) / speedValues.length;
      const speedMaxValues = stats.map((s: any) => s.speed.max);
      maxSpeed = Math.max(...speedMaxValues);
    }

    // Get distance and temperature
    const distance = performanceData.distance || 0;
    const avgTemperature = performanceData.avgTemperature || 0;
    const maxTemperature = performanceData.maxTemperature || 0;

    return {
      duration,
      avgHeartRate,
      maxHeartRate,
      avgSpeed: parseFloat(avgSpeed.toFixed(2)),
      maxSpeed: parseFloat(maxSpeed.toFixed(2)),
      distance,
      avgTemperature,
      maxTemperature,
    };
  };

  const handleBack = () => {
    if (horseIdFromUrl) {
      setLocation(`/sessions?horseId=${horseIdFromUrl}`);
    } else {
      setLocation('/sessions');
    }
  };

  const convertDistance = (meters: number) => {
    return isMetric ? meters : meters * 3.28084;
  };

  const convertSpeed = (kmh: number) => {
    return isMetric ? kmh : kmh * 0.621371;
  };

  const getDistanceUnit = () => isMetric ? 'm' : 'ft';
  const getSpeedUnit = () => isMetric ? 'km/h' : 'mph';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Button onClick={handleBack} className="mt-4">Back</Button>
      </div>
    );
  }

  const performanceData = (session as any).performanceData || {};
  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Session Details</h1>
          <p className="text-muted-foreground">
            {(session as any).horse?.name} • {new Date((session as any).sessionDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  {metrics ? formatDuration(metrics.duration) : "—"}
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
                  {metrics?.avgHeartRate || "—"}
                  {metrics?.avgHeartRate && <span className="text-sm font-normal text-muted-foreground ml-1">bpm</span>}
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
                  {metrics?.avgTemperature || "—"}
                  {metrics?.avgTemperature && <span className="text-sm font-normal text-muted-foreground ml-1">°C</span>}
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
          {/* Unit Toggle */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMetric(!isMetric)}
              className="gap-2"
            >
              {isMetric ? '📏 Metric' : '📏 Imperial'}
            </Button>
          </div>

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
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {new Date((session as any).sessionDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Track</p>
                    <p className="font-medium">{(session as any).track?.name || "—"}</p>
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
                    {metrics?.avgSpeed ? `${metrics.avgSpeed} km/h` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Speed</span>
                  <span className="text-sm font-medium">
                    {metrics?.maxSpeed ? `${metrics.maxSpeed} km/h` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Distance Covered</span>
                  <span className="text-sm font-medium">
                    {metrics?.distance ? `${(metrics.distance / 1000).toFixed(2)} km` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Heart Rate</span>
                  <span className="text-sm font-medium">
                    {metrics?.maxHeartRate ? `${metrics.maxHeartRate} bpm` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Temperature</span>
                  <span className="text-sm font-medium">
                    {metrics?.maxTemperature ? `${metrics.maxTemperature}°C` : "—"}
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
                <CardTitle className="flex items-center justify-between">
                  <span>Speed & Heart Rate Over Time</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="text-xs text-primary hover:underline">↑ Top</a>
                </CardTitle>
                <CardDescription>Real-time performance metrics during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.time / 1000),
                      y: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => convertSpeed(d.speed)),
                      name: `Speed (${getSpeedUnit()})`,
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
                    autosize: true,
                    hovermode: 'x unified',
                    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', yanchor: 'top' },
                    xaxis: {
                      title: 'Time (seconds)',
                    },
                    yaxis: {
                      title: `Speed (${getSpeedUnit()})`,
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
                  style={{ width: '100%', height: '600px' }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Stride Frequency and Length Chart */}
          {performanceData.intervals?.stats && performanceData.intervals.stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stride Analysis</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="text-xs text-primary hover:underline">↑ Top</a>
                </CardTitle>
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
                      x: performanceData.intervals.stats.map((d: any) => convertDistance(d.travel)),
                      y: performanceData.intervals.stats.map((d: any) => convertDistance(d.stride.length)),
                      name: 'Stride Length (m)',
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#06b6d4', width: 2 },
                      yaxis: 'y2',
                    },
                  ]}
                  layout={{
                    title: '',
                    autosize: true,
                    hovermode: 'x unified',
                    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', yanchor: 'top' },
                    xaxis: {
                      title:  `Distance (${getDistanceUnit()})`,
                    },
                    yaxis: {
                      title: 'Stride Frequency (Hz)',
                      titlefont: { color: '#8b5cf6' },
                      tickfont: { color: '#8b5cf6' },
                    },
                    yaxis2: {
                      title: `Stride Length (${getDistanceUnit()})`,
                      titlefont: { color: '#06b6d4' },
                      tickfont: { color: '#06b6d4' },
                      overlaying: 'y',
                      side: 'right',
                    },
                    margin: { l: 60, r: 60, t: 40, b: 40 },
                  }}
                  style={{ width: '100%', height: '600px' }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Speed Zones Distribution */}
          {performanceData.intervals?.speedZoneDistance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Speed Zone Distribution</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="text-xs text-primary hover:underline">↑ Top</a>
                </CardTitle>
                <CardDescription>Distance covered in each gait zone</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: ['Walk', 'Canter', 'Pace', 'Slow Gallop', 'Fast Gallop', 'Very Fast Gallop'],
                      y: [
                        convertDistance(performanceData.intervals.speedZoneDistance.walk),
                        convertDistance(performanceData.intervals.speedZoneDistance.canter),
                        convertDistance(performanceData.intervals.speedZoneDistance.pace),
                        convertDistance(performanceData.intervals.speedZoneDistance.slowGallop),
                        convertDistance(performanceData.intervals.speedZoneDistance.fastGallop),
                        convertDistance(performanceData.intervals.speedZoneDistance.veryFastGallop),
                      ],
                      type: 'bar',
                      marker: {
                        color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                      },
                    },
                  ]}
                  layout={{
                    title: '',
                    autosize: true,
                    xaxis: {
                      title: 'Gait Zone',
                    },
                    yaxis: {
                      title: `Distance (${getDistanceUnit()})`,
                    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', yanchor: 'top' },
                    },
                    margin: { l: 60, r: 40, t: 40, b: 60 },
                  }}
                  style={{ width: '100%', height: '500px' }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}

          {/* Interval Speed Progression */}
          {performanceData.intervals?.stats && performanceData.intervals.stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Speed Progression by Interval</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="text-xs text-primary hover:underline">↑ Top</a>
                </CardTitle>
                <CardDescription>Average speed throughout the session intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x:  performanceData.intervals.stats.map((d: any) => convertDistance(d.travel)),
                      y: performanceData.intervals.stats.map((d: any) => convertSpeed(d.speed.avg)),
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
                    autosize: true,
                    hovermode: 'x unified',
                    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', yanchor: 'top' },
                    xaxis: {
                      title:  `Distance (${getDistanceUnit()})`,
                    },
                    yaxis: {
                      title: `Average Speed (${getSpeedUnit()})`,
                    },
                    margin: { l: 60, r: 40, t: 40, b: 40 },
                  }}
                  style={{ width: '100%', height: '500px' }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}


          {/* Heart Rate vs Velocity Chart */}
          {performanceData.speedHeartRate?.speedHeartRateChart && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Heart Rate vs Velocity</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} className="text-xs text-primary hover:underline">↑ Top</a>
                </CardTitle>
                <CardDescription>Relationship between speed and heart rate during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[
                    {
                      x: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => convertSpeed(d.speed)),
                      y: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.hr),
                      mode: 'markers',
                      type: 'scatter',
                      marker: {
                        color: performanceData.speedHeartRate.speedHeartRateChart.map((d: any) => d.time / 1000),
                        colorscale: 'Viridis',
                        size: 5,
                        colorbar: {
                          title: 'Time (s)',
                        },
                      },
                      name: 'HR vs Speed',
                    },
                  ]}
                  layout={{
                    title: '',
                    autosize: true,
                    hovermode: 'closest',
                    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', yanchor: 'top' },
                    xaxis: {
                      title: `Speed (${getSpeedUnit()})`,
                    },
                    yaxis: {
                      title: 'Heart Rate (bpm)',
                    },
                    margin: { l: 60, r: 60, t: 40, b: 40 },
                  }}
                  style={{ width: '100%', height: '600px' }}
                  config={{ responsive: true }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          {performanceData.intervals?.stats && performanceData.intervals.stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interval Statistics</CardTitle>
                <CardDescription>Detailed performance data for each session interval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-semibold">Sectional</th>
                        <th className="text-left py-2 px-3 font-semibold">Distance ({isMetric ? "m" : "ft"})</th>
                        <th className="text-left py-2 px-3 font-semibold">Time (s)</th>
                        <th className="text-left py-2 px-3 font-semibold">Distance ({isMetric ? "m" : "ft"}) </th>
                        <th className="text-left py-2 px-3 font-semibold">Speed Min</th>
                        <th className="text-left py-2 px-3 font-semibold">Speed Avg</th>
                        <th className="text-left py-2 px-3 font-semibold">Speed Max</th>
                        <th className="text-left py-2 px-3 font-semibold">Stride Freq</th>
                        <th className="text-left py-2 px-3 font-semibold">Stride Len ({isMetric ? "m" : "ft"})</th>
                        <th className="text-left py-2 px-3 font-semibold">HR Min</th>
                        <th className="text-left py-2 px-3 font-semibold">HR Avg</th>
                        <th className="text-left py-2 px-3 font-semibold">HR Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.intervals.stats.map((stat: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-blue-50/40' : 'bg-blue-100/30'}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3">{(stat.timeSplit / 1000).toFixed(1)}</td>
                          <td className="py-2 px-3">{convertDistance(stat.travel).toFixed(0)}</td>
                          <td className="py-2 px-3">{convertSpeed(stat.speed.min).toFixed(2)}</td>
                          <td className="py-2 px-3">{convertSpeed(stat.speed.avg).toFixed(2)}</td>
                          <td className="py-2 px-3">{convertSpeed(stat.speed.max).toFixed(2)}</td>
                          <td className="py-2 px-3">{stat.stride.frequency.toFixed(2)}</td>
                          <td className="py-2 px-3">{convertDistance(stat.stride.length).toFixed(2)}</td>
                          <td className="py-2 px-3">{stat.hr.min}</td>
                          <td className="py-2 px-3">{stat.hr.avg}</td>
                          <td className="py-2 px-3">{stat.hr.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
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

