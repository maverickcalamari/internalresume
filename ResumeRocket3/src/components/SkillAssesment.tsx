import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Brain, TrendingUp, Target, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  name: string;
  currentLevel: number;
  targetLevel: number;
  importance: number;
}

interface SkillAssessmentProps {
  onComplete?: (skills: Skill[]) => void;
}

export default function SkillAssessment({ onComplete }: SkillAssessmentProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const industrySkills = {
    technology: [
      'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 'Git',
      'Machine Learning', 'API Development', 'Cloud Computing', 'DevOps'
    ],
    healthcare: [
      'Patient Care', 'Medical Terminology', 'HIPAA Compliance', 'Electronic Health Records',
      'Clinical Research', 'Healthcare Administration', 'Medical Coding', 'Telemedicine'
    ],
    finance: [
      'Financial Analysis', 'Risk Management', 'Excel', 'Bloomberg Terminal',
      'Financial Modeling', 'Investment Banking', 'Portfolio Management', 'Compliance'
    ],
    marketing: [
      'Digital Marketing', 'SEO', 'Social Media Marketing', 'Google Analytics',
      'Content Marketing', 'Email Marketing', 'Marketing Automation', 'Brand Management'
    ],
    education: [
      'Curriculum Development', 'Classroom Management', 'Educational Technology',
      'Student Assessment', 'Differentiated Instruction', 'Learning Management Systems'
    ],
    consulting: [
      'Strategy Development', 'Business Analysis', 'Project Management', 'Data Analysis',
      'Client Relations', 'Problem Solving', 'Process Improvement', 'Change Management'
    ]
  };

  const startAssessment = () => {
    if (!selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select your target industry first.",
        variant: "destructive",
      });
      return;
    }

    const industrySkillList = industrySkills[selectedIndustry as keyof typeof industrySkills] || [];
    const initialSkills = industrySkillList.slice(0, 8).map(skill => ({
      name: skill,
      currentLevel: 50,
      targetLevel: 85,
      importance: 75
    }));

    setSkills(initialSkills);
    setCurrentSkillIndex(0);
    setIsAssessing(true);
  };

  const updateCurrentSkill = (field: keyof Skill, value: number) => {
    const updatedSkills = [...skills];
    updatedSkills[currentSkillIndex] = {
      ...updatedSkills[currentSkillIndex],
      [field]: value
    };
    setSkills(updatedSkills);
  };

  const nextSkill = () => {
    if (currentSkillIndex < skills.length - 1) {
      setCurrentSkillIndex(currentSkillIndex + 1);
    } else {
      completeAssessment();
    }
  };

  const previousSkill = () => {
    if (currentSkillIndex > 0) {
      setCurrentSkillIndex(currentSkillIndex - 1);
    }
  };

  const completeAssessment = () => {
    setIsComplete(true);
    setIsAssessing(false);
    onComplete?.(skills);
    
    // Save to user stats
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    
    toast({
      title: "Assessment Complete!",
      description: "Your skill assessment has been saved and will help improve your resume recommendations.",
    });
  };

  const currentSkill = skills[currentSkillIndex];
  const progress = skills.length > 0 ? ((currentSkillIndex + 1) / skills.length) * 100 : 0;

  if (isComplete) {
    return (
      <Card className="card-professional">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                Assessment Complete!
              </CardTitle>
              <p className="text-gray-600 text-sm">Your skill profile has been created</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {skill.currentLevel}%
                  </Badge>
                </div>
                <Progress value={skill.currentLevel} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Current</span>
                  <span>Target: {skill.targetLevel}%</span>
                </div>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => {
              setIsComplete(false);
              setIsAssessing(false);
              setSkills([]);
              setCurrentSkillIndex(0);
            }}
            variant="outline"
            className="w-full"
          >
            Take Assessment Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAssessing && currentSkill) {
    return (
      <Card className="card-professional">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Skill Assessment</CardTitle>
                <p className="text-gray-600 text-sm">
                  Question {currentSkillIndex + 1} of {skills.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{currentSkill.name}</h3>
            <p className="text-gray-600 text-sm">Rate your current proficiency level</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Level: {currentSkill.currentLevel}%
              </label>
              <Slider
                value={[currentSkill.currentLevel]}
                onValueChange={(value) => updateCurrentSkill('currentLevel', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Expert</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Level: {currentSkill.targetLevel}%
              </label>
              <Slider
                value={[currentSkill.targetLevel]}
                onValueChange={(value) => updateCurrentSkill('targetLevel', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importance for Career: {currentSkill.importance}%
              </label>
              <Slider
                value={[currentSkill.importance]}
                onValueChange={(value) => updateCurrentSkill('importance', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={previousSkill}
              disabled={currentSkillIndex === 0}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={nextSkill}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {currentSkillIndex === skills.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-professional">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Skills Assessment
            </CardTitle>
            <p className="text-gray-600 text-sm">Evaluate your current skills and set improvement goals</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Industry
          </label>
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full h-12 text-base border-2 border-gray-200 hover:border-primary focus:border-primary transition-colors">
              <SelectValue placeholder="Choose your industry for skill assessment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">What You'll Get</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Personalized skill gap analysis</li>
                <li>• Industry-specific recommendations</li>
                <li>• Career development roadmap</li>
                <li>• Improved resume optimization</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={startAssessment}
          disabled={!selectedIndustry}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-professional text-base"
        >
          <Brain className="h-5 w-5 mr-2" />
          Start Skills Assessment
        </Button>
      </CardContent>
    </Card>
  );
}