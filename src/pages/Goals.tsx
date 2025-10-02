import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CircularProgress from "@/components/CircularProgress";
import { Dumbbell, LogOut, Plus, Target, Trophy, Calendar, Loader2 } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date: string;
  achieved: boolean;
}

const Goals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    target_value: "",
    current_value: "",
    unit: "",
    target_date: "",
  });

  useEffect(() => {
    checkAuth();
    fetchGoals();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading goals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: formData.title,
        target_value: parseFloat(formData.target_value),
        current_value: parseFloat(formData.current_value || "0"),
        unit: formData.unit,
        target_date: formData.target_date || null,
      });

      if (error) throw error;

      toast({
        title: "Goal created!",
        description: "Your goal has been added successfully.",
      });

      setDialogOpen(false);
      setFormData({ title: "", target_value: "", current_value: "", unit: "", target_date: "" });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fitness Goals
              </h1>
              <p className="text-xs text-muted-foreground">{activeGoals.length} active goals</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/exercises")}>
              Exercises
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Add Goal Button */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="mr-2 h-5 w-5" /> Create New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Lose 10kg, Run 5km"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target Value</Label>
                    <Input
                      id="target"
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="kg, reps, km"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Value</Label>
                    <Input
                      id="current"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.current_value}
                      onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Target Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Goals */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Active Goals
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal, index) => (
                    <Card 
                      key={goal.id}
                      className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-slide-up overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <CardHeader className="relative">
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {goal.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="relative flex flex-col items-center gap-4">
                        <CircularProgress
                          value={goal.current_value}
                          max={goal.target_value}
                          label={goal.unit}
                          className="animate-scale-in"
                        />

                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current:</span>
                            <span className="font-semibold">{goal.current_value} {goal.unit}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-semibold">{goal.target_value} {goal.unit}</span>
                          </div>
                          {goal.target_date && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deadline:</span>
                              <span className="font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(goal.target_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {achievedGoals.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Achieved Goals
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {achievedGoals.map((goal) => (
                    <Card key={goal.id} className="border-green-500/20 bg-green-500/5">
                      <CardHeader>
                        <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          {goal.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Completed: {goal.target_value} {goal.unit}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {goals.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
                <p className="text-muted-foreground mb-6">Create your first fitness goal to start tracking progress</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Goals;
