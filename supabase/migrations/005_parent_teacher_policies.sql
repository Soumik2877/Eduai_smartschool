-- Allow profiles to be viewed by teachers and parents
CREATE POLICY "Teachers can view student profiles" ON profiles
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  AND role = 'student'
);

CREATE POLICY "Parents can view child profiles" ON profiles
FOR SELECT USING (
  parent_id = auth.uid()
);

-- Allow assignments to be managed by teachers and viewed by parents
CREATE POLICY "Teachers can manage assignments" ON assignments
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child assignments" ON assignments
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow exams to be managed by teachers and viewed by parents
CREATE POLICY "Teachers can manage exams" ON exams
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child exams" ON exams
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow quiz_sessions to be managed by teachers and viewed by parents
CREATE POLICY "Teachers can manage quiz sessions" ON quiz_sessions
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child quiz sessions" ON quiz_sessions
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow focus_sessions to be viewed by teachers and parents
CREATE POLICY "Teachers can view focus sessions" ON focus_sessions
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child focus sessions" ON focus_sessions
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow performance_records to be managed by teachers and viewed by parents
CREATE POLICY "Teachers can manage performance records" ON performance_records
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child performance records" ON performance_records
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow study_sessions to be viewed by teachers and parents
CREATE POLICY "Teachers can view study sessions" ON study_sessions
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child study sessions" ON study_sessions
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);

-- Allow notifications to be managed by teachers
CREATE POLICY "Teachers can manage notifications" ON notifications
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

-- Allow subjects to be viewed by teachers and parents
CREATE POLICY "Teachers can view subjects" ON subjects
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "Parents can view child subjects" ON subjects
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
);
