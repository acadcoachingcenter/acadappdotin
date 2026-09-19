-- ACAD D1 schema, generated from base44 entity exports

-- Entity: Assignment
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  course_id TEXT,
  tutor_id TEXT,
  title TEXT,
  description TEXT,
  due_date TEXT,
  max_marks REAL,
  attachment_url TEXT,
  type TEXT,
  status TEXT
);

-- Entity: Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  course_id TEXT,
  course_name TEXT,
  tutor_id TEXT,
  tutor_name TEXT,
  parent_id TEXT,
  parent_name TEXT,
  class_date TEXT,
  class_time TEXT,
  student_marked TEXT,
  student_marked_at TEXT,
  tutor_marked TEXT,
  tutor_marked_at TEXT,
  parent_marked TEXT,
  parent_marked_at TEXT,
  final_status TEXT,
  remarks TEXT
);

-- Entity: BookPurchase
CREATE TABLE IF NOT EXISTS book_purchases (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  book_id TEXT,
  book_title TEXT,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  payment_proof_url TEXT,
  amount_paid REAL,
  status TEXT,
  purchase_date TEXT,
  approved_date TEXT,
  admin_remarks TEXT
);

-- Entity: Course
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  title TEXT,
  description TEXT,
  tutor_id TEXT,
  tutor_name TEXT,
  subject TEXT,
  grade_level TEXT,
  price REAL,
  original_price REAL,
  offer_end_date TEXT,
  duration_weeks REAL,
  max_students REAL,
  enrolled_students REAL,
  status TEXT
);

-- Entity: Enrollment
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  student_whatsapp TEXT,
  course_id TEXT,
  course_name TEXT,
  tutor_id TEXT,
  tutor_name TEXT,
  amount_paid REAL,
  payment_transaction_id TEXT,
  payment_receipt_url TEXT,
  status TEXT,
  enrollment_date TEXT,
  remarks TEXT
);

-- Entity: TutorPayment
CREATE TABLE IF NOT EXISTS tutor_payments (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  tutor_id TEXT,
  tutor_name TEXT,
  amount REAL,
  payment_date TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT
);

-- Entity: Expense
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  category TEXT,
  description TEXT,
  amount REAL,
  expense_date TEXT,
  vendor TEXT,
  payment_method TEXT,
  notes TEXT
);

-- Entity: Event
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  title TEXT,
  description TEXT,
  event_date TEXT,
  category TEXT,
  images TEXT,
  is_published INTEGER,
  view_count REAL
);

-- Entity: ExamLevel
CREATE TABLE IF NOT EXISTS exam_levels (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  name TEXT,
  description TEXT,
  difficulty_level TEXT
);

-- Entity: HomeTutor
CREATE TABLE IF NOT EXISTS home_tutors (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  tutor_id TEXT,
  tutor_name TEXT,
  tutor_email TEXT,
  subjects TEXT,
  grades TEXT,
  experience_years REAL,
  teaching_mode TEXT,
  availability TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  travel_radius_km REAL,
  hourly_rate REAL,
  bio TEXT,
  rating REAL,
  rating_count REAL,
  status TEXT,
  approval_status TEXT,
  subscription_plan TEXT,
  subscription_start_date TEXT,
  subscription_end_date TEXT
);

-- Entity: Inquiry
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  student_name TEXT,
  parent_name TEXT,
  email TEXT,
  phone TEXT,
  grade_class TEXT,
  subjects_interested TEXT,
  message TEXT,
  status TEXT,
  inquiry_date TEXT
);

-- Entity: LiveClass
CREATE TABLE IF NOT EXISTS live_classes (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  course_id TEXT,
  tutor_id TEXT,
  title TEXT,
  description TEXT,
  scheduled_date TEXT,
  duration_minutes REAL,
  meeting_link TEXT,
  recording_url TEXT,
  whiteboard_data TEXT,
  status TEXT,
  attendees TEXT,
  materials TEXT
);

-- Entity: MockTest
CREATE TABLE IF NOT EXISTS mock_tests (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  level_id TEXT,
  title TEXT,
  duration_minutes TEXT,
  total_marks TEXT,
  difficulty TEXT,
  questions TEXT
);

-- Entity: OnlineBook
CREATE TABLE IF NOT EXISTS online_books (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  title TEXT,
  author TEXT,
  description TEXT,
  cover_image_url TEXT,
  pdf_url TEXT,
  flipbook_url TEXT,
  preview_flipbook_url TEXT,
  price REAL,
  payment_link TEXT,
  total_pages REAL,
  subject TEXT,
  grade_level TEXT,
  is_published INTEGER
);

-- Entity: QuestionPaper
CREATE TABLE IF NOT EXISTS question_papers (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  title TEXT,
  subject TEXT,
  grade_level TEXT,
  difficulty TEXT,
  total_marks REAL,
  duration_minutes REAL,
  topics TEXT,
  question_distribution TEXT,
  paper_content TEXT,
  instructions TEXT,
  status TEXT
);

-- Entity: Review
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  tutor_id TEXT,
  student_id TEXT,
  course_id TEXT,
  rating REAL,
  comment TEXT,
  is_verified INTEGER
);

-- Entity: StudentProgress
CREATE TABLE IF NOT EXISTS student_progress (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  student_id TEXT,
  course_id TEXT,
  tutor_id TEXT,
  subject TEXT,
  test_name TEXT,
  score_obtained REAL,
  max_score REAL,
  percentage REAL,
  attendance_date TEXT,
  was_present INTEGER,
  progress_type TEXT,
  remarks TEXT,
  recorded_date TEXT
);

