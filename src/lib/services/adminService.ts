import { supabase } from '@/lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  country?: string;
  premium_status: boolean;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisWeek: number;
  activeUsersToday: number;
  premiumUsers: number;
}

/**
 * Admin Service - User management and statistics
 * Max 200 lines per service layer rule
 */
export class AdminService {
  /**
   * Verify user has admin role
   * @param userId - User ID from AuthContext
   * @param userRole - User role from AuthContext
   * @throws Error if not admin
   */
  private static verifyAdmin(userId: string | undefined, userRole: string | undefined): void {
    if (!userId || !userRole) {
      console.error('❌ AdminService: No user ID or role provided');
      throw new Error('Not authenticated');
    }

    if (userRole !== 'admin') {
      console.error('❌ AdminService: User is not admin, role:', userRole);
      throw new Error('Admin access required');
    }

    console.log('✅ AdminService: Admin verified, user ID:', userId);
  }

  /**
   * Get all users with optional filters
   * @param userId - Current user ID from AuthContext
   * @param userRole - Current user role from AuthContext
   */
  static async getAllUsers(
    userId: string | undefined,
    userRole: string | undefined,
    filters?: {
      role?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AdminUser[]> {
    this.verifyAdmin(userId, userRole);

    let query = supabase
      .from('users')
      .select('id, email, role, country, premium_status, profile_image, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    if (filters?.search) {
      query = query.ilike('email', `%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset, 
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user statistics for dashboard cards
   * @param userId - Current user ID from AuthContext
   * @param userRole - Current user role from AuthContext
   */
  static async getUserStats(
    userId: string | undefined,
    userRole: string | undefined
  ): Promise<UserStats> {
    this.verifyAdmin(userId, userRole);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, role, premium_status, created_at');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Calculate statistics
    const usersByRole: Record<string, number> = {};
    let newUsersThisWeek = 0;
    let premiumUsers = 0;

    allUsers?.forEach(user => {
      // Count by role
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
      
      // Count new users this week
      const createdAt = new Date(user.created_at);
      if (createdAt >= weekAgo) {
        newUsersThisWeek++;
      }
      
      // Count premium users
      if (user.premium_status) {
        premiumUsers++;
      }
    });

    return {
      totalUsers: allUsers?.length || 0,
      usersByRole,
      newUsersThisWeek,
      activeUsersToday: 0, // TODO: Implement when tracking is added
      premiumUsers
    };
  }

  /**
   * Update user role
   * @param currentUserId - Current admin user ID from AuthContext
   * @param currentUserRole - Current admin user role from AuthContext
   * @param targetUserId - Target user ID to update
   * @param newRole - New role to assign
   */
  static async updateUserRole(
    currentUserId: string | undefined,
    currentUserRole: string | undefined,
    targetUserId: string,
    newRole: string
  ): Promise<void> {
    this.verifyAdmin(currentUserId, currentUserRole);

    const validRoles = ['admin', 'organizer', 'stat_admin', 'player', 'coach', 'fan'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        role: newRole, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', targetUserId);

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  }

  /**
   * Get single user by ID
   * @param currentUserId - Current admin user ID from AuthContext
   * @param currentUserRole - Current admin user role from AuthContext
   * @param targetUserId - Target user ID to fetch
   */
  static async getUserById(
    currentUserId: string | undefined,
    currentUserRole: string | undefined,
    targetUserId: string
  ): Promise<AdminUser | null> {
    this.verifyAdmin(currentUserId, currentUserRole);

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, country, premium_status, profile_image, created_at, updated_at')
      .eq('id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }
}

