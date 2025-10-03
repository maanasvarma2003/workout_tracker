import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";

interface WorkoutDialogProps {
  onWorkoutAdded: () => void;
}

const WorkoutDialog = ({ onWorkoutAdded }: WorkoutDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        title,
        notes,
        duration_minutes: duration ? parseInt(duration) : null,
        calories_burned: calories ? parseInt(calories) : null,
        workout_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Workout logged!",
        description: "Your workout has been successfully recorded.",
      });

      setTitle("");
      setNotes("");
      setDuration("");
      setCalories("");
      setOpen(false);
      onWorkoutAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="shadow-lg hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-accent group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="mr-2 h-5 w-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" /> 
          <span className="relative z-10">Log Workout</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="animate-scale-in backdrop-blur-sm bg-card/95">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Log New Workout
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-slide-right" style={{ animationDelay: '0.1s' }}>
            <Label htmlFor="title" className="text-sm font-medium">Workout Title</Label>
            <Input
              id="title"
              placeholder="Morning Run, Leg Day, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="transition-all focus:ring-2 focus:ring-primary/50 focus:scale-[1.02]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 animate-slide-right" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-primary/50 focus:scale-[1.02]"
              />
            </div>

            <div className="space-y-2 animate-slide-left" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="calories" className="text-sm font-medium">Calories Burned</Label>
              <Input
                id="calories"
                type="number"
                placeholder="300"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-primary/50 focus:scale-[1.02]"
              />
            </div>
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How did it go? Any personal records?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="transition-all focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-glow-strong transition-all duration-300 transform hover:scale-105 animate-slide-up group relative overflow-hidden" 
            style={{ animationDelay: '0.4s' }}
            disabled={loading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />}
            <span className="relative z-10">Save Workout</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDialog;
