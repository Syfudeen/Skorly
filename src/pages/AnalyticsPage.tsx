import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GraphSection from "@/components/dashboard/GraphSection";
import PlatformAnalytics from "@/components/dashboard/PlatformAnalytics";

const AnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive performance analytics and trends
          </p>
        </motion.div>

        <GraphSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformAnalytics />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
          >
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Performance Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: "90-100%", count: 2, color: "bg-success", percentage: 17 },
                { label: "80-89%", count: 2, color: "bg-success/70", percentage: 17 },
                { label: "70-79%", count: 2, color: "bg-accent", percentage: 17 },
                { label: "60-69%", count: 2, color: "bg-warning", percentage: 17 },
                { label: "Below 60%", count: 4, color: "bg-destructive", percentage: 33 },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.count} students ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
