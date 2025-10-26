import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadStatus("idle");
      toast.success("File selected successfully!");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("http://localhost:8000/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadStatus("success");
      toast.success(`Successfully uploaded ${data.records_processed} records!`);
    } catch (error) {
      setUploadStatus("error");
      toast.error("Failed to upload CSV. Please check the file format and try again.");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground py-8 shadow-elevated">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Link>
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-primary-foreground/90">Upload Student Results</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Instructions Card */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>CSV Upload Instructions</CardTitle>
              <CardDescription>
                Upload a CSV file containing student results. The file should include the following columns:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>name - Student's full name</li>
                  <li>roll_number - Unique student identifier</li>
                  <li>course - Course name (e.g., MCA, BCA, B.Sc CS)</li>
                  <li>semester - Current semester number</li>
                  <li>year - Academic year</li>
                  <li>subject_name - Name of the subject</li>
                  <li>max_marks - Maximum marks for the subject</li>
                  <li>obtained_marks - Marks obtained by the student</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary font-semibold">Drop the CSV file here...</p>
                ) : (
                  <div>
                    <p className="text-foreground font-semibold mb-1">
                      Drag & drop a CSV file here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">Only .csv files are accepted</p>
                  </div>
                )}
              </div>

              {/* Selected File */}
              {file && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg animate-fade-in">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {uploadStatus === "success" && (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                  {uploadStatus === "error" && (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full gap-2"
                size="lg"
              >
                <Upload className="h-5 w-5" />
                {uploading ? "Uploading..." : "Upload Results"}
              </Button>

              {/* Status Messages */}
              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 p-4 bg-success/10 text-success rounded-lg animate-fade-in">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-semibold">Results uploaded successfully!</p>
                </div>
              )}
              {uploadStatus === "error" && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg animate-fade-in">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">Upload failed. Please check the file format.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
