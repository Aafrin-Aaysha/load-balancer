import { useState } from "react";
import { Search, Download, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Subject {
  subject_name: string;
  max_marks: number;
  obtained_marks: number;
}

interface Result {
  name: string;
  roll_number: string;
  course: string;
  semester: number;
  year: number;
  subjects: Subject[];
  sgpa: number;
  percentage: number;
  status: "Pass" | "Fail";
}

const StudentResult = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!rollNumber.trim()) {
      toast.error("Please enter a roll number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/result/${rollNumber}`);
      
      if (!response.ok) {
        throw new Error("Result not found");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Result fetched successfully!");
    } catch (error) {
      toast.error("Failed to fetch result. Please check the roll number.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(220, 90, 50);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("College Result Portal", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Academic Result Report", 105, 30, { align: "center" });

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Name: ${result.name}`, 20, 55);
    doc.text(`Roll Number: ${result.roll_number}`, 20, 65);
    doc.text(`Course: ${result.course}`, 20, 75);
    doc.text(`Semester: ${result.semester}`, 120, 75);
    doc.text(`Year: ${result.year}`, 20, 85);

    // Subjects Table
    const tableData = result.subjects.map((subject) => [
      subject.subject_name,
      subject.max_marks.toString(),
      subject.obtained_marks.toString(),
      `${((subject.obtained_marks / subject.max_marks) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [["Subject", "Max Marks", "Obtained Marks", "Percentage"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [220, 90, 50] },
    });

    // Result Summary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text(`SGPA: ${result.sgpa.toFixed(2)}`, 20, finalY);
    doc.text(`Percentage: ${result.percentage.toFixed(2)}%`, 20, finalY + 10);
    doc.text(`Status: ${result.status}`, 20, finalY + 20);

    doc.save(`Result_${result.roll_number}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground py-8 shadow-elevated">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 justify-center">
            <GraduationCap className="h-10 w-10" />
            <h1 className="text-4xl font-bold">College Result Portal</h1>
          </div>
          <p className="text-center mt-2 text-primary-foreground/90">View Your Academic Results</p>
        </div>
      </header>

      {/* Search Section */}
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Search Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Roll Number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <div className="mt-8 max-w-4xl mx-auto animate-fade-in">
            {/* Student Info Card */}
            <Card className="shadow-card mb-6">
              <CardHeader className="bg-gradient-card">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{result.name}</CardTitle>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Roll Number: <span className="font-semibold text-foreground">{result.roll_number}</span></p>
                      <p>Course: <span className="font-semibold text-foreground">{result.course}</span></p>
                      <p>Semester: <span className="font-semibold text-foreground">{result.semester}</span> | Year: <span className="font-semibold text-foreground">{result.year}</span></p>
                    </div>
                  </div>
                  <Badge
                    variant={result.status === "Pass" ? "default" : "destructive"}
                    className={result.status === "Pass" ? "bg-success" : ""}
                  >
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Subjects Table */}
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Subject</th>
                        <th className="text-center py-3 px-4 font-semibold">Max Marks</th>
                        <th className="text-center py-3 px-4 font-semibold">Obtained</th>
                        <th className="text-center py-3 px-4 font-semibold">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((subject, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">{subject.subject_name}</td>
                          <td className="text-center py-3 px-4">{subject.max_marks}</td>
                          <td className="text-center py-3 px-4 font-semibold">{subject.obtained_marks}</td>
                          <td className="text-center py-3 px-4">
                            {((subject.obtained_marks / subject.max_marks) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="shadow-elevated bg-gradient-card">
              <CardHeader>
                <CardTitle>Result Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-muted-foreground mb-1">SGPA</p>
                    <p className="text-3xl font-bold text-primary">{result.sgpa.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-muted-foreground mb-1">Percentage</p>
                    <p className="text-3xl font-bold text-accent">{result.percentage.toFixed(2)}%</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-muted-foreground mb-1">Status</p>
                    <p className={`text-3xl font-bold ${result.status === "Pass" ? "text-success" : "text-destructive"}`}>
                      {result.status}
                    </p>
                  </div>
                </div>
                <Button onClick={downloadPDF} className="w-full mt-6 gap-2" size="lg">
                  <Download className="h-5 w-5" />
                  Download Result PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentResult;
