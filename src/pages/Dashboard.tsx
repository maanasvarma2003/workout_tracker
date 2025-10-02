import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/StatsCard";
import WorkoutChart from "@/components/WorkoutChart";
import WorkoutDialog from "@/components/WorkoutDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  Flame, 
  LogOut,
  Activity,
  Target
} from "lucide-react";

interface Workout {
  id: string;
  title: string;
  duration_minutes: number;
  calories_burned: number;
  workout_date: string;
  notes: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    fetchWorkouts(session.user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchWorkouts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("workout_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading workouts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  // Prepare chart data
  const chartData = workouts
    .slice(0, 7)
    .reverse()
    .map((w) => ({
      date: new Date(w.workout_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      duration: w.duration_minutes || 0,
      calories: w.calories_burned || 0,
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FitTrack
              </h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-fade-in">
          <StatsCard
            title="Total Workouts"
            value={totalWorkouts}
            icon={Activity}
            trend={`${totalWorkouts} sessions logged`}
          />
          <StatsCard
            title="Total Duration"
            value={`${totalDuration}m`}
            icon={Calendar}
            trend={`Avg ${avgDuration}m per workout`}
          />
          <StatsCard
            title="Calories Burned"
            value={totalCalories.toLocaleString()}
            icon={Flame}
            className="bg-gradient-to-br from-secondary/10 to-secondary/5"
          />
          <StatsCard
            title="Weekly Average"
            value={`${Math.round(totalWorkouts / 4)}x`}
            icon={TrendingUp}
            trend="Keep up the great work!"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <WorkoutDialog onWorkoutAdded={() => user && fetchWorkouts(user.id)} />
        </div>

        {/* Charts */}
        {workouts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mb-8 animate-slide-up">
            <WorkoutChart
              data={chartData}
              title="Workout Duration (Last 7 Days)"
              dataKey="duration"
              type="bar"
            />
            <WorkoutChart
              data={chartData}
              title="Calories Burned (Last 7 Days)"
              dataKey="calories"
              type="line"
            />
          </div>
        )}

        {/* Recent Workouts */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No workouts logged yet. Start your fitness journey today!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.slice(0, 5).map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{workout.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workout.workout_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      {workout.duration_minutes && (
                        <p className="font-semibold">{workout.duration_minutes}m</p>
                      )}
                      {workout.calories_burned && (
                        <p className="text-sm text-muted-foreground">{workout.calories_burned} cal</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
