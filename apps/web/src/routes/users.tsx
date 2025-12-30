import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const Route = createFileRoute('/users')({
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch users');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) {
    return (
      <div className="page users-page">
        <h1>Users</h1>
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page users-page">
        <h1>Users</h1>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="page users-page">
      <h1>Users</h1>
      <p className="page-description">Data fetched from the Hono API</p>
      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

