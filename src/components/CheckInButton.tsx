import { Heart } from "lucide-react";

interface CheckInButtonProps {
  isCheckedToday: boolean;
  onCheckIn: () => void;
  isLoading?: boolean;
}

export function CheckInButton({ isCheckedToday, onCheckIn, isLoading }: CheckInButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring animation */}
      {!isCheckedToday && (
        <div className="absolute w-48 h-48 rounded-full bg-primary/30 animate-pulse-ring" />
      )}

      <button
        onClick={onCheckIn}
        disabled={isCheckedToday || isLoading}
        className={`
          relative w-48 h-48 rounded-full font-bold text-xl
          shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-2
          ${isCheckedToday
            ? 'bg-muted text-muted-foreground cursor-default'
            : 'bg-primary text-primary-foreground hover:shadow-xl hover:scale-105 active:scale-95 animate-heartbeat'
          }
          disabled:opacity-70
        `}
      >
        <Heart className={`w-12 h-12 ${isCheckedToday ? '' : 'fill-current'}`} />
        <span>{isCheckedToday ? '今日已签到' : '我还活着'}</span>
      </button>
    </div>
  );
}
