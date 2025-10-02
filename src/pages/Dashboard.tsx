import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/StatsCard";
import WorkoutChart from "@/components/WorkoutChart";
import WorkoutDialog from "@/components/WorkoutDialog";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  Flame, 
  LogOut,
  Activity,
  Target,
  BookOpen,
  BarChart3
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
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/50">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FitTrack
              </h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/exercises")} className="hover:scale-105 transition-transform">
              <BookOpen className="mr-2 h-4 w-4" /> Exercises
            </Button>
            <Button variant="outline" onClick={() => navigate("/goals")} className="hover:scale-105 transition-transform">
              <Target className="mr-2 h-4 w-4" /> Goals
            </Button>
            <Button variant="outline" onClick={handleLogout} className="hover:scale-105 transition-transform">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="animate-slide-up" style={{ animationDelay: "0s" }}>
            <StatsCard
              title="Total Workouts"
              value={totalWorkouts}
              icon={Activity}
              trend={`${totalWorkouts} sessions logged`}
              className="hover:scale-105 transition-transform"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <StatsCard
              title="Total Duration"
              value={`${totalDuration}m`}
              icon={Calendar}
              trend={`Avg ${avgDuration}m per workout`}
              className="hover:scale-105 transition-transform"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <StatsCard
              title="Calories Burned"
              value={totalCalories.toLocaleString()}
              icon={Flame}
              className="bg-gradient-to-br from-secondary/10 to-secondary/5 hover:scale-105 transition-transform"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <StatsCard
              title="Weekly Average"
              value={`${Math.round(totalWorkouts / 4)}x`}
              icon={TrendingUp}
              trend="Keep up the great work!"
              className="hover:scale-105 transition-transform"
            />
          </div>
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
        <Card className="animate-slide-up border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg" />
                  </div>
                ))}
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Dumbbell className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-muted-foreground mb-6">Start your fitness journey today!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.slice(0, 5).map((workout, index) => (
                  <WorkoutHistoryCard key={workout.id} workout={workout} index={index} />
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
