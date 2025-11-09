import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState } from "react";
import Plot from "react-plotly.js";
import { useMeasurement } from "@/contexts/MeasurementContext";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isMetric } = useMeasurement();

  const { data: session, isLoading, error } = trpc.sessions.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading session</div>;
  if (!session) return <div className="p-4">Session not found</div>;

  const performanceData = session.performanceData as any;
  const sectionals = performanceData?.intervals?.stats || [];

  // Calculate metrics
  const totalDistance = performanceData?.distance || 0;
  const duration = performanceData?.duration || 0;
  const durationMinutes = Math.floor(duration / 60);
  const durationSeconds = duration % 60;

  const maxVelocity = Math.max(...sectionals.map((s: any) => s.speed?.max || 0));
  const avgVelocity = sectionals.reduce((sum: number, s: any) => sum + (s.speed?.avg || 0), 0) / sectionals.length;
  const maxStrideLength = Math.max(...sectionals.map((s: any) => s.stride?.length || 0));
  const maxStrideFreq = Math.max(...sectionals.map((s: any) => s.stride?.frequency || 0));

  // Unit conversion
  const displayDistance = isMetric ? (totalDistance / 1000).toFixed(2) : ((totalDistance / 1000) * 0.621371).toFixed(2);
  const displayMaxVel = isMetric ? maxVelocity.toFixed(2) : (maxVelocity * 3.6).toFixed(2);
  const displayAvgVel = isMetric ? avgVelocity.toFixed(2) : (avgVelocity * 3.6).toFixed(2);
  const displayMaxStrideLen = isMetric ? maxStrideLength.toFixed(2) : (maxStrideLength * 3.28084).toFixed(2);

  const distanceUnit = isMetric ? "kilometers" : "miles";
  const velUnit = isMetric ? "m/s" : "km/h";
  const strideLenUnit = isMetric ? "meters" : "feet";

  // Prepare graph data
  const graphData = sectionals.map((s: any) => ({
    distance: s.distance,
    velocity: s.speed?.avg || 0,
    strideLength: s.stride?.length || 0,
    strideFreq: s.stride?.frequency || 0,
  }));

  const velocityTrace = {
    x: graphData.map(d => d.distance),
    y: graphData.map(d => isMetric ? d.velocity : d.velocity * 3.6),
    name: "Velocity (m/s)",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#1f77b4", width: 2 },
    yaxis: "y",
  };

  const strideLengthTrace = {
    x: graphData.map(d => d.distance),
    y: graphData.map(d => isMetric ? d.strideLength : d.strideLength * 3.28084),
    name: "Stride Length (m)",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#ff7f0e", width: 2 },
    yaxis: "y2",
  };

  const strideFreqTrace = {
    x: graphData.map(d => d.distance),
    y: graphData.map(d => d.strideFreq),
    name: "Stride Freq (strides/s)",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#2ca02c", width: 2 },
    yaxis: "y3",
  };

  const layout = {
    title: {
      text: "Performance Metrics by Distance",
      font: { size: 18 },
    },
    xaxis: { 
      title: "Distance (m)",
      dtick: 200,
    },
    yaxis: { title: "Velocity (m/s)", titlefont: { color: "#1f77b4" }, zeroline: false },
    yaxis2: { title: "Stride Length (m)", titlefont: { color: "#ff7f0e" }, overlaying: "y", side: "left", zeroline: false },
    yaxis3: { title: "Stride Freq (strides/s)", titlefont: { color: "#2ca02c" }, overlaying: "y", side: "right", zeroline: false },
    hovermode: "x unified",
    legend: { x: 0.5, y: -0.15, xanchor: "center", yanchor: "top", orientation: "h" },
    autosize: true,
    margin: { b: 100, t: 80 },
  };

  // Stride Length and Frequency by Distance
  const strideLengthDistTrace = {
    x: graphData.map(d => d.distance),
    y: graphData.map(d => isMetric ? d.strideLength : d.strideLength * 3.28084),
    name: `Stride Length (${strideLenUnit})`,
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#ff7f0e", width: 2 },
    yaxis: "y",
  };

  const strideFreqDistTrace = {
    x: graphData.map(d => d.distance),
    y: graphData.map(d => d.strideFreq),
    name: "Stride Frequency (strides/s)",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#2ca02c", width: 2 },
    yaxis: "y2",
  };

  const strideLengthVsFreqLayout = {
    title: {
      text: "Stride Length and Frequency by Distance",
      font: { size: 18 },
    },
    xaxis: { 
      title: "Distance (m)",
      dtick: 200,
    },
    yaxis: { title: `Stride Length (${strideLenUnit})`, titlefont: { color: "#ff7f0e" }, zeroline: false },
    yaxis2: { title: "Stride Frequency (strides/s)", titlefont: { color: "#2ca02c" }, overlaying: "y", side: "right", zeroline: false },
    hovermode: "x unified",
    legend: { x: 0.5, y: -0.15, xanchor: "center", yanchor: "top", orientation: "h" },
    autosize: true,
    margin: { b: 100, t: 80 },
  };

  // Time vs Velocity and Heart Rate graph
  const timeData = graphData.map((d, i) => ({
    time: (i * (duration / graphData.length)) / 60,
    velocity: d.velocity,
    heartRate: (session.performanceData?.intervals?.stats?.[i]?.heartRate?.avg || 0),
  }));

  const velocityTimeTrace = {
    x: timeData.map(d => d.time),
    y: timeData.map(d => isMetric ? d.velocity : d.velocity * 3.6),
    name: `Velocity (${velUnit})`,
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#1f77b4", width: 2 },
    yaxis: "y2",
  };

  const heartRateTimeTrace = {
    x: timeData.map(d => d.time),
    y: timeData.map(d => d.heartRate),
    name: "Heart Rate (bpm)",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#d62728", width: 2 },
    yaxis: "y",
  };

  const timeVsMetricsLayout = {
    title: {
      text: "Velocity and Heart Rate over Time",
      font: { size: 18 },
    },
    xaxis: { title: "Time (minutes)" },
    yaxis: { 
      title: "Heart Rate (bpm)", 
      titlefont: { color: "#d62728" },
      zeroline: false,
      rangemode: "nonnegative"
    },
    yaxis2: { title: `Velocity (${velUnit})`, titlefont: { color: "#1f77b4" }, overlaying: "y", side: "right", zeroline: false },
    hovermode: "x unified",
    legend: { x: 0.5, y: -0.15, xanchor: "center", yanchor: "top", orientation: "h" },
    autosize: true,
    margin: { b: 100, t: 80 },
    shapes: [
      { type: "line", x0: 0, x1: 1, xref: "paper", y0: 60, y1: 60, yref: "y", line: { color: "#ccc", width: 1, dash: "dash" } },
      { type: "line", x0: 0, x1: 1, xref: "paper", y0: 100, y1: 100, yref: "y", line: { color: "#ccc", width: 1, dash: "dash" } },
      { type: "line", x0: 0, x1: 1, xref: "paper", y0: 140, y1: 140, yref: "y", line: { color: "#ccc", width: 1, dash: "dash" } },
    ],
  };

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        onClick={() => setLocation('/sessions')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="page-header mb-6">
        <h1 className="text-3xl font-bold">Session Details</h1>
        <p className="text-muted-foreground mt-1">
          {session.horse?.name} • {new Date(session.sessionDate).toLocaleDateString()}
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="data-card data-card-distance">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{displayDistance}</div>
                <p className="text-xs text-muted-foreground">{distanceUnit}</p>
              </CardContent>
            </Card>

            <Card className="data-card data-card-duration">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{durationMinutes}:{durationSeconds.toString().padStart(2, '0')}</div>
                <p className="text-xs text-muted-foreground">minutes</p>
              </CardContent>
            </Card>

            <Card className="data-card data-card-velocity">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{displayMaxVel}</div>
                <p className="text-xs text-muted-foreground">{velUnit}</p>
              </CardContent>
            </Card>

            <Card className="data-card data-card-velocity">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{displayAvgVel}</div>
                <p className="text-xs text-muted-foreground">{velUnit}</p>
              </CardContent>
            </Card>

            <Card className="data-card data-card-stride">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Stride Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{displayMaxStrideLen}</div>
                <p className="text-xs text-muted-foreground">{strideLenUnit}</p>
              </CardContent>
            </Card>

            <Card className="data-card data-card-stride">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Stride Freq</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold data-card-accent">{maxStrideFreq.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">strides/sec</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graphs" className="space-y-6">
          <div className="flex justify-start mb-4">
            <MeasurementToggle />
          </div>
          
          <div style={{ width: "100%", height: "600px" }}>
            <Plot
              data={[velocityTrace, strideLengthTrace, strideFreqTrace]}
              layout={layout}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>

          <div style={{ width: "100%", height: "600px" }}>
            <Plot
              data={[strideLengthDistTrace, strideFreqDistTrace]}
              layout={strideLengthVsFreqLayout}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>

          <div style={{ width: "100%", height: "600px" }}>
            <Plot
              data={[heartRateTimeTrace, velocityTimeTrace]}
              layout={timeVsMetricsLayout}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border">
                <tr>
                  <th className="px-4 py-2 text-left">Sectional</th>
                  <th className="px-4 py-2 text-left">Distance (m)</th>
                  <th className="px-4 py-2 text-left">Avg Vel ({velUnit})</th>
                  <th className="px-4 py-2 text-left">Max Vel ({velUnit})</th>
                  <th className="px-4 py-2 text-left">Stride Len ({strideLenUnit})</th>
                  <th className="px-4 py-2 text-left">Stride Freq</th>
                  <th className="px-4 py-2 text-left">Gait</th>
                </tr>
              </thead>
              <tbody>
                {sectionals.map((s: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-accent/50">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{s.distance}</td>
                    <td className="px-4 py-2">{isMetric ? s.speed?.avg?.toFixed(2) : (s.speed?.avg * 3.6)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{isMetric ? s.speed?.max?.toFixed(2) : (s.speed?.max * 3.6)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{isMetric ? s.stride?.length?.toFixed(2) : (s.stride?.length * 3.28084)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{s.stride?.frequency?.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{s.gait || "Unknown"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Insights and analysis coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MeasurementToggle() {
  const { isMetric, setIsMetric } = useMeasurement();
  
  return (
    <button
      onClick={() => setIsMetric(!isMetric)}
      className="h-10 px-4 flex items-center gap-2 rounded-lg hover:bg-accent/50 transition-colors text-sm font-medium border border-input"
      title={isMetric ? "Switch to Imperial" : "Switch to Metric"}
    >
      <span>{isMetric ? "Metric" : "Imperial"}</span>
    </button>
  );
}

