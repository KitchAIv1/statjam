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
  }, [searchTerm, roleFilter, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllUsers(userId, userRole, {
        search: searchTerm || undefined,
        role: roleFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      setUsers(data);
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
        <CardDescription>View and manage all users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
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
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
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
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate">{user.email}</span>
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="px-2 py-1 text-sm border rounded"
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
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Badge 
                          className={`${roleColors[user.role] || 'bg-gray-500'} text-white cursor-pointer`}
                          onClick={() => startEditing(user.id, user.role)}
                        >
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {user.premium_status && (
                        <Badge variant="outline">Premium</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={users.length < pageSize}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

