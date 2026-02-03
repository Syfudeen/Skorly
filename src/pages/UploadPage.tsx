import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadSection from "@/components/upload/UploadSection";

const UploadPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Upload Excel Data
          </h1>
          <p className="text-muted-foreground mt-1">
            Import your weekly student performance data
          </p>
        </motion.div>

        <div className="max-w-2xl">
          <UploadSection />
        </div>

        {/* Recent Uploads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Recent Uploads
          </h2>
          <div className="space-y-3">
            {[
              { week: "Week 12", date: "Jan 22, 2024", students: 12, status: "Current" },
              { week: "Week 11", date: "Jan 15, 2024", students: 12, status: "Previous" },
              { week: "Week 10", date: "Jan 8, 2024", students: 11, status: "Archived" },
            ].map((upload, index) => (
              <motion.div
                key={upload.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{upload.week}</p>
                  <p className="text-sm text-muted-foreground">{upload.date} • {upload.students} students</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  upload.status === 'Current' ? 'badge-high' :
                  upload.status === 'Previous' ? 'badge-medium' : 'bg-muted text-muted-foreground'
                }`}>
                  {upload.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
