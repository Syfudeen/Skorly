import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadStatus } from "@/types/student";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
  onUploadComplete?: (data: any) => void;
}

const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
  });

  const simulateUpload = useCallback((file: File) => {
    setUploadStatus({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      message: 'Uploading file...',
    });

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setUploadStatus(prev => ({
          ...prev,
          progress,
          message: progress < 100 ? 'Uploading file...' : 'Processing data...',
        }));
      } else {
        clearInterval(uploadInterval);
        setUploadStatus(prev => ({
          ...prev,
          status: 'processing',
          message: 'Analyzing student performance...',
        }));

        // Simulate processing
        setTimeout(() => {
          setUploadStatus(prev => ({
            ...prev,
            status: 'completed',
            message: 'Excel data processed successfully!',
          }));
          onUploadComplete?.({});
        }, 1500);
      }
    }, 200);
  }, [onUploadComplete]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      simulateUpload(file);
    }
  }, [simulateUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const resetUpload = () => {
    setUploadStatus({
      status: 'idle',
      progress: 0,
    });
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-success" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-destructive" />;
      default:
        return <FileSpreadsheet className="h-12 w-12 text-primary" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">Upload Student Data</h3>
        <p className="text-sm text-muted-foreground">
          Import Excel files with the required format to analyze student performance
        </p>
      </div>

      {/* Expected Format Info */}
      <div className="mb-4 p-4 rounded-xl border border-primary/30" style={{backgroundColor: '#8a2be2'}}>
        <h4 className="font-medium mb-2" style={{color: '#fff'}}>Required Excel Format:</h4>
        <div className="text-sm">
          <p className="mb-3" style={{color: '#fff'}}>Your Excel file should have these columns in order:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs rounded-lg overflow-hidden" style={{backgroundColor: '#080808', border: '1px solid #333'}}>
              <thead>
                <tr style={{backgroundColor: '#080808'}}>
                  <th className="px-3 py-2 text-left font-medium border-r" style={{color: '#fff', borderColor: '#333'}}>Column</th>
                  <th className="px-3 py-2 text-left font-medium" style={{color: '#fff'}}>Field Name</th>
                </tr>
              </thead>
              <tbody style={{backgroundColor: '#080808'}}>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>A</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Name</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>B</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Reg No</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>C</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Dept</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>D</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Year</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>E</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>CodeChef ID</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>F</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>LeetCode ID</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>G</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Codeforces ID</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>H</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>AtCoder ID</td>
                </tr>
                <tr className="border-b" style={{borderColor: '#333'}}>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>I</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>Codolio ID</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono border-r" style={{color: '#fff', borderColor: '#333'}}>J</td>
                  <td className="px-3 py-2" style={{color: '#fff'}}>GitHub ID</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {uploadStatus.status === 'idle' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
                isDragActive
                  ? "border-primary bg-primary-light"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.05, y: -10 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={isDragActive ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-2xl transition-colors",
                    isDragActive ? "bg-primary" : "bg-gradient-primary"
                  )}
                >
                  <Upload className="h-10 w-10 text-white" />
                </motion.div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive ? "Drop your file here" : "Drag & drop your Excel file"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (.xlsx, .xls, .csv)
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  Browse Files
                </Button>
              </motion.div>

              {/* Decorative Elements */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-border rounded-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-4"
            >
              {getStatusIcon()}
            </motion.div>

            {uploadStatus.fileName && (
              <p className="font-medium text-foreground mb-2">{uploadStatus.fileName}</p>
            )}

            <p className={cn(
              "text-sm mb-4",
              uploadStatus.status === 'completed' ? "text-success" : "text-muted-foreground"
            )}>
              {uploadStatus.message}
            </p>

            {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
              <div className="max-w-xs mx-auto mb-4">
                <Progress value={uploadStatus.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadStatus.status === 'uploading' 
                    ? `${uploadStatus.progress}% uploaded`
                    : 'Processing...'}
                </p>
              </div>
            )}

            {(uploadStatus.status === 'completed' || uploadStatus.status === 'error') && (
              <Button onClick={resetUpload} variant="outline">
                Upload Another File
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-primary/30"
        style={{backgroundColor: '#8a2be2'}}
      >
        <AlertCircle className="h-5 w-5 mt-0.5" style={{color: '#fff'}} />
        <div className="text-sm">
          <p className="font-medium" style={{color: '#fff'}}>How it works</p>
          <p style={{color: '#fff'}}>
            Upload your weekly Excel data. The system will automatically compare it with the previous 
            week and generate performance insights, rankings, and trend analysis.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UploadSection;
