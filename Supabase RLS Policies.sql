-- RLS Policy for 'profiles' table
-- Allows a user to view their own profile, and the profiles of their assigned tutor and HOD.
CREATE POLICY "Students can view their own profile, tutor, and HOD"
ON public.profiles FOR SELECT TO authenticated USING (
  (uid() = id) OR
  (EXISTS (SELECT 1 FROM public.students WHERE students.id = uid() AND students.tutor_id = profiles.id)) OR
  (EXISTS (SELECT 1 FROM public.students WHERE students.id = uid() AND students.hod_id = profiles.id))
);

-- RLS Policy for 'batches' table
-- Allows a student to view their own assigned batch.
CREATE POLICY "Students can view their own batch"
ON public.batches FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = uid() AND students.batch_id = batches.id)
);

-- RLS Policy for 'departments' table
-- Allows a student to view their own department (via their batch).
CREATE POLICY "Students can view their own department"
ON public.departments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.batches
    WHERE batches.id = (SELECT batch_id FROM public.students WHERE students.id = uid())
    AND batches.department_id = departments.id
  )
);