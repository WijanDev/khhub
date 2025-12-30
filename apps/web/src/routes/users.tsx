import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

interface User {
  id: number;
  name: string;
  email: string;
}

const fetchUsers = createServerFn().handler(async () => {
  const res = await fetch('http://localhost:3000/api/users');
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = (await res.json()) as { users: User[] };
  return data.users;
});

export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers();
    return { users };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users } = Route.useLoaderData();

  return (
    <div className="page users-page">
      <h1>Users</h1>
      <p className="page-description">Data fetched from the Hono API (SSR)</p>
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

