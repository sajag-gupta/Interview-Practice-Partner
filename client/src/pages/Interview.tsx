import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VoiceInterface } from "@/components/VoiceInterface";
import { ChatInterface } from "@/components/ChatInterface";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackDashboard } from "@/components/FeedbackDashboard";
import { PatternIndicator } from "@/components/PatternIndicator";
import { InterviewConfiguration } from "@/components/InterviewConfiguration";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InterviewConfig, JobRole, InterviewMode } from "@shared/schema";
import { useInterview } from "@/hooks/useInterview";
import { useToast } from "@/hooks/use-toast";
import { Play, Wifi, WifiOff } from "lucide-react";
import jsPDF from "jspdf";

type ViewMode = "welcome" | "config" | "interview" | "feedback";

export default function Interview() {
  const [role, setRole] = useState<JobRole>("SDE");
  const [mode, setMode] = useState<InterviewMode>("chat");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("welcome");
  const { toast } = useToast();

  const {
    socket,
    isConnected,
    interviewState,
    messages,
    currentQuestion,
    feedback,
    detectedPattern,
    isProcessing,
    setIsProcessing,
    startInterview,
    sendMessage,
    sendVoiceTranscript,
    executeCommand,
    requestFeedback,
  } = useInterview(() => {
    // Callback when interview ends - show feedback view
    setViewMode("feedback");
  });

  const handleConfigReady = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    startInterview(role, mode, newConfig);
    setViewMode("interview");
    toast({
      title: "Interview Started",
      description: `Beginning your ${role} interview in ${mode} mode.`,
    });
  };

  const handleEndInterview = () => {
    executeCommand("/end");
    setViewMode("feedback");
  };

  const handleViewFeedback = () => {
    requestFeedback();
    setViewMode("feedback");
  };

  const handleChangeRole = () => {
    executeCommand("/change role", { role });
    toast({
      title: "Role Changed",
      description: `Interview will continue with ${role} questions.`,
    });
  };

  const handleExportPDF = () => {
    if (!feedback) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(20);
    doc.text("Interview Feedback Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.text(`Overall Score: ${feedback.overallScore.toFixed(1)}/10`, 20, 40);
    
    doc.setFontSize(12);
    let yPos = 55;
    doc.text(`Communication: ${feedback.communication.toFixed(1)}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Technical Depth: ${feedback.technicalDepth.toFixed(1)}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Problem Solving: ${feedback.problemSolving.toFixed(1)}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Confidence: ${feedback.confidence.toFixed(1)}/10`, 20, yPos);
    
    doc.save("interview-feedback.pdf");
    
    toast({
      title: "PDF Exported",
      description: "Your interview feedback has been saved!",
    });
  };

  const style = {
    "--sidebar-width": "20rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          role={role}
          onRoleChange={setRole}
          mode={mode}
          onModeChange={setMode}
          onEndInterview={handleEndInterview}
          onViewFeedback={handleViewFeedback}
          onChangeRole={handleChangeRole}
          elapsedTime={interviewState?.elapsedTime || 0}
          config={interviewState?.config}
        />
        
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {detectedPattern && (
                <PatternIndicator
                  pattern={detectedPattern.pattern}
                  confidence={detectedPattern.confidence}
                />
              )}
              <h1 className="text-lg font-semibold">
                {viewMode === "interview" && "Interview in Progress"}
                {viewMode === "feedback" && "Interview Feedback"}
                {viewMode === "config" && "Configure Interview"}
                {viewMode === "welcome" && "AI Interview Partner"}
              </h1>
            </div>
            
            <div className="w-32" />
          </header>
          
          <main className="flex-1 overflow-hidden">
            {viewMode === "welcome" && (
              <div className="h-full flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold">
                      Welcome to AI Interview Practice
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Experience realistic interview scenarios with an AI that adapts to your communication style.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <h3 className="font-semibold">How it works:</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Configure your interview preferences</li>
                        <li>• The AI automatically detects your communication pattern</li>
                        <li>• Questions adapt based on your responses</li>
                        <li>• Use commands: /change role, /end, /feedback anytime</li>
                        <li>• Get comprehensive feedback at the end</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 border rounded-md">
                        <p className="font-medium mb-1">Adaptive AI</p>
                        <p className="text-muted-foreground text-xs">
                          Detects your communication style
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <p className="font-medium mb-1">Dynamic Questions</p>
                        <p className="text-muted-foreground text-xs">
                          Adjusts based on your answers
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <p className="font-medium mb-1">Real-time Feedback</p>
                        <p className="text-muted-foreground text-xs">
                          Instant insights during interview
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <p className="font-medium mb-1">Detailed Reports</p>
                        <p className="text-muted-foreground text-xs">
                          Comprehensive scoring & PDF export
                        </p>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setViewMode("config")}
                      disabled={!isConnected}
                      data-testid="button-start-interview"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Configure & Start
                    </Button>
                    
                    {!isConnected && (
                      <p className="text-sm text-center text-muted-foreground">
                        Connecting to server...
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {viewMode === "config" && (
              <InterviewConfiguration onConfigReady={handleConfigReady} role={role} />
            )}

            {viewMode === "interview" && (
              <div className="h-full flex flex-col">
                {currentQuestion && (
                  <div className="p-6 border-b">
                    <div className="max-w-3xl mx-auto">
                      <QuestionCard
                        questionNumber={interviewState?.currentQuestion || 1}
                        question={currentQuestion.question}
                        category={currentQuestion.category}
                        difficulty={currentQuestion.difficulty}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  {mode === "voice" ? (
                    <VoiceInterface 
                      onTranscript={sendVoiceTranscript} 
                      questionId={currentQuestion?.id}
                      messages={messages}
                      socket={socket || undefined}
                      isProcessing={isProcessing}
                      onProcessingChange={setIsProcessing}
                    />
                  ) : (
                    <ChatInterface 
                      messages={messages}
                      onSendMessage={sendMessage}
                      isTyping={isProcessing}
                    />
                  )}
                </div>
              </div>
            )}

            {viewMode === "feedback" && (
              <div className="h-full overflow-auto">
                {feedback ? (
                  <FeedbackDashboard
                    feedback={feedback}
                    onExportPDF={handleExportPDF}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-lg font-medium">Generating feedback...</p>
                      <p className="text-sm text-muted-foreground">
                        Analyzing your interview responses
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
