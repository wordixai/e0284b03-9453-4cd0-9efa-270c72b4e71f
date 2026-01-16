import { Clock, Calendar, AlertTriangle } from "lucide-react";

interface StatusCardProps {
  lastCheckIn: Date | null;
  streak: number;
  hoursRemaining: number;
}

export function StatusCard({ lastCheckIn, streak, hoursRemaining }: StatusCardProps) {
  const isWarning = hoursRemaining <= 24 && hoursRemaining > 0;
  const isDanger = hoursRemaining <= 0;

  const formatLastCheckIn = (date: Date | null) => {
    if (!date) return '从未签到';
    return date.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="status-card animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Check-in */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">上次签到</p>
            <p className="font-semibold">{formatLastCheckIn(lastCheckIn)}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">连续签到</p>
            <p className="font-semibold">{streak} 天</p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDanger ? 'bg-destructive/10' : isWarning ? 'bg-warning/10' : 'bg-primary/10'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              isDanger ? 'text-destructive' : isWarning ? 'text-warning' : 'text-primary'
            }`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">距离通知还有</p>
            <p className={`font-semibold ${
              isDanger ? 'text-destructive' : isWarning ? 'text-warning' : ''
            }`}>
              {isDanger ? '已超时！' : `${Math.max(0, hoursRemaining)} 小时`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
