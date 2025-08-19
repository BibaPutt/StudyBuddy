/*
  # Transform to Course-Oriented Platform Schema

  1. New Tables
    - Enhanced courses table with detailed information
    - Course enrollments for student-course relationships
    - Course sessions for scheduled classes
    - Course messages for course-specific communication
    - User profiles with role-based access

  2. Security
    - Enable RLS on all tables
    - Add policies for students and mentors
    - Ensure proper access control

  3. Changes
    - Courses become the primary entity
    - Sessions are tied to courses
    - Messages are course-specific
    - Bookings become course enrollments
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  excel_coin_balance integer DEFAULT 0,
  phone_number text,
  date_of_birth date,
  location jsonb,
  languages text[],
  timezone text DEFAULT 'Asia/Kolkata',
  is_verified boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  bio text DEFAULT '',
  headline text DEFAULT ''
);

-- Enhanced courses table (primary entity)
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  short_description text DEFAULT '',
  subject text NOT NULL,
  category text DEFAULT '',
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer DEFAULT 60,
  price_per_session integer DEFAULT 0,
  total_sessions integer DEFAULT 1,
  is_group_session boolean DEFAULT false,
  max_participants integer DEFAULT 1,
  language text DEFAULT 'English',
  prerequisites text DEFAULT '',
  learning_objectives text[] DEFAULT '{}',
  materials_needed text[] DEFAULT '{}',
  course_image_url text DEFAULT '',
  demo_video_url text DEFAULT '',
  is_active boolean DEFAULT true,
  enrollment_count integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0
);

-- Course enrollments (replaces bookings for course-first approach)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  coins_paid integer DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0,
  UNIQUE(student_id, course_id)
);

-- Course sessions (scheduled classes within courses)
CREATE TABLE IF NOT EXISTS course_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_number integer DEFAULT 1,
  title text DEFAULT '',
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  daily_room_url text DEFAULT '',
  daily_room_id text DEFAULT '',
  session_recording_url text DEFAULT '',
  session_notes text DEFAULT '',
  homework_assigned text DEFAULT '',
  homework_submitted text DEFAULT ''
);

-- Course messages (course-specific communication)
CREATE TABLE IF NOT EXISTS course_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'announcement')),
  file_url text DEFAULT '',
  is_announcement boolean DEFAULT false,
  parent_message_id uuid REFERENCES course_messages(id) ON DELETE CASCADE
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  is_verified boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  UNIQUE(student_id, course_id)
);

-- Transactions (updated for course-first)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('coin_purchase', 'course_enrollment', 'refund', 'bonus', 'payout', 'penalty')),
  description text DEFAULT '',
  reference_id text DEFAULT '',
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE SET NULL,
  razorpay_payment_id text DEFAULT '',
  razorpay_order_id text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata jsonb DEFAULT '{}'
);

-- Notifications (updated for course-first)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('course', 'session', 'payment', 'review', 'system', 'announcement')),
  is_read boolean DEFAULT false,
  action_url text DEFAULT '',
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Published courses are viewable by everyone" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can create courses" ON courses FOR INSERT WITH CHECK (auth.uid() = mentor_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "Mentors can update their own courses" ON courses FOR UPDATE USING (auth.uid() = mentor_id);
CREATE POLICY "Mentors can delete their own courses" ON courses FOR DELETE USING (auth.uid() = mentor_id);

-- Course enrollments policies
CREATE POLICY "Students can enroll in courses" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students and mentors can view enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = student_id OR auth.uid() = mentor_id);
CREATE POLICY "Students and mentors can update enrollments" ON course_enrollments FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Course sessions policies
CREATE POLICY "Enrolled students and mentors can view sessions" ON course_sessions FOR SELECT USING (
  auth.uid() = mentor_id OR 
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = course_sessions.course_id AND student_id = auth.uid())
);
CREATE POLICY "Mentors can manage course sessions" ON course_sessions FOR ALL USING (auth.uid() = mentor_id);

-- Course messages policies
CREATE POLICY "Course participants can view messages" ON course_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = course_messages.course_id AND student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM courses WHERE id = course_messages.course_id AND mentor_id = auth.uid())
);
CREATE POLICY "Course participants can send messages" ON course_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = course_messages.course_id AND student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM courses WHERE id = course_messages.course_id AND mentor_id = auth.uid())
  )
);

-- Course reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON course_reviews FOR SELECT USING (true);
CREATE POLICY "Enrolled students can create reviews" ON course_reviews FOR INSERT WITH CHECK (
  auth.uid() = student_id AND 
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = course_reviews.course_id AND student_id = auth.uid())
);
CREATE POLICY "Students can update their own reviews" ON course_reviews FOR UPDATE USING (auth.uid() = student_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Functions for updating course stats
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment count
  UPDATE courses 
  SET enrollment_count = (
    SELECT COUNT(*) FROM course_enrollments 
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND status = 'active'
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM course_reviews 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    total_reviews = (
      SELECT COUNT(*) FROM course_reviews 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_course_enrollment_stats
  AFTER INSERT OR UPDATE OR DELETE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();

CREATE TRIGGER update_course_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON course_reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- Insert sample data
INSERT INTO profiles (id, full_name, role, avatar_url, bio, headline) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Sarah Chen', 'mentor', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'Expert in Python & Data Science with 8+ years experience', 'Senior Software Engineer at Google'),
  ('22222222-2222-2222-2222-222222222222', 'Prof. Rajesh Kumar', 'mentor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Mathematics Professor with 15+ years teaching experience', 'Mathematics Professor at IIT Delhi'),
  ('33333333-3333-3333-3333-333333333333', 'Alex Johnson', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face', 'Computer Science student passionate about AI', 'CS Student'),
  ('44444444-4444-4444-4444-444444444444', 'Priya Singh', 'student', 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?w=150&h=150&fit=crop&crop=face', 'Web development enthusiast', 'Frontend Developer');

INSERT INTO courses (id, mentor_id, title, description, short_description, subject, category, difficulty_level, duration_minutes, price_per_session, total_sessions, course_image_url, demo_video_url, learning_objectives, materials_needed) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Python for Data Science Mastery', 'Complete course covering Python fundamentals, data manipulation with pandas, visualization with matplotlib, and machine learning basics. Perfect for beginners who want to start their data science journey.', 'Learn Python for data science from scratch with hands-on projects', 'Python', 'Programming', 'beginner', 90, 1500, 12, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop', 'https://example.com/demo1.mp4', ARRAY['Master Python syntax and data structures', 'Learn pandas for data manipulation', 'Create visualizations with matplotlib', 'Build your first ML model'], ARRAY['Python 3.8+', 'Jupyter Notebook', 'Basic math knowledge']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Advanced Machine Learning', 'Deep dive into neural networks, deep learning, and advanced ML algorithms. Includes hands-on projects with TensorFlow and PyTorch.', 'Master advanced ML concepts with real-world projects', 'Machine Learning', 'Programming', 'advanced', 120, 2500, 16, 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop', 'https://example.com/demo2.mp4', ARRAY['Understand neural network architectures', 'Implement deep learning models', 'Work with TensorFlow and PyTorch', 'Deploy ML models to production'], ARRAY['Python knowledge', 'Basic ML understanding', 'Linear algebra basics']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Calculus Fundamentals', 'Comprehensive calculus course covering limits, derivatives, integrals, and their applications. Designed for students preparing for competitive exams.', 'Master calculus concepts with step-by-step guidance', 'Mathematics', 'Mathematics', 'intermediate', 75, 1200, 10, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop', 'https://example.com/demo3.mp4', ARRAY['Understand limits and continuity', 'Master differentiation techniques', 'Learn integration methods', 'Apply calculus to real problems'], ARRAY['Basic algebra', 'Trigonometry knowledge', 'Graphing calculator']);

INSERT INTO course_enrollments (student_id, course_id, mentor_id, coins_paid, progress_percentage) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1500, 25),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1500, 10),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 1200, 60);

INSERT INTO course_sessions (course_id, enrollment_id, mentor_id, session_number, title, scheduled_start, scheduled_end, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM course_enrollments WHERE student_id = '33333333-3333-3333-3333-333333333333' AND course_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), '11111111-1111-1111-1111-111111111111', 1, 'Python Basics', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '90 minutes', 'scheduled'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM course_enrollments WHERE student_id = '44444444-4444-4444-4444-444444444444' AND course_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), '11111111-1111-1111-1111-111111111111', 1, 'Python Basics', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', 'scheduled');

INSERT INTO course_reviews (course_id, student_id, mentor_id, rating, review_text) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 5, 'Amazing course! Dr. Chen explains everything so clearly and the projects are really helpful.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 5, 'Prof. Kumar makes calculus so much easier to understand. Highly recommended!');