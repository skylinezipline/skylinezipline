import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  todayShift: string;
}

const roleLabels: Record<string, string> = {
  HEAD_GUIDE: "Head Guide",
  SENIOR_GUIDE: "Sr. Guide",
  GUIDE: "Guide",
  TRAINEE: "Trainee",
  DISPATCH: "Dispatch",
  MANAGER: "Manager",
};

const roleColors: Record<string, string> = {
  HEAD_GUIDE: "bg-purple-100 text-purple-700",
  SENIOR_GUIDE: "bg-blue-100 text-blue-700",
  GUIDE: "bg-green-100 text-green-700",
  TRAINEE: "bg-yellow-100 text-yellow-700",
  DISPATCH: "bg-orange-100 text-orange-700",
  MANAGER: "bg-slate-100 text-slate-700",
};

export function StaffOnDuty({ staff }: { staff: StaffMember[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Staff On Duty ({staff.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-skyline-100 text-xs font-bold text-skyline-700">
              {member.firstName[0]}
              {member.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{member.todayShift}</p>
            </div>
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                roleColors[member.role] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {roleLabels[member.role] ?? member.role}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
