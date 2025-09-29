CREATE POLICY "Students can view their own student record"
ON public.students FOR SELECT TO authenticated USING (
  (id = auth.uid())
);