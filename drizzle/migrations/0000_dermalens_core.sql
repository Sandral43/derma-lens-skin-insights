CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  pet_name text NOT NULL DEFAULT 'Sunny',
  skin_type text,
  concerns text[] NOT NULL DEFAULT '{}',
  sensitivity text,
  routine_level text,
  avoid_ingredients text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  daily_reminders boolean NOT NULL DEFAULT true,
  pet_messages boolean NOT NULL DEFAULT true,
  share_profile_with_pet boolean NOT NULL DEFAULT true,
  save_scan_photos boolean NOT NULL DEFAULT false,
  morning_reminder time NOT NULL DEFAULT '08:00',
  evening_reminder time NOT NULL DEFAULT '21:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  period text NOT NULL CHECK (period IN ('morning', 'evening')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  product text NOT NULL DEFAULT '' CHECK (char_length(product) <= 80),
  icon text NOT NULL DEFAULT 'drop',
  reward integer NOT NULL DEFAULT 5 CHECK (reward BETWEEN 1 AND 20),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quests_user_idx ON public.quests (user_id, period, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own quests select" ON public.quests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own quests insert" ON public.quests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own quests update" ON public.quests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own quests delete" ON public.quests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.quest_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  period text NOT NULL DEFAULT 'morning' CHECK (period IN ('morning', 'evening')),
  reward integer NOT NULL DEFAULT 5,
  completed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quest_id, completed_on)
);
CREATE INDEX quest_completions_user_idx ON public.quest_completions (user_id, completed_on);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_completions TO authenticated;
GRANT ALL ON public.quest_completions TO service_role;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own completions select" ON public.quest_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own completions insert" ON public.quest_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own completions delete" ON public.quest_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Copy period and reward from the quest so coins can't be inflated from the browser
CREATE OR REPLACE FUNCTION public.fill_completion_from_quest()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE q record;
BEGIN
  SELECT period, reward, user_id INTO q FROM public.quests WHERE id = NEW.quest_id;
  IF NOT FOUND OR q.user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;
  NEW.period := q.period;
  NEW.reward := q.reward;
  IF NEW.completed_on > (now() AT TIME ZONE 'utc')::date + 1 OR NEW.completed_on < (now() AT TIME ZONE 'utc')::date - 1 THEN
    RAISE EXCEPTION 'Quests can only be checked off for today';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER quest_completions_fill BEFORE INSERT ON public.quest_completions FOR EACH ROW EXECUTE FUNCTION public.fill_completion_from_quest();

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  scanned_on date NOT NULL,
  hydration integer NOT NULL CHECK (hydration BETWEEN 0 AND 100),
  texture integer NOT NULL CHECK (texture BETWEEN 0 AND 100),
  clarity integer NOT NULL CHECK (clarity BETWEEN 0 AND 100),
  summary text NOT NULL DEFAULT '',
  tips text[] NOT NULL DEFAULT '{}',
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scans_user_idx ON public.scans (user_id, scanned_on);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own scans select" ON public.scans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own scans insert" ON public.scans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own scans update" ON public.scans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own scans delete" ON public.scans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_products (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_products TO authenticated;
GRANT ALL ON public.saved_products TO service_role;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved select" ON public.saved_products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own saved insert" ON public.saved_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own saved delete" ON public.saved_products FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Own skin photos select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own skin photos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own skin photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);