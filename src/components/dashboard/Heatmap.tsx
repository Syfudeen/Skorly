import { motion } from "framer-motion";
import { heatmapData } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const platforms = ["LeetCode", "HackerRank", "CodeChef", "Coursera", "Udemy"];

const Heatmap = () => {
  const getHeatColor = (value: number) => {
    if (value >= 90) return "bg-success";
    if (value >= 80) return "bg-success/80";
    if (value >= 70) return "bg-accent";
    if (value >= 60) return "bg-warning";
    if (value >= 50) return "bg-warning/70";
    return "bg-destructive/70";
  };

  const getHeatOpacity = (value: number) => {
    const normalized = (value - 40) / 60; // Normalize between 40-100
    return Math.max(0.3, Math.min(1, normalized));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">Performance Heatmap</h3>
        <p className="text-sm text-muted-foreground">Student vs Platform performance intensity</p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-destructive/70" />
            <div className="w-4 h-4 rounded bg-warning/70" />
            <div className="w-4 h-4 rounded bg-warning" />
            <div className="w-4 h-4 rounded bg-accent" />
            <div className="w-4 h-4 rounded bg-success/80" />
            <div className="w-4 h-4 rounded bg-success" />
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground">Student</th>
              {platforms.map((platform) => (
                <th key={platform} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {platform}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, rowIndex) => (
              <motion.tr
                key={row.student}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
              >
                <td className="p-2 text-sm font-medium text-foreground">{row.student}</td>
                {platforms.map((platform, colIndex) => {
                  const value = row[platform] as number;
                  return (
                    <td key={platform} className="p-1">
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, delay: rowIndex * 0.05 + colIndex * 0.02 }}
                            whileHover={{ scale: 1.1 }}
                            className={cn(
                              "heatmap-cell h-10 flex items-center justify-center text-xs font-semibold text-white cursor-pointer",
                              getHeatColor(value)
                            )}
                            style={{ opacity: getHeatOpacity(value) }}
                          >
                            {value}%
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{row.student}</p>
                          <p className="text-sm">{platform}: {value}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Heatmap;
