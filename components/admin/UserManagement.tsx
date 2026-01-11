'use client';

import { useState, useEffect } from 'react';
import { UserRole, RoleDurationType } from '@/types/role';
import { EditRoleModal } from './EditRoleModal';

interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  created_at: string;
}

interface UserManagementProps {
  token: string;
}

export function UserManagement({ token }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
    durationType: RoleDurationType,
    customDays?: number
  ) => {
    try {
      setUpdatingUserId(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole, durationType, customDays }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      console.log(`✅ Role updated for user ${userId}: ${newRole}`);
    } catch (err) {
      console.error('❌ Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
      throw err; // Re-throw to be caught by the modal
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#ff1b6d]/10 text-[#ff1b6d] border-[#ff1b6d]/20';
      case 'vip':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-white/5 text-text-main border-white/10';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'vip':
        return '⭐';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gradient"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-main">👥 Управління користувачами</h2>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-transparent text-white font-medium rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
        >
          🔄 Оновити
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 text-red-400 rounded text-sm">{error}</div>
      )}

      <div className="bg-card-bg border border-text-muted/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main border-b border-text-muted/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Дата реєстрації
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-muted/20">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-main/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-main">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-muted">
                      {user.username || <span className="italic">не вказано</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setEditingUser(user)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors hover:bg-bg-main ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)} {user.role.toUpperCase()}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {new Date(user.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="ml-0 text-sm font-medium text-white bg-transparent border-2 border-white/10 px-3 py-2 rounded-xl hover:border-white/20 transition-all"
                    >
                      ✏️ Редагувати
                    </button>
                    {updatingUserId === user.id && (
                      <span className="ml-2 text-xs text-[#ff1b6d]">⏳ Оновлення...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-text-muted">Користувачі не знайдені</div>
          )}
        </div>
      </div>
      
      {editingUser && (
        <EditRoleModal
          userId={editingUser.id}
          userEmail={editingUser.email}
          currentRole={editingUser.role}
          onClose={() => setEditingUser(null)}
          onUpdate={(role, durationType, customDays) => 
            handleRoleChange(editingUser.id, role, durationType, customDays)
          }
        />
      )}
    </div>
  );
}
