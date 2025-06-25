import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, File, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onResumeUploaded: (resume: any) => void;
}

export default function FileUpload({ onResumeUploaded }: FileUploadProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, industry }: { file: File; industry: string }) => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('industry', industry);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onResumeUploaded(data);
      toast({
        title: "Analysis Complete",
        description: "Your resume has been successfully analyzed!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select your target industry first.",
        variant: "destructive",
      });
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      uploadMutation.mutate(
        { file, industry: selectedIndustry },
        {
          onSettled: () => {
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              setProgress(0);
            }, 500);
          }
        }
      );
    }
  }, [selectedIndustry, uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  return (
    <>
      <Card className="card-professional transition-all duration-300">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-2">
              Upload Your Resume
            </h2>
            <p className="text-gray-600">Get instant AI-powered analysis and optimization suggestions</p>
          </div>
          
          {/* Industry Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Industry
            </label>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full h-12 text-base border-2 border-gray-200 hover:border-primary focus:border-primary transition-colors">
                <SelectValue placeholder="Select your target industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="data_science">Data Science</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="human_resources">Human Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer group ${
              isDragActive
                ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50 scale-105'
                : 'border-gray-300 hover:border-primary hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-102'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="text-primary h-10 w-10" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">Drop your resume here</p>
                <p className="text-gray-600">
                  or <span className="text-primary font-semibold hover:underline">browse to upload</span>
                </p>
              </div>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>PDF</span>
                </span>
                <span className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                  <File className="h-4 w-4 text-blue-600" />
                  <span>DOC/DOCX</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Modal */}
      <Dialog open={isLoading} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="text-white h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
            <p className="text-gray-600 mb-4">Our AI is analyzing your resume for ATS compatibility...</p>
            
            <Progress value={progress} className="mb-4" />
            
            <div className="flex justify-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Bot className="h-4 w-4" />
                <span>Scanning content</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Calculating score</span>
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
