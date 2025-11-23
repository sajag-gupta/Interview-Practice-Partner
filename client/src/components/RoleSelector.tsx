import { Code, Database, BarChart3, Briefcase, TrendingUp, Headphones, ShoppingCart, Wrench } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobRole } from "@shared/schema";

const roleConfig = {
  SDE: { label: "Software Engineer", icon: Code },
  DevOps: { label: "DevOps Engineer", icon: Wrench },
  "Data Analyst": { label: "Data Analyst", icon: Database },
  BA: { label: "Business Analyst", icon: BarChart3 },
  PM: { label: "Product Manager", icon: Briefcase },
  Sales: { label: "Sales Executive", icon: TrendingUp },
  Support: { label: "Customer Support", icon: Headphones },
  Retail: { label: "Retail Associate", icon: ShoppingCart },
};

interface RoleSelectorProps {
  value: JobRole;
  onValueChange: (value: JobRole) => void;
}

export function RoleSelector({ value, onValueChange }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full" data-testid="select-role">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(roleConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem key={key} value={key} data-testid={`option-role-${key.toLowerCase()}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