-- Entity: StudentSubmission
CREATE TABLE IF NOT EXISTS student_submissions (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  user_id TEXT,
  level_id TEXT,
  submission_type TEXT,
  content TEXT,
  ai_score REAL,
  ai_feedback TEXT,
  weaknesses TEXT
);

-- Entity: StudyMaterial
CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  course_id TEXT,
  tutor_id TEXT,
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_type TEXT
);

-- Entity: Submission
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  assignment_id TEXT,
  student_id TEXT,
  submission_date TEXT,
  content TEXT,
  attachment_url TEXT,
  marks_obtained REAL,
  feedback TEXT,
  status TEXT,
  is_late INTEGER
);

-- Entity: Topic
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  level_id TEXT,
  category TEXT,
  title TEXT,
  content TEXT,
  examples TEXT,
  exam_tips TEXT
);

-- Entity: TuitionRequest
CREATE TABLE IF NOT EXISTS tuition_requests (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  parent_id TEXT,
  parent_name TEXT,
  student_grade TEXT,
  subjects TEXT,
  location TEXT,
  address_details TEXT,
  latitude REAL,
  longitude REAL,
  travel_radius_km REAL,
  additional_details TEXT,
  status TEXT,
  interested_tutors TEXT
);

-- Entity: TutorInterest
CREATE TABLE IF NOT EXISTS tutor_interests (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  tutor_id TEXT,
  tutor_name TEXT,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  message TEXT,
  status TEXT,
  date TEXT
);

-- Entity: User
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  user_type TEXT,
  is_verified INTEGER,
  grade_class TEXT,
  school_name TEXT,
  syllabus TEXT,
  subjects_interested TEXT,
  location TEXT,
  profile_image TEXT,
  bio TEXT,
  qualifications TEXT,
  subjects_teaching TEXT,
  experience_years REAL,
  hourly_rate REAL,
  rating REAL,
  total_students REAL,
  children_ids TEXT
);

-- Entity: SubjectClassroom
-- Permanent, subject-wise Google Meet links (one per subject, shared across
-- grades 6-12 given current student volume). These are the manual fallback
-- classroom links tutors/students use if the Calendar -> WhatsApp automatic
-- notification for a specific class ever fails to deliver a link in time.
CREATE TABLE IF NOT EXISTS subject_classrooms (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  subject TEXT,
  meet_link TEXT,
  grade_range TEXT,
  display_order REAL,
  is_active INTEGER
);

-- Entity: LearningResource
-- Admin-managed list of external learning websites/tools shown in the
-- "Learning Websites" sidebar section for tutors and students. The frontend
-- (Layout.jsx, AdminLearningResources.jsx) already reads/writes this entity --
-- this table was the missing piece; it was never created after the entity
-- was added to apiClient.js and worker/entityConfig.js (but not this deployed
-- copy), so the feature has been silently returning nothing since it shipped.
CREATE TABLE IF NOT EXISTS learning_resources (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  title TEXT,
  url TEXT,
  display_order REAL,
  is_active INTEGER
);

-- Entity: GradeMeQuestion
-- Self-grade practice questions for the "GradeMe" feature. AI-drafted from
-- SchoolBook's ingested NCERT chapter content (source='ai', status='pending'),
-- reviewed and approved by an admin before students can see them
-- (status='approved'). Manually authored questions use source='manual'.
CREATE TABLE IF NOT EXISTS grademe_questions (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  subject TEXT,
  chapter TEXT,
  chapter_title TEXT,
  question TEXT,
  options TEXT,
  correct_index INTEGER,
  explanation TEXT,
  difficulty TEXT,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'ai'
);

-- Fast lookup for the student-facing quiz picker (approved questions for a
-- given subject/chapter) and the admin approval queue (pending questions).
CREATE INDEX IF NOT EXISTS idx_grademe_questions_lookup
  ON grademe_questions (subject, chapter, status);

-- Entity: TopicLog
-- Tutor-logged record of what was actually taught, when, in which course --
-- the foundation for targeting weekly test generation at recently-covered
-- material instead of random chapters. subject/chapter use SchoolBook's
-- ingested-chapter IDs (same ones GradeMe uses) so this plugs directly into
-- the existing chapter-context/generation pipeline.
CREATE TABLE IF NOT EXISTS topic_logs (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  course_id TEXT,
  tutor_id TEXT,
  subject TEXT,
  chapter TEXT,
  chapter_title TEXT,
  class_date TEXT,
  notes TEXT
);

-- Fast lookup for "what's been covered in this course in the last N days" --
-- the query the weekly generator will run.
CREATE INDEX IF NOT EXISTS idx_topic_logs_course_date
  ON topic_logs (course_id, class_date);

-- Entity: FeePayment
-- Monthly fee payment log for the admin "Fees Due" panel. One row per
-- (enrollment_id, period_month) is created when admin marks a month's fee
-- as collected. Due status is NOT stored here -- it's computed on the fly
-- from each active Enrollment's enrollment_date (the day-of-month is the
-- recurring due day), then cross-checked against this table to see which
-- periods are already paid. period_month is 'YYYY-MM'.
CREATE TABLE IF NOT EXISTS fee_payments (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  enrollment_id TEXT,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  student_whatsapp TEXT,
  course_id TEXT,
  course_name TEXT,
  tutor_name TEXT,
  period_month TEXT,
  due_date TEXT,
  amount_paid REAL,
  payment_transaction_id TEXT,
  paid_date TEXT,
  notes TEXT
);

-- Fast lookup for "has this enrollment already been paid for this period" --
-- the exact check the Fees Due panel runs for every active enrollment.
CREATE INDEX IF NOT EXISTS idx_fee_payments_enrollment_period
  ON fee_payments (enrollment_id, period_month);
