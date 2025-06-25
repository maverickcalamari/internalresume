import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ResumeBuilder() {
  // ... other state and logic

  // Assume generatedResume, showPreview, setShowPreview, personalInfo, etc. exist

  const downloadResume = () => {
    if (!generatedResume) return;
    const blob = new Blob([generatedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showPreview && generatedResume) {
    return (
      <Card className="card-professional">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                  Your Professional Resume
                </CardTitle>
                <p className="text-gray-600 text-sm">ATS-optimized and ready to download</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={downloadResume} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Download TXT
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {generatedResume}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ... rest of ResumeBuilder form rendering for editing/building
  return (
    <Card className="card-professional">
      {/* ...rest of the ResumeBuilder editor code here */}
      {/* Ensure there is NO PDF export logic or buttons */}
    </Card>
  );
}