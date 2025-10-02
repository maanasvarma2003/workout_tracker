-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create exercises library table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- strength, cardio, flexibility, etc.
  muscle_group TEXT, -- chest, legs, back, etc.
  difficulty TEXT, -- beginner, intermediate, advanced
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  workout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_exercises join table (stores sets, reps, weight for each exercise in a workout)
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 1,
  reps INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT, -- kg, reps, minutes, etc.
  target_date DATE,
  achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for exercises (public library, everyone can read)
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- RLS Policies for workouts
CREATE POLICY "Users can view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can create own workout exercises" ON public.workout_exercises FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample exercises
INSERT INTO public.exercises (name, description, category, muscle_group, difficulty) VALUES
  ('Push-ups', 'Classic upper body exercise', 'strength', 'chest', 'beginner'),
  ('Squats', 'Lower body compound movement', 'strength', 'legs', 'beginner'),
  ('Pull-ups', 'Upper body pulling exercise', 'strength', 'back', 'intermediate'),
  ('Plank', 'Core stability exercise', 'strength', 'core', 'beginner'),
  ('Deadlift', 'Full body compound lift', 'strength', 'back', 'intermediate'),
  ('Bench Press', 'Chest compound movement', 'strength', 'chest', 'intermediate'),
  ('Running', 'Cardiovascular endurance', 'cardio', 'full body', 'beginner'),
  ('Lunges', 'Single leg strength', 'strength', 'legs', 'beginner'),
  ('Shoulder Press', 'Overhead pressing movement', 'strength', 'shoulders', 'intermediate'),
  ('Bicep Curls', 'Isolation arm exercise', 'strength', 'arms', 'beginner');