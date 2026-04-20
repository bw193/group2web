'use client';

import { useState, useEffect } from 'react';
import { Check, X, Trash2, Shield, Edit2 } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  }

  async function updateUser(id: number, updates: { status?: string; role?: string }) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    fetchUsers();
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">User Management</h1>

      <div className="cms-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Username</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Role</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Joined</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{user.fullName}</td>
                <td className="py-2.5 text-text-secondary">{user.username}</td>
                <td className="py-2.5 text-text-secondary">{user.email}</td>
                <td className="py-2.5">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[user.status] || 'bg-gray-100'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-2.5 text-text-secondary text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateUser(user.id, { status: 'approved' })}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => updateUser(user.id, { status: 'rejected' })}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-text-secondary py-4">No users found.</p>}
      </div>
    </div>
  );
}
