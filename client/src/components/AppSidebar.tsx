import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { RoleSelector } from "./RoleSelector";
import { ModeToggle } from "./ModeToggle";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, StopCircle, BarChart3 } from "lucide-react";
import { JobRole, InterviewMode, InterviewConfig } from "@shared/schema";

interface AppSidebarProps {
  role: JobRole;
  onRoleChange: (role: JobRole) => void;
  mode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
  onEndInterview: () => void;
  onViewFeedback: () => void;
  onChangeRole: () => void;
  elapsedTime: number;
  config?: InterviewConfig;
}

export function AppSidebar({
  role,
  onRoleChange,
  mode,
  onModeChange,
  onEndInterview,
  onViewFeedback,
  onChangeRole,
  elapsedTime,
  config,
}: AppSidebarProps) {
  const targetDurationSeconds = config?.duration === "custom" 
    ? (config.customDurationMinutes || 10) * 60 
    : (config?.duration || 10) * 60;
  const progressPercentage = (elapsedTime / targetDurationSeconds) * 100;
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Interview Partner</h2>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Interview Setup</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-2">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Job Role
              </label>
              <RoleSelector value={role} onValueChange={onRoleChange} />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Interview Mode
              </label>
              <ModeToggle mode={mode} onModeChange={onModeChange} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {config && elapsedTime > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Interview Progress</SidebarGroupLabel>
            <SidebarGroupContent className="px-2 space-y-3">
              <Progress 
                value={Math.min(progressPercentage, 100)} 
                className="h-2"
              />
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Time: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s / {Math.floor(targetDurationSeconds / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">
                  Type: {config.interviewType.charAt(0).toUpperCase() + config.interviewType.slice(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Level: {config.experienceLevel.charAt(0).toUpperCase() + config.experienceLevel.slice(1)}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 px-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onChangeRole}
              data-testid="button-change-role"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Change Role
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onViewFeedback}
              data-testid="button-view-feedback"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Feedback
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start"
              onClick={onEndInterview}
              data-testid="button-end-interview"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              End Interview
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
