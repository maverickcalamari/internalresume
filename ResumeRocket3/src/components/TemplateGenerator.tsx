import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Eye, Lightbulb } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResumeTemplate {
  id: string;
  industry: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  keywords: string[];
  formatting: TemplateFormatting;
}

interface TemplateSection {
  name: string;
  required: boolean;
  order: number;
  content: string;
  tips: string[];
}

interface TemplateFormatting {
  font: string;
  fontSize: string;
  margins: string;
  spacing: string;
  bulletStyle: string;
}

interface TemplateGeneratorProps {
  defaultIndustry?: string;
}

export default function TemplateGenerator({ defaultIndustry }: TemplateGeneratorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(defaultIndustry || "");
  const [generatedTemplate, setGeneratedTemplate] = useState<ResumeTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateTemplateMutation = useMutation({
    mutationFn: async (industry: string): Promise<ResumeTemplate> => {
      const response = await fetch("/api/templates/generate", {
        method: "POST",
        body: JSON.stringify({ industry }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to generate template");
      return await response.json();
    },
    onSuccess: (template: ResumeTemplate) => {
      setGeneratedTemplate(template);
      setShowPreview(true);
      toast({
        title: "Template Generated",
        description: `Created ${template.name} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateTemplate = () => {
    if (!selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select an industry to generate a template",
        variant: "destructive",
      });
      return;
    }
    generateTemplateMutation.mutate(selectedIndustry);
  };

  const downloadTemplate = () => {
    if (!generatedTemplate) return;
    
    const templateContent = generatedTemplate.sections
      .sort((a, b) => a.order - b.order)
      .map(section => `${section.name.toUpperCase()}\n${section.content}\n\nTips:\n${section.tips.map(tip => `• ${tip}`).join('\n')}\n`)
      .join('\n' + '='.repeat(50) + '\n\n');

    const fullContent = `${generatedTemplate.name}\n${generatedTemplate.description}\n\n${'='.repeat(50)}\n\nFORMATTING GUIDELINES:\n• Font: ${generatedTemplate.formatting.font}\n• Font Size: ${generatedTemplate.formatting.fontSize}\n• Margins: ${generatedTemplate.formatting.margins}\n• Spacing: ${generatedTemplate.formatting.spacing}\n• Bullets: ${generatedTemplate.formatting.bulletStyle}\n\nKEY INDUSTRY KEYWORDS:\n${generatedTemplate.keywords.map(keyword => `• ${keyword}`).join('\n')}\n\n${'='.repeat(50)}\n\n${templateContent}`;

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTemplate.industry}_resume_template.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="card-professional transition-all duration-300">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
              Resume Template Generator
            </CardTitle>
            <p className="text-gray-600 text-sm">Generate industry-specific resume templates</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Industry Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Industry
          </label>
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full h-12 text-base border-2 border-gray-200 hover:border-primary focus:border-primary transition-colors">
              <SelectValue placeholder="Choose an industry for your template" />
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

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateTemplate}
          disabled={!selectedIndustry || generateTemplateMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 btn-professional text-base"
        >
          {generateTemplateMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Template...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Generate Template</span>
            </div>
          )}
        </Button>

        {/* Template Preview */}
        {generatedTemplate && showPreview && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{generatedTemplate.name}</h3>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)} size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                <Button onClick={downloadTemplate} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <p className="text-gray-600 text-sm">{generatedTemplate.description}</p>

            {/* Keywords */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Industry Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {generatedTemplate.keywords.slice(0, 12).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Formatting Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Formatting Guidelines
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Font:</strong> {generatedTemplate.formatting.font}</p>
                <p><strong>Size:</strong> {generatedTemplate.formatting.fontSize}</p>
                <p><strong>Margins:</strong> {generatedTemplate.formatting.margins}</p>
                <p><strong>Spacing:</strong> {generatedTemplate.formatting.spacing}</p>
              </div>
            </div>

            {/* Template Sections */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Template Sections</h4>
              {generatedTemplate.sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{section.name}</h5>
                      {section.required && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                          Required
                        </Badge>
                      )}
                    </div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded mb-2">
                      {section.content}
                    </pre>
                    {section.tips.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Tips:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {section.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start">
                              <span className="text-green-500 mr-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}