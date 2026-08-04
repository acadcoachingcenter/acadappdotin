// Auto-generated from base44 entity export. table = D1 table name,
// columns = all writable columns, array_fields/bool_fields need JSON/int coercion.
export const ENTITY_CONFIG = {
  Assignment: {
    table: "assignments",
    columns: ["course_id", "tutor_id", "title", "description", "due_date", "max_marks", "attachment_url", "type", "status"],
    arrayFields: [],
    boolFields: [],
  },
  Attendance: {
    table: "attendance",
    columns: ["student_id", "student_name", "student_email", "course_id", "course_name", "tutor_id", "tutor_name", "parent_id", "parent_name", "class_date", "class_time", "student_marked", "student_marked_at", "tutor_marked", "tutor_marked_at", "parent_marked", "parent_marked_at", "final_status", "remarks"],
    arrayFields: [],
    boolFields: [],
  },
  BookPurchase: {
    table: "book_purchases",
    columns: ["book_id", "book_title", "user_id", "user_email", "user_name", "payment_proof_url", "amount_paid", "status", "purchase_date", "approved_date", "admin_remarks"],
    arrayFields: [],
    boolFields: [],
  },
  Course: {
    table: "courses",
    columns: ["title", "description", "tutor_id", "tutor_name", "subject", "grade_level", "price", "original_price", "offer_end_date", "duration_weeks", "max_students", "enrolled_students", "status"],
    arrayFields: [],
    boolFields: [],
  },
  Enrollment: {
    table: "enrollments",
    columns: ["student_id", "student_name", "student_email", "student_whatsapp", "course_id", "course_name", "tutor_id", "tutor_name", "amount_paid", "payment_transaction_id", "payment_receipt_url", "status", "enrollment_date", "remarks"],
    arrayFields: [],
    boolFields: [],
  },
  Event: {
    table: "events",
    columns: ["title", "description", "event_date", "category", "images", "is_published", "view_count"],
    arrayFields: ["images"],
    boolFields: ["is_published"],
  },
  ExamLevel: {
    table: "exam_levels",
    columns: ["name", "description", "difficulty_level"],
    arrayFields: [],
    boolFields: [],
  },
  HomeTutor: {
    table: "home_tutors",
    columns: ["tutor_id", "tutor_name", "tutor_email", "subjects", "grades", "experience_years", "teaching_mode", "availability", "latitude", "longitude", "address", "travel_radius_km", "hourly_rate", "bio", "rating", "rating_count", "status", "approval_status", "subscription_plan", "subscription_start_date", "subscription_end_date"],
    arrayFields: ["subjects", "grades"],
    boolFields: [],
  },
  Inquiry: {
    table: "inquiries",
    columns: ["student_name", "parent_name", "email", "phone", "grade_class", "subjects_interested", "message", "status", "inquiry_date"],
    arrayFields: ["subjects_interested"],
    boolFields: [],
  },
  LiveClass: {
    table: "live_classes",
    columns: ["course_id", "tutor_id", "title", "description", "scheduled_date", "duration_minutes", "meeting_link", "recording_url", "whiteboard_data", "status", "attendees", "materials"],
    arrayFields: ["attendees", "materials"],
    boolFields: [],
  },
  MockTest: {
    table: "mock_tests",
    columns: ["level_id", "title", "duration_minutes", "total_marks", "difficulty", "questions"],
    arrayFields: [],
    boolFields: [],
  },
  OnlineBook: {
    table: "online_books",
    columns: ["title", "author", "description", "cover_image_url", "pdf_url", "flipbook_url", "preview_flipbook_url", "price", "payment_link", "total_pages", "subject", "grade_level", "is_published"],
    arrayFields: [],
    boolFields: ["is_published"],
  },
  QuestionPaper: {
    table: "question_papers",
    columns: ["title", "subject", "grade_level", "difficulty", "total_marks", "duration_minutes", "topics", "question_distribution", "paper_content", "instructions", "status"],
    arrayFields: ["topics", "instructions"],
    boolFields: [],
  },
  Review: {
    table: "reviews",
    columns: ["tutor_id", "student_id", "course_id", "rating", "comment", "is_verified"],
    arrayFields: [],
    boolFields: ["is_verified"],
  },
  StudentProgress: {
    table: "student_progress",
    columns: ["student_id", "course_id", "tutor_id", "subject", "test_name", "score_obtained", "max_score", "percentage", "attendance_date", "was_present", "progress_type", "remarks", "recorded_date"],
    arrayFields: [],
    boolFields: ["was_present"],
  },
  StudentSubmission: {
    table: "student_submissions",
    columns: ["user_id", "level_id", "submission_type", "content", "ai_score", "ai_feedback", "weaknesses"],
    arrayFields: [],
    boolFields: [],
  },
  StudyMaterial: {
    table: "study_materials",
    columns: ["course_id", "tutor_id", "title", "description", "file_url", "file_type"],
    arrayFields: [],
    boolFields: [],
  },
  Submission: {
    table: "submissions",
    columns: ["assignment_id", "student_id", "submission_date", "content", "attachment_url", "marks_obtained", "feedback", "status", "is_late"],
    arrayFields: [],
    boolFields: ["is_late"],
  },
  Topic: {
    table: "topics",
    columns: ["level_id", "category", "title", "content", "examples", "exam_tips"],
    arrayFields: [],
    boolFields: [],
  },
  TuitionRequest: {
    table: "tuition_requests",
    columns: ["parent_id", "parent_name", "student_grade", "subjects", "location", "address_details", "latitude", "longitude", "travel_radius_km", "additional_details", "status", "interested_tutors"],
    arrayFields: ["subjects", "interested_tutors"],
    boolFields: [],
  },
  TutorInterest: {
    table: "tutor_interests",
    columns: ["tutor_id", "tutor_name", "student_id", "student_name", "student_email", "message", "status", "date"],
    arrayFields: [],
    boolFields: [],
  },
  User: {
    table: "users",
    columns: ["email", "full_name", "phone", "user_type", "is_verified", "grade_class", "school_name", "syllabus", "subjects_interested", "location", "profile_image", "bio", "qualifications", "subjects_teaching", "experience_years", "hourly_rate", "rating", "total_students", "children_ids"],
    arrayFields: ["subjects_interested", "qualifications", "subjects_teaching", "children_ids"],
    boolFields: ["is_verified"],
  },
};

// Entities anyone can READ without logging in (public catalog / marketing pages)
export const PUBLIC_READ = new Set([
  "Course",
  "OnlineBook",
  "Event",
  "ExamLevel",
  "Topic",
  "Review",
  "MockTest",
  "HomeTutor",
]);

export const PUBLIC_CREATE = new Set([
  "Inquiry",
  "TuitionRequest",
  "HomeTutor",
]);
