import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';

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

      {/*PROFILE HEADER*/}
      <div className="bg-white rounded-2xl shadow p-6">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-2xl font-bold text-black">
              {user?.name}
            </h1>

            <span
              className="
                inline-flex
                mt-2

                px-3 py-1

                rounded-full

                text-sm

                bg-blue-100
                text-blue-700
              "
            >
              {user?.role}
            </span>

          </div>

          <div className="text-right">

            <p className="text-sm text-gray-500">
              User ID
            </p>

            <p className="font-semibold">
              #{user?.id}
            </p>

          </div>

        </div>

      </div>
      
<div
  className="
    grid
    md:grid-cols-3
    gap-4
    mt-6
  "
>

  <div className="bg-white p-5 rounded-2xl shadow">
    <p className="text-sm text-gray-500">
      Role
    </p>

    <p className="text-2xl font-bold capitalize">
      {user?.role}
    </p>
  </div>

  <div className="bg-white p-5 rounded-2xl shadow">
    <p className="text-sm text-gray-500">
      User ID
    </p>

    <p className="text-2xl font-bold">
      #{user?.id}
    </p>
  </div>

  <div className="bg-white p-5 rounded-2xl shadow">
    <p className="text-sm text-gray-500">
      Class
    </p>

    <p className="text-2xl font-bold">
      {user?.class_name || '-'}
    </p>
  </div>

</div>

      <div className="space-y-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-black">Personal Information</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                value={form.name}
                disabled
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}

                className="
                  w-full p-3
                  border rounded-lg
                  bg-gray-100
                  text-gray-500
                "
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </label>

            <label className="space-y-2">

              <span className="
                text-sm font-medium
                text-gray-700
              ">
                Role
              </span>

              <input
                value={user?.role || ''}
                disabled

                className="
                  w-full p-3
                  border rounded-lg
                  bg-gray-100
                  text-gray-500
                "
              />

            </label>

          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="
            text-xl font-semibold
            mb-4
            text-black
          ">
            About Me
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Share a short introduction
            about yourself, your interests,
            academic background, or goals.
          </p>

          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}

            rows={5}

            placeholder="Share a short introduction about yourself
            "

            className="
              w-full
              border
              rounded-xl
              p-4
              
              bg-gray-100
            "
          />


        </div>
      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4 text-black">
          Academic Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <div className="
            bg-gray-50
            border
            rounded-xl
            p-4
          ">
            <p className="text-sm text-gray-500">
              User ID
            </p>

            <p className="text-lg font-semibold">
              #{user?.id}
            </p>
          </div>

          {user?.role === 'student' && (

            <div className="
              bg-gray-50
              border
              rounded-xl
              p-4
            ">
              <p className="text-sm text-gray-500">
                Class
              </p>

              <p className="text-lg font-semibold">
                {user?.class_name || '-'}
              </p>
            </div>

          )}

        </div>
      </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-xl font-semibold mb-4 text-black">
            Contact Information
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mt-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Github
              </label>

              <input
                name="github"
                value={form.github}
                onChange={handleChange}
                placeholder="Github URL"
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn
              </label>

              <input
                name="linkedin"
                value={form.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn URL"
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </div>

          </div>

          <div className="mt-5 flex justify-end">

            <button
              onClick={updateProfile}
              className="
                bg-blue-600
                hover:bg-blue-700

                text-white

                px-6 py-3

                rounded-xl

                font-medium
              "
            >
              Save Changes
            </button>

          </div>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-black">Change Password</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Current Password</span>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">New Password</span>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
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
