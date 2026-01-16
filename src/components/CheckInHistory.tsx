import { CheckCircle2 } from "lucide-react";

interface CheckInHistoryProps {
  history: Date[];
}

export function CheckInHistory({ history }: CheckInHistoryProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const isCheckedOn = (date: Date) => {
    return history.some(h => {
      const checkDate = new Date(h);
      return (
        checkDate.getDate() === date.getDate() &&
        checkDate.getMonth() === date.getMonth() &&
        checkDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    return date.toLocaleDateString('zh-CN', { weekday: 'short' });
  };

  return (
    <div className="status-card animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">签到记录</h3>

      <div className="flex justify-between gap-2">
        {last7Days.map((date, index) => {
          const checked = isCheckedOn(date);
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${checked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {checked ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm">{date.getDate()}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatDay(date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
