import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState } from "react";
import Plot from "react-plotly.js";

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isMetric, setIsMetric] = useState(true);

  const { data: session, isLoading, error } = trpc.sessions.get.useQuery(
    { id: Number(sessionId) },
    { enabled: !!sessionId }
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
    title: "Performance Metrics by Distance",
    xaxis: { title: "Distance (m)" },
    yaxis: { title: "Velocity (m/s)", titlefont: { color: "#1f77b4" } },
    yaxis2: { title: "Stride Length (m)", titlefont: { color: "#ff7f0e" }, overlaying: "y", side: "left" },
    yaxis3: { title: "Stride Freq (strides/s)", titlefont: { color: "#2ca02c" }, overlaying: "y", side: "right" },
    hovermode: "x unified",
    legend: { x: 0.5, y: -0.15, xanchor: "center", yanchor: "top", orientation: "h" },
    autosize: true,
    margin: { b: 100 },
  };

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Session Details</h1>
        <p className="text-muted-foreground">
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
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMetric(!isMetric)}
              className="gap-2"
            >
              {isMetric ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isMetric ? "📏 Metric" : "📏 Imperial"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayDistance}</div>
                <p className="text-xs text-green-100">{distanceUnit}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{durationMinutes}:{durationSeconds.toString().padStart(2, '0')}</div>
                <p className="text-xs text-green-100">minutes</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayMaxVel}</div>
                <p className="text-xs text-green-100">{velUnit}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayAvgVel}</div>
                <p className="text-xs text-green-100">{velUnit}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max Stride Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayMaxStrideLen}</div>
                <p className="text-xs text-green-100">{strideLenUnit}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max Stride Freq</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{maxStrideFreq.toFixed(2)}</div>
                <p className="text-xs text-green-100">strides/sec</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graphs" className="space-y-6">
          <div style={{ width: "100%", height: "600px" }}>
            <Plot
              data={[velocityTrace, strideLengthTrace, strideFreqTrace]}
              layout={layout}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-600 text-white">
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
                {sectionals.map((s: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-blue-50/40" : "bg-blue-100/30"}>
                    <td className="px-4 py-2">{s.sectional}</td>
                    <td className="px-4 py-2">{s.distance}</td>
                    <td className="px-4 py-2">{isMetric ? s.speed?.avg?.toFixed(2) : (s.speed?.avg * 3.6)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{isMetric ? s.speed?.max?.toFixed(2) : (s.speed?.max * 3.6)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{isMetric ? s.stride?.length?.toFixed(2) : (s.stride?.length * 3.28084)?.toFixed(2)}</td>
                    <td className="px-4 py-2">{s.stride?.frequency?.toFixed(2)}</td>
                    <td className="px-4 py-2">{s.gait || "N/A"}</td>
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
