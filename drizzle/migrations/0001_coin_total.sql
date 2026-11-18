CREATE OR REPLACE FUNCTION public.coin_total()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(reward), 0)::integer FROM public.quest_completions WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.coin_total() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coin_total() TO authenticated;