import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        username: res.data.username || res.data.nim || res.data.nip || '',
        email: res.data.email || ''
      });
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    try {
      await api.put('/users/me', {
        name: form.name,
        username: form.username,
        email: form.email
      });

      toast.success('Profile updated');
      fetchUser();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update profile';
      toast.error(msg);
    }
  };

  const updatePassword = async () => {
    try {
      await api.put('/users/me/password', passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to change password';
      toast.error(msg);
    }
  };

  if (loading && !user) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </label>
          </div>

          <button
            onClick={updateProfile}
            className="mt-4 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            Save Profile
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Current Password</span>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">New Password</span>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg"
              />
            </label>
          </div>

          <button
            onClick={updatePassword}
            className="mt-4 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700"
          >
            Change Password
          </button>
        </div>
      </div>
    </Layout>
  );
}
