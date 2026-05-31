import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import toast from 'react-hot-toast';


export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {

    const token = localStorage.getItem('token');

    if (!token) return;

    try {

      const decoded = jwtDecode(token);

      const expired =
        decoded.exp * 1000 < Date.now();

      if (!expired) {
        navigate('/dashboard');
      } else {
        localStorage.removeItem('token');
      }

    } catch {
      localStorage.removeItem('token');
    }

  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const res = await api.post(
        '/users/login',
        form
      );

      toast.success('Login successful');

      localStorage.setItem(
        'token',
        res.data.token
      );

      navigate('/dashboard');

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
        'Login error'
      );

    }
  };

  return (
     <div className="h-screen w-screen flex overflow-hidden">

    {/* LEFT SIDE */}
    <div className="hidden md:block w-1/2 h-full relative">
      <img
        src="/landmark.webp"
        alt="landmark"
        className="w-full h-full object-cover"
      />

      {/* overlay gradient smooth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      {/* text */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-white text-center">
        <h1 className="text-3xl font-semibold mb-2">
          Homework Management System
        </h1>
        <p className="text-sm opacity-80">
          Shenyang Aerospace University
        </p>
      </div>
    </div>

      {/* RIGHT SIDE */}
    <div className="w-full md:w-1/2 h-full flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-2xl shadow-xl w-80">

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Welcome
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg 
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg 
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg 
            hover:bg-blue-700 transition"
          >
            Login
          </button>

        </form>
      </div>
    </div>

  </div>
  );
}