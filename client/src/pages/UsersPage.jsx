import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editingClassUserId, setEditingClassUserId] = useState(null);

  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;

    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    );
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');  
    }
  };

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role_id: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      await api.post('/users', form);
      alert('Account Created');
      setForm({ name: '', username: '',email: '', password: '', role_id: '' });
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      console.log(err.response?.data);
      if (data?.errors) {
      alert(data.errors.join('\n'));
    } else if (data?.message) {
      
      alert(data.message);
    } else {
      alert('Something went wrong');
    }
    }
  };
 
  const handleToggle = async (id, current) => {
    try {
      await api.patch(`/users/${id}/status`, {
        is_active: !current
      });
      fetchUsers();
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const filteredUsers = users
    .filter((u) => {
      const matchSearch =
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === '' || u.role === roleFilter;

      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;

      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

      valA = typeof valA === 'string' ? valA.toLowerCase() : valA;
      valB = typeof valB === 'string' ? valB.toLowerCase() : valB;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;

  const paginatedUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const [classes, setClasses] = useState([]);

  const fetchClasses = async () => {
  const res = await api.get('/classes');
  setClasses(res.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);


  return (
    <Layout>
      {/* <h1 className="text-2xl font-semibold mb-4">Users</h1> */}

      {/* CREATE FORM */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-3 text-gray-800">Create User</h2>

        <div className="grid grid-cols-4 gap-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded bg-slate-50" />
          <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="p-2 border rounded bg-slate-50" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded bg-slate-50" />
          <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" className="p-2 border rounded bg-slate-50" />

          <select name="role_id" value={form.role_id} onChange={handleChange} className="p-2 border rounded bg-slate-50">
            <option value="">Role</option>
            <option value="1">Admin</option>
            <option value="2">Teacher</option>
            <option value="3">Student</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create
        </button>
      </div>

      <div className="flex gap-3 mb-4">

        {/* SEARCH */}
        <input
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-1/3 bg-white"
        />

        {/* FILTER ROLE */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border rounded bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>
                Name {renderSortIcon('name')}
              </th>

              <th className="p-3 cursor-pointer" onClick={() => handleSort('username')}>
                Username {renderSortIcon('username')}
              </th>

              <th className="p-3 cursor-pointer" onClick={() => handleSort('email')}>
                Email {renderSortIcon('email')}
              </th>

              <th className="p-3 cursor-pointer" onClick={() => handleSort('role')}>
                Role {renderSortIcon('role')}
              </th>

              <th className="p-3 cursor-pointer" onClick={() => handleSort('is_active')}>
                Status {renderSortIcon('is_active')}
              </th>

              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="p-4">Loading...</td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                        ${u.role === 'admin' ? 'bg-red-100 text-red-600' :
                        u.role === 'teacher' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'}
                        `}>{u.role} </span> </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggle(u.id, u.is_active)}
                      className={`px-2 py-1 rounded text-sm ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                     <button
                      onClick={() =>setEditingUser({...u, role_id: u.role === 'admin'? 1: u.role === 'teacher'? 2: 3})}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>

                    {u.role === 'student' && (
                      u.class_name && editingClassUserId !== u.id ? (
                        <span
                          onClick={() => setEditingClassUserId(u.id)}
                          className="cursor-pointer border p-1 rounded text-sm bg-blue-100 text-blue-600"
                        >
                          {u.class_name}
                        </span>
                      ) : (
                        <select
                          value={u.class_id || ''}  
                          onChange={async (e) => {
                            const classId = e.target.value;
                            if (!classId) return;

                            try {
                              await api.post('/users/assign-class', {
                                student_id: u.id,
                                class_id: classId
                              });

                              setEditingClassUserId(null);
                              fetchUsers();
                            } catch (err) {
                              console.log(err.response?.data);
                            }
                          }}
                          className="border p-1 rounded text-sm bg-blue-100 text-blue-600"
                        >

                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )
                    )}
                  </td>
                </tr>
              ))
              
            )}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="flex justify-center items-center gap-2 mt-4">

        {/* PREV */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Prev
        </button>

        {/* PAGE NUMBERS */}
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            {i + 1}
          </button>
        ))}

        {/* NEXT */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Next
        </button>

      </div> 
      
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">

            <h2 className="text-lg font-semibold mb-4">Edit User</h2>

            <input
              value={editingUser.name}
              onChange={(e) =>
                setEditingUser({ ...editingUser, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-2 bg-white"
              placeholder="Name"
            />

            <input
              value={editingUser.username}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
              className="w-full p-2 border rounded mb-2 bg-white"
              placeholder="Username"
            />

            <input
              value={editingUser.email}
              onChange={(e) =>
                setEditingUser({ ...editingUser, email: e.target.value })
              }
              className="w-full p-2 border rounded mb-2 bg-white"
              placeholder="Email"
            />

            <input
              type="password"
              placeholder="New Password (optional)"
              onChange={(e) =>
                setEditingUser({ ...editingUser, newPassword: e.target.value })
              }
              className="w-full p-2 border rounded mb-1 bg-white"
            />

            <p className="text-xs text-gray-600 mb-2 italic">
              Leave blank if you don't want to change password
            </p>

            <select
              value={editingUser.role_id}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role_id: Number(e.target.value)})
              }
              className="w-full p-2 border rounded mb-4 bg-white"
            >
              <option value="1">Admin</option>
              <option value="2">Teacher</option>
              <option value="3">Student</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    // update user data
                    await api.put(`/users/${editingUser.id}`, editingUser);

                    // if fill password → update password
                    if (editingUser.newPassword) {
                      await api.put(`/users/${editingUser.id}/password`, {
                        password: editingUser.newPassword
                      });
                    }

                    // refresh
                    setEditingUser(null);
                    fetchUsers();

                  } catch (err) {
                    console.log(err.response?.data);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}