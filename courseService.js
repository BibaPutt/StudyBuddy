import { supabase } from './supabaseClient.js';

export class CourseService {
  // Get all active courses with mentor info
  static async getAllCourses(filters = {}) {
    let query = supabase
      .from('courses')
      .select(`
        *,
        mentor:profiles!courses_mentor_id_fkey(
          id,
          full_name,
          avatar_url,
          headline
        ),
        course_reviews(rating)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }
    if (filters.priceMin) {
      query = query.gte('price_per_session', filters.priceMin);
    }
    if (filters.priceMax) {
      query = query.lte('price_per_session', filters.priceMax);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get course by ID with full details
  static async getCourseById(courseId) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        mentor:profiles!courses_mentor_id_fkey(
          id,
          full_name,
          avatar_url,
          headline,
          bio
        ),
        course_reviews(
          id,
          rating,
          review_text,
          created_at,
          student:profiles!course_reviews_student_id_fkey(
            full_name,
            avatar_url
          )
        ),
        course_enrollments(
          id,
          student_id,
          status,
          progress_percentage
        )
      `)
      .eq('id', courseId)
      .single();

    if (error) throw error;
    return data;
  }

  // Enroll in a course
  static async enrollInCourse(courseId, studentId) {
    // First get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('mentor_id, price_per_session')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Create enrollment
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        mentor_id: course.mentor_id,
        coins_paid: course.price_per_session
      })
      .select()
      .single();

    if (error) throw error;

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: studentId,
        amount: -course.price_per_session,
        transaction_type: 'course_enrollment',
        description: `Enrolled in course`,
        course_id: courseId,
        enrollment_id: data.id,
        status: 'completed'
      });

    return data;
  }

  // Get user's enrolled courses
  static async getUserEnrollments(userId) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          id,
          title,
          description,
          course_image_url,
          total_sessions,
          mentor:profiles!courses_mentor_id_fkey(
            full_name,
            avatar_url
          )
        ),
        course_sessions(
          id,
          session_number,
          title,
          scheduled_start,
          scheduled_end,
          status
        )
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get mentor's courses
  static async getMentorCourses(mentorId) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_enrollments(
          id,
          student_id,
          status,
          student:profiles!course_enrollments_student_id_fkey(
            full_name,
            avatar_url
          )
        )
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create new course
  static async createCourse(courseData, mentorId) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        mentor_id: mentorId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update course
  static async updateCourse(courseId, updates) {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get course messages
  static async getCourseMessages(courseId) {
    const { data, error } = await supabase
      .from('course_messages')
      .select(`
        *,
        sender:profiles!course_messages_sender_id_fkey(
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Send course message
  static async sendCourseMessage(courseId, senderId, messageText, messageType = 'text') {
    const { data, error } = await supabase
      .from('course_messages')
      .insert({
        course_id: courseId,
        sender_id: senderId,
        message_text: messageText,
        message_type: messageType
      })
      .select(`
        *,
        sender:profiles!course_messages_sender_id_fkey(
          full_name,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Get course sessions
  static async getCourseSessions(courseId, userId = null) {
    let query = supabase
      .from('course_sessions')
      .select(`
        *,
        course:courses(title),
        enrollment:course_enrollments(
          student:profiles!course_enrollments_student_id_fkey(
            full_name,
            avatar_url
          )
        )
      `)
      .eq('course_id', courseId);

    if (userId) {
      query = query.or(`mentor_id.eq.${userId},enrollment.student_id.eq.${userId}`);
    }

    const { data, error } = await query.order('scheduled_start', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Create course session
  static async createCourseSession(sessionData) {
    const { data, error } = await supabase
      .from('course_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}