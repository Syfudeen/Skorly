import { motion } from "framer-motion";
import { Award, AlertCircle, TrendingUp } from "lucide-react";
import { platformPerformanceData } from "@/data/mockData";
import { cn } from "@/lib/utils";

const PlatformAnalytics = () => {
  const sortedPlatforms = [...platformPerformanceData].sort((a, b) => b.average - a.average);
  const bestPlatform = sortedPlatforms[0];
  const weakestPlatform = sortedPlatforms[sortedPlatforms.length - 1];

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getPerformanceGradient = (score: number) => {
    if (score >= 80) return "from-success/20 to-success/5";
    if (score >= 60) return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Platform Analytics</h3>
          <p className="text-sm text-muted-foreground">Performance across learning platforms</p>
        </div>
      </div>

      {/* Best & Weakest Platform Highlights */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
            <Award className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Platform</p>
            <p className="font-semibold text-foreground">{bestPlatform.platform}</p>
            <p className="text-sm text-success font-medium">{bestPlatform.average}% avg</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-destructive/10 to-transparent border border-destructive/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Needs Focus</p>
            <p className="font-semibold text-foreground">{weakestPlatform.platform}</p>
            <p className="text-sm text-destructive font-medium">{weakestPlatform.average}% avg</p>
          </div>
        </motion.div>
      </div>

      {/* Platform Cards */}
      <div className="space-y-3">
        {sortedPlatforms.map((platform, index) => (
          <motion.div
            key={platform.platform}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ x: 4 }}
            className={cn(
              "relative overflow-hidden rounded-xl p-4 transition-all cursor-pointer",
              "bg-gradient-to-r",
              getPerformanceGradient(platform.average)
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white",
                  getPerformanceColor(platform.average)
                )}>
                  #{index + 1}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{platform.platform}</p>
                  <p className="text-sm text-muted-foreground">{platform.students} active students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold font-display tabular-nums">{platform.average}%</p>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs">+2.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${platform.average}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                className={cn("h-full rounded-full", getPerformanceColor(platform.average))}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PlatformAnalytics;
