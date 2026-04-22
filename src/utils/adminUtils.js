import { supabase } from "../supabaseClient";
/**
 * Admin Utilities - Functions for managing users
 * NOTE: These functions should only be called from admin-protected components
 * Security is handled by Supabase Row Level Security (RLS) policies
 */

// Update user role (requires admin access)
export const updateUserRole = async (userId, newRole) => {
  try {
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    return { success: true, message: `User role updated to ${newRole}` };
  } catch (error) {
    console.error("Error updating role:", error);
    return { success: false, error: error.message };
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
};

// Get single user by ID
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: error.message };
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    // First, check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (fetchError || !user) {
      throw new Error("User not found");
    }
    
    // Delete from profiles table
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteError) throw deleteError;
    
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

// Promote user to admin
export const promoteToAdmin = async (userId) => {
  return updateUserRole(userId, 'admin');
};

// Demote admin to user
export const demoteToUser = async (userId) => {
  return updateUserRole(userId, 'user');
};

// Assign moderator role
export const assignModerator = async (userId) => {
  return updateUserRole(userId, 'moderator');
};

// Update user plan
export const updateUserPlan = async (userId, newPlan) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        plan: newPlan, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true, message: `User plan updated to ${newPlan}` };
  } catch (error) {
    console.error("Error updating plan:", error);
    return { success: false, error: error.message };
  }
};

// Get user statistics (admin dashboard)
export const getUserStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Get users by role
    const { data: roleStats, error: roleError } = await supabase
      .from('profiles')
      .select('role, count')
      .select('role')
      .then(async (result) => {
        // Count by role
        const roles = {};
        result.data?.forEach(user => {
          roles[user.role] = (roles[user.role] || 0) + 1;
        });
        return { data: roles };
      });
    
    if (roleError) throw roleError;
    
    // Get users by plan
    const { data: planStats, error: planError } = await supabase
      .from('profiles')
      .select('plan');
    
    if (planError) throw planError;
    
    const plans = {};
    planStats?.forEach(user => {
      plans[user.plan] = (plans[user.plan] || 0) + 1;
    });
    
    return { 
      success: true, 
      data: {
        totalUsers,
        byRole: roleStats?.data || {},
        byPlan: plans,
        recentSignups: await getRecentSignups()
      }
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { success: false, error: error.message };
  }
};

// Get recent signups
const getRecentSignups = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching recent signups:", error);
    return [];
  }
};