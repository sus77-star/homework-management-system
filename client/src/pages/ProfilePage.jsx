import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Hash,
  School,
  Lock,
  Save
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',

    bio: '',
    phone: '',
    github: '',
    linkedin: ''
  });
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

        username:
          res.data.username ||
          res.data.nim ||
          res.data.nip ||
          '',

        email: res.data.email || '',

        bio: res.data.bio || '',
        phone: res.data.phone || '',

        github:
          res.data.github || '',

        linkedin:
          res.data.linkedin || ''
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
      if (
        form.github &&
        !form.github.includes('github.com')
      ) {
        toast.error(
          'Invalid Github URL'
        );
        return;
      }

      if (
        form.linkedin &&
        !form.linkedin.includes('linkedin.com')
      ) {
        toast.error(
          'Invalid LinkedIn URL'
        );
        return;
      }

      await api.put('/users/me', {
        username: form.username,
        email: form.email,

        bio: form.bio,
        phone: form.phone,

        github: form.github,
        linkedin: form.linkedin
      });

      toast.success('Profile updated');
      fetchUser();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update profile';
      toast.error(msg);
    }
  };

  const updatePassword = async () => {

  if (
    passwordForm.new_password.length < 6
  ) {

    toast.error(
      'Password must be at least 6 characters'
    );

    return;
  }

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

          {/* HEADER */}
          <div className="bg-white rounded-3xl shadow-sm border p-8">

            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

              <div className="flex items-center gap-8">

                <div
                  className="
                    h-32
                    w-32
                    rounded-full
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                    text-6xl
                    font-bold
                    text-blue-700
                  "
                >
                  {user?.name?.charAt(0)}
                </div>

                <div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {user?.name}
                  </h1>

                  <span
                    className="
                      inline-flex
                      px-4
                      py-1.5
                      rounded-full
                      text-sm
                      font-medium
                      bg-blue-100
                      text-blue-700
                    "
                  >
                    {user?.role}
                  </span>

                  <p className="mt-4 text-gray-500">
                    Welcome back! Keep learning and improving
                  </p>

                </div>

              </div>

              <div className="text-right">

                <p className="text-gray-500 text-lg">
                  User ID
                </p>

                <p className="text-3xl font-bold text-gray-900">
                  #{user?.id}
                </p>

              </div>

            </div>

          </div>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white rounded-3xl shadow-sm border p-8">

              <div className="flex items-center gap-5">

                <div
                  className="
                    h-16
                    w-16
                    rounded-2xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    text-3xl
                  "
                >
                  <User
                    size={30}
                    className="text-blue-600"
                  />
                </div>

                <div>

                  <p className="text-gray-500">
                    Role
                  </p>

                  <p className="text-3xl font-bold capitalize text-gray-900">
                    {user?.role}
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-8">

              <div className="flex items-center gap-5">

                <div
                  className="
                    h-16
                    w-16
                    rounded-2xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    text-3xl
                  "
                >
                  <Hash
                    size={30}
                    className="text-blue-600"
                  />
                </div>

                <div>

                  <p className="text-gray-500">
                    User ID
                  </p>

                  <p className="text-3xl font-bold text-gray-900">
                    #{user?.id}
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-8">

              <div className="flex items-center gap-5">

                <div
                  className="
                    h-16
                    w-16
                    rounded-2xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    text-3xl
                  "
                >
                  <School
                    size={30}
                    className="text-blue-600"
                  />
                </div>

                <div>

                  <p className="text-gray-500">
                    Class
                  </p>

                  <p className="text-3xl font-bold text-gray-900">
                    {user?.class_name || '-'}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* MAIN CONTENT */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2">

              <div className="bg-white rounded-3xl shadow-sm border p-8">

                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Personal Information
                </h2>

                <div className="grid md:grid-cols-4 gap-5">

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Name
                    </label>

                    <input
                      value={form.name}
                      disabled
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                        bg-gray-100
                      "
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Username
                    </label>

                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                      "
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Email
                    </label>

                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                      "
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Role
                    </label>

                    <input
                      value={user?.role}
                      disabled
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                        bg-gray-100
                      "
                    />
                  </div>

                </div>

                {/* BIO + PHONE */}
                <div className="grid md:grid-cols-2 gap-5 mt-6">

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Bio
                    </label>

                    <textarea
                      rows={3}
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                        resize-none
                      "
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-500">
                      Phone
                    </label>

                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                      "
                    />
                  </div>

                </div>

                {/* SOCIAL */}
                <div className="grid md:grid-cols-2 gap-5 mt-6">

                  <div>
                    <label className="block mb-2 text-gray-500">
                      GitHub
                    </label>

                    <input
                      name="github"
                      value={form.github}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                      "
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-500">
                      LinkedIn
                    </label>

                    <input
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      className="
                        w-full
                        p-4
                        rounded-xl
                        border
                      "
                    />
                  </div>

                </div>

                <div className="flex justify-end mt-8">

                  <button
                    onClick={updateProfile}
                    className="
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-8
                      py-4
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Save size={18} />
                  </button>

                </div>

              </div>

            </div>

            {/* PASSWORD CARD */}
            <div>

              <div
                className="
                  bg-white
                  rounded-3xl
                  shadow-sm
                  border
                  p-8
                "
              >

                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Change Password
                </h2>

                <div className="space-y-5">

                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="
                      w-full
                      p-4
                      rounded-xl
                      border
                    "
                  />

                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="
                      w-full
                      p-4
                      rounded-xl
                      border
                    "
                  />

                  <button
                    onClick={updatePassword}
                    className="
                      w-full
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      py-4
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >
                    <Lock size={18} />
                    Change Password
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
    </Layout>
  );
}
