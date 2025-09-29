CREATE POLICY "Students can view their own department"
ON public.departments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.batches
    WHERE batches.id = (SELECT batch_id FROM public.students WHERE students.id = auth.uid())
    AND batches.department_id = departments.id
  )
);