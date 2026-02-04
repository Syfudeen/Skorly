import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadStatus } from "@/types/student";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
  onUploadComplete?: (data: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
  });
  const [jobId, setJobId] = useState<string | null>(null);

  const uploadToBackend = useCallback(async (file: File) => {
    setUploadStatus({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      message: 'Uploading file to server...',
    });

    try {
      console.log('Uploading to:', `${API_URL}/api/upload`);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response data:', result);
      
      if (response.ok && result.status === 'success') {
        const uploadJobId = result.data.jobId;
        setJobId(uploadJobId);
        
        // Handle different response structures
        const totalStudents = result.data.totalStudents || 
                             result.data.statistics?.validStudents || 
                             result.data.studentsData?.valid || 
                             0;
        
        setUploadStatus({
          status: 'processing',
          progress: 50,
          fileName: file.name,
          message: `Processing ${totalStudents} students...`,
        });

        // Poll for job progress
        pollJobProgress(uploadJobId);
      } else {
        // Handle error response
        const errorMessage = result.message || 'Upload failed';
        console.error('Upload error:', errorMessage, result);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        progress: 0,
        fileName: file.name,
        message: error.message || 'Failed to upload file. Please check your Excel format and try again.',
      });
    }
  }, [onUploadComplete]);

  const pollJobProgress = useCallback(async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/jobs/${jobId}`);
        const result = await response.json();

        if (result.status === 'success') {
          const job = result.data.job;
          const progress = job.progress.percentage || 0;

          setUploadStatus(prev => ({
            ...prev,
            progress,
            message: `Processing: ${job.progress.processed}/${job.progress.total} students (${job.progress.successful} successful, ${job.progress.failed} failed)`,
          }));

          // Check if completed
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setUploadStatus(prev => ({
              ...prev,
              status: 'completed',
              progress: 100,
              message: `Successfully processed ${job.progress.successful} students!`,
            }));
            
            // Notify parent component
            onUploadComplete?.(job);
            
            // Fetch and display students
            fetchStudents();
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setUploadStatus(prev => ({
              ...prev,
              status: 'error',
              progress: 0,
              message: 'Processing failed. Please check your data and try again.',
            }));
          }
        }
      } catch (error) {
        console.error('Error polling job:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  }, [onUploadComplete]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students?sort=performance&order=desc`);
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('Fetched students:', result.data.students);
        // You can pass this data to parent or store in state
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadToBackend(file);
    }
  }, [uploadToBackend]);

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
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6">
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

      {uploadStatus.status === 'idle' ? (
        <div>
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
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl transition-colors",
                isDragActive ? "bg-primary" : "bg-gradient-primary"
              )}>
                <Upload className="h-10 w-10 text-white" />
              </div>
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
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>

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
                  : `${uploadStatus.progress}% processed`}
              </p>
            </div>
          )}

          {(uploadStatus.status === 'completed' || uploadStatus.status === 'error') && (
            <Button onClick={resetUpload} variant="outline">
              Upload Another File
            </Button>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-primary/30" style={{backgroundColor: '#8a2be2'}}>
        <AlertCircle className="h-5 w-5 mt-0.5" style={{color: '#fff'}} />
        <div className="text-sm">
          <p className="font-medium" style={{color: '#fff'}}>How it works</p>
          <p style={{color: '#fff'}}>
            Upload your weekly Excel data. The system will automatically fetch real data from Codeforces, LeetCode, CodeChef, and other platforms, 
            compare it with the previous week, and generate performance insights, rankings, and trend analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
