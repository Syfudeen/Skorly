import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import WeeklyComparison from "@/components/dashboard/WeeklyComparison";

const ComparisonPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Weekly Comparison
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare student performance between weeks
          </p>
        </motion.div>

        <WeeklyComparison />
      </div>
    </DashboardLayout>
  );
};

export default ComparisonPage;
