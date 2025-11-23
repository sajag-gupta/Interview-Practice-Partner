import { useState } from "react";
import { io } from "socket.io-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InterviewConfig,
  InterviewDuration,
  InterviewType,
  ExperienceLevel,
  JobRole,
} from "@shared/schema";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewConfigurationProps {
  onConfigReady: (config: InterviewConfig) => void;
  role: JobRole;
}

export function InterviewConfiguration({ onConfigReady, role }: InterviewConfigurationProps) {
  const [duration, setDuration] = useState<InterviewDuration>(10);
  const [customDuration, setCustomDuration] = useState(10);
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [answerTimeLimit, setAnswerTimeLimit] = useState(120);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConfigStart = async () => {
    setIsProcessing(true);
    const config: InterviewConfig = {
      duration,
      customDurationMinutes: duration === "custom" ? customDuration : undefined,
      interviewType,
      answerTimeLimitSeconds: answerTimeLimit,
      experienceLevel,
    };

    if (jdFile && resumeFile) {
      try {
        const jdText = await jdFile.text();
        const resumeText = await resumeFile.text();
        
        const socket = io({ path: "/socket.io" });
        
        socket.emit("extract_documents", { jdText, resumeText, role });
        
        socket.on("documents_extracted", (data: { skills: string[]; responsibilities: string[]; strengths: string[]; weaknesses: string[] }) => {
          config.extractedSkills = data.skills;
          config.extractedResponsibilities = data.responsibilities;
          config.candidateStrengths = data.strengths;
          config.candidateWeaknesses = data.weaknesses;
          config.jdContent = jdText;
          config.resumeContent = resumeText;
          
          toast({
            title: "Documents Analyzed",
            description: `Extracted ${data.skills.length} skills and ${data.responsibilities.length} responsibilities`,
          });
          
          socket.disconnect();
          setIsProcessing(false);
          onConfigReady(config);
        });
        
        setTimeout(() => {
          if (socket.connected) {
            socket.disconnect();
            setIsProcessing(false);
            onConfigReady(config);
          }
        }, 10000);
        
        return;
      } catch (error) {
        console.error("Error processing documents:", error);
        toast({
          title: "Document Processing Failed",
          description: "Starting interview without document analysis",
          variant: "destructive",
        });
      }
    }

    setIsProcessing(false);
    onConfigReady(config);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Configure Your Interview</h2>
        <p className="text-muted-foreground">
          Customize the interview settings and optionally upload your JD & Resume
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="documents">JD & Resume</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration.toString()} onValueChange={(val) => {
                    if (val === "custom") {
                      setDuration("custom");
                    } else {
                      setDuration(parseInt(val) as InterviewDuration);
                    }
                  }}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="20">20 min</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {duration === "custom" && (
                    <Input
                      type="number"
                      min="5"
                      max="120"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={interviewType} onValueChange={(val) => setInterviewType(val as InterviewType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="rapid-fire">Rapid-fire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Select value={experienceLevel} onValueChange={(val) => setExperienceLevel(val as ExperienceLevel)}>
                    <SelectTrigger id="experience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry (0-2 yrs)</SelectItem>
                      <SelectItem value="mid">Mid (2-5 yrs)</SelectItem>
                      <SelectItem value="senior">Senior (5-10 yrs)</SelectItem>
                      <SelectItem value="lead">Lead (10+ yrs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit</Label>
                  <Select value={answerTimeLimit.toString()} onValueChange={(val) => setAnswerTimeLimit(parseInt(val))}>
                    <SelectTrigger id="timeLimit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30s</SelectItem>
                      <SelectItem value="60">1m</SelectItem>
                      <SelectItem value="120">2m</SelectItem>
                      <SelectItem value="180">3m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleConfigStart} size="lg" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Documents...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents (Optional)</CardTitle>
              <CardDescription>
                Upload JD and Resume for tailored questions matching job requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Job Description</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition" onClick={() => document.getElementById("jd-input")?.click()}>
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{jdFile ? jdFile.name : "Click to upload"}</p>
                </div>
                <input id="jd-input" type="file" accept=".txt,.doc,.docx,.pdf" onChange={(e) => setJdFile(e.target.files?.[0] || null)} className="hidden" />
              </div>

              <div className="space-y-3">
                <Label>Resume</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition" onClick={() => document.getElementById("resume-input")?.click()}>
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{resumeFile ? resumeFile.name : "Click to upload"}</p>
                </div>
                <input id="resume-input" type="file" accept=".txt,.doc,.docx,.pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
              </div>

              <Button onClick={handleConfigStart} size="lg" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Documents...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
