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
        <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="mr-2 h-5 w-5" /> Log Workout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              placeholder="Morning Run, Leg Day, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Calories Burned</Label>
              <Input
                id="calories"
                type="number"
                placeholder="300"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How did it go? Any personal records?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Workout
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDialog;
