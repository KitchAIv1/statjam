'use client';

import React, { useEffect, useState } from 'react';
import { AdminService, AdminUser } from '@/lib/services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X } from 'lucide-react';

interface AdminUserListProps {
  userId?: string;
  userRole?: string;
}

/**
 * Admin User List Component
 * Searchable, filterable user list with role management
 * Max 200 lines per component rule
 */
export function AdminUserList({ userId, userRole }: AdminUserListProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [premiumFilter, setPremiumFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const pageSize = 20;

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-500 hover:bg-purple-600',
    organizer: 'bg-orange-500 hover:bg-orange-600',
    stat_admin: 'bg-blue-500 hover:bg-blue-600',
    player: 'bg-green-500 hover:bg-green-600',
    coach: 'bg-yellow-500 hover:bg-yellow-600',
    fan: 'bg-gray-500 hover:bg-gray-600'
  };

  const roles = ['admin', 'organizer', 'stat_admin', 'player', 'coach', 'fan'];

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, premiumFilter, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllUsers(userId, userRole, {
        search: searchTerm || undefined,
        role: roleFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      
      // Client-side premium filter
      let filteredData = data;
      if (premiumFilter === 'premium') {
        filteredData = data.filter(u => u.premium_status);
      } else if (premiumFilter === 'free') {
        filteredData = data.filter(u => !u.premium_status);
      }
      
      setUsers(filteredData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (targetUserId: string) => {
    if (!newRole) return;

    try {
      await AdminService.updateUserRole(userId, userRole, targetUserId, newRole);
      setEditingUser(null);
      setNewRole('');
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    }
  };

  const startEditing = (userId: string, currentRole: string) => {
    setEditingUser(userId);
    setNewRole(currentRole);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setNewRole('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          {users.length > 0 && `Showing ${users.length} user${users.length !== 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={premiumFilter}
              onChange={(e) => {
                setPremiumFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Users</option>
              <option value="premium">⭐ Premium Only</option>
              <option value="free">Free Only</option>
            </select>
          </div>

          {/* User List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                >
                  {/* User Info */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      {user.country && (
                        <>
                          <span>•</span>
                          <span>{user.country}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role & Status */}
                  <div className="flex items-center gap-2">
                    {/* Premium Badge */}
                    {user.premium_status && (
                      <Badge 
                        variant="outline" 
                        className="bg-amber-50 text-amber-700 border-amber-300 text-xs"
                      >
                        ⭐ Premium
                      </Badge>
                    )}
                    
                    {/* Role Badge - Editable */}
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="px-2 py-1 text-xs border rounded"
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role.replace('_', ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(user.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Badge 
                        className={`${roleColors[user.role] || 'bg-gray-500'} text-white cursor-pointer text-xs`}
                        onClick={() => startEditing(user.id, user.role)}
                      >
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={users.length < pageSize || loading}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

