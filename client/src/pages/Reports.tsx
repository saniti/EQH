import { FileText, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Reports() {
  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="page-header">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Health & Performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Performance Report</CardTitle>
                <CardDescription>
                  Analyze training performance trends over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed analytics on heart rate, speed, temperature, and other performance metrics across all training sessions.
            </p>
            <Button>Generate Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Injury Risk Report</CardTitle>
                <CardDescription>
                  Review injury patterns and risk assessments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive analysis of injury records, risk levels, and patterns to help prevent future injuries.
            </p>
            <Button variant="destructive">Generate Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Health Summary</CardTitle>
                <CardDescription>
                  Overall health status across all horses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get a comprehensive overview of health metrics, veterinary visits, and upcoming care schedules.
            </p>
            <Button variant="outline">Generate Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle>Custom Report</CardTitle>
                <CardDescription>
                  Build your own custom report
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create custom reports with specific date ranges, horses, and metrics tailored to your needs.
            </p>
            <Button variant="outline">Create Custom Report</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Your recently generated reports will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No reports generated yet</p>
            <p className="text-sm mt-1">
              Generate your first report using one of the options above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

