import { supabase } from './supabaseClient.js';

export class AuthService {
  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Get user profile with role
  static async getUserProfile(userId = null) {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const user = await this.getCurrentUser();
      if (!user) return null;
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) throw error;
    return data;
  }

  // Sign up new user
  static async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      await this.createProfile(data.user.id, userData);
    }

    return data;
  }

  // Sign in user
  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  // Sign out user
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Create user profile
  static async createProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: profileData.full_name || profileData.name || '',
        role: profileData.role || 'student',
        bio: profileData.bio || '',
        headline: profileData.headline || '',
        avatar_url: profileData.avatar_url || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if user is mentor
  static async isMentor(userId = null) {
    const profile = await this.getUserProfile(userId);
    return profile?.role === 'mentor';
  }

  // Check if user is student
  static async isStudent(userId = null) {
    const profile = await this.getUserProfile(userId);
    return profile?.role === 'student';
  }

  // Get user's coin balance
  static async getCoinBalance(userId = null) {
    const profile = await this.getUserProfile(userId);
    return profile?.excel_coin_balance || 0;
  }

  // Update coin balance
  static async updateCoinBalance(userId, amount, description = '') {
    // Get current balance
    const profile = await this.getUserProfile(userId);
    const newBalance = (profile.excel_coin_balance || 0) + amount;

    // Update profile
    await this.updateProfile(userId, {
      excel_coin_balance: newBalance
    });

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: amount > 0 ? 'coin_purchase' : 'course_enrollment',
        description: description,
        status: 'completed'
      });

    return newBalance;
  }

  // Listen to auth changes
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}