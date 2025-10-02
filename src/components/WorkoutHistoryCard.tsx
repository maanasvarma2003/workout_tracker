import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, TrendingUp } from "lucide-react";

interface WorkoutHistoryCardProps {
  workout: {
    id: string;
    title: string;
    duration_minutes: number;
    calories_burned: number;
    workout_date: string;
    notes?: string;
  };
  index: number;
}

const WorkoutHistoryCard = ({ workout, index }: WorkoutHistoryCardProps) => {
  return (
    <Card 
      className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              {workout.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(workout.workout_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            Completed
          </Badge>
        </div>

        <div className="flex gap-6">
          {workout.duration_minutes && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{workout.duration_minutes}m</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
          )}

          {workout.calories_burned && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Flame className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-semibold">{workout.calories_burned}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
            </div>
          )}
        </div>

        {workout.notes && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground italic">"{workout.notes}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutHistoryCard;
