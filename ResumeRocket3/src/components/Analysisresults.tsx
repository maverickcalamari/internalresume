import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Download, Edit, Calendar, Clock } from "lucide-react";

interface AnalysisResultsProps {
  resume: {
    id: number;
    filename: string;
    atsScore: number;
    analysis: {
      score: number;
      strengths: string[];
      improvements: string[];
      keywordMatch: number;
      formatting: number;
      content: number;
      employmentGaps?: Array<{
        startDate: string;
        endDate: string;
        duration: number;
        severity: 'minor' | 'moderate' | 'significant';
        recommendations: string[];
      }>;
    };
    suggestions: Array<{
      id: number;
      type: string;
      title: string;
      description: string;
      keywords?: string[];
      priority: string;
    }>;
  };
  onEdit: () => void;
}

export default function AnalysisResults({ resume, onEdit }: AnalysisResultsProps) {
  const { analysis, suggestions, atsScore } = resume;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Card className="card-professional transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Analysis Results
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">AI-powered insights and recommendations</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" onClick={onEdit} className="btn-professional text-sm sm:text-base">
              <Edit className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 btn-professional text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2" />
              Download Optimized
            </Button>
          </div>
        </div>

        {/* ATS Score */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">ATS Compatibility Score</span>
                <p className="text-sm text-gray-600 mt-1">Applicant Tracking System optimization level</p>
              </div>
              <div className="text-right">
                <span className={`text-4xl font-bold ${getScoreColor(atsScore)}`}>
                  {atsScore}%
                </span>
                <div className={`text-xs font-medium mt-1 px-3 py-1 rounded-full inline-block ml-2 ${
                  atsScore >= 80 ? 'bg-green-100 text-green-800' : 
                  atsScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work'}
                </div>
              </div>
            </div>
            <Progress value={atsScore} className="h-4 mb-3" />
            <p className="text-sm text-gray-700 leading-relaxed">
              {atsScore >= 80 
                ? 'Outstanding! Your resume is excellently optimized for ATS systems and should pass through most applicant tracking filters.' 
                : atsScore >= 60 
                ? 'Good progress! Your resume has solid ATS compatibility but could benefit from some optimization.' 
                : 'Significant improvements needed. Your resume may struggle with ATS systems and requires optimization to improve visibility.'
              }
            </p>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-2xl sm:text-xl lg:text-2xl font-bold text-gray-900">{analysis.keywordMatch}%</div>
            <div className="text-sm text-gray-600 mt-1">Keywords</div>
          </div>
          <div className="text-center p-4 sm:p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-2xl sm:text-xl lg:text-2xl font-bold text-gray-900">{analysis.formatting}%</div>
            <div className="text-sm text-gray-600 mt-1">Formatting</div>
          </div>
          <div className="text-center p-4 sm:p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
            <div className="text-2xl sm:text-xl lg:text-2xl font-bold text-gray-900">{analysis.content}%</div>
            <div className="text-sm text-gray-600 mt-1">Content</div>
          </div>
        </div>

        {/* Improvement Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Strengths</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li key={index}>• {strength}</li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-gray-900">Improvements</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {analysis.improvements.map((improvement, index) => (
                <li key={index}>• {improvement}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Suggestions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Optimization Suggestions</h3>
          
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{suggestion.description}</p>
                  {suggestion.keywords && suggestion.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestion.keywords.map((keyword, keyIndex) => (
                        <Badge key={keyIndex} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}