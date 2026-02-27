CREATE TABLE public.nutrition_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_name TEXT NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_nutrition_log_user_date ON public.nutrition_log(user_id, date);

ALTER TABLE public.nutrition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own log" ON public.nutrition_log
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_nutrition_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  calorie_target NUMERIC,
  protein_g_target NUMERIC,
  carbs_g_target NUMERIC,
  fat_g_target NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own targets" ON public.user_nutrition_targets
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
