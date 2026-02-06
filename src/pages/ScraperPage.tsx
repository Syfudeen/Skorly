import { motion } from "framer-motion";
import { RefreshCw, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScraperPage = () => {
  const [isScrapingRunning, setIsScrapingRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkScraperStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/status`);
      const result = await response.json();
      setIsScrapingRunning(result.data.isRunning);
    } catch (error) {
      console.error('Failed to check scraper status:', error);
    }
  };

  useEffect(() => {
    checkScraperStatus();
    // Check status every 10 seconds
    const interval = setInterval(checkScraperStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerScrape = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/scraper/trigger`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to trigger scraping');
      }

      const result = await response.json();
      toast.success('Weekly scraping started!', {
        description: 'This will take a few minutes. Check back soon for updated data.',
      });

      setIsScrapingRunning(true);
      
      // Check status after 5 seconds
      setTimeout(checkScraperStatus, 5000);
    } catch (error) {
      toast.error('Failed to start scraping', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Weekly Data Scraper
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatically scrape fresh data from coding platforms every week
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isScrapingRunning ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                      Scraping in Progress
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      Scraper Ready
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isScrapingRunning
                    ? 'Currently fetching data from coding platforms...'
                    : 'Scheduled to run every Sunday at 11:59 PM'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleTriggerScrape}
                  disabled={loading || isScrapingRunning}
                  className="w-full"
                  size="lg"
                >
                  {loading || isScrapingRunning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Trigger Manual Scrape
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Schedule Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Automatic Schedule
                </CardTitle>
                <CardDescription>
                  System automatically scrapes data weekly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Every Sunday</p>
                    <p className="text-sm text-muted-foreground">11:59 PM IST</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>The system will automatically:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Fetch data from all platforms</li>
                    <li>Store weekly snapshots</li>
                    <li>Enable week-to-week comparison</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Automated weekly data collection and comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">Upload Once</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload Excel file with student IDs and platform usernames once
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      2
                    </div>
                    <h3 className="font-semibold">Auto Scrape</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    System automatically scrapes fresh data every Sunday
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      3
                    </div>
                    <h3 className="font-semibold">Compare</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View week-to-week comparisons and track progress over time
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Important Note
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You only need to upload the Excel file once. The system will automatically scrape fresh data every week and store it for comparison. No need to upload multiple times!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ScraperPage;
