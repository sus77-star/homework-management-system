import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // ==============================
  // INIT USER
  // ==============================
  useEffect(() => {
    fetchMe();
  }, []);

  // ==============================
  // AUTO REFRESH (ONLY TEACHER)
  // ==============================
  useEffect(() => {
    if (user?.role !== 'teacher') return;

    fetchRequestCount();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchRequestCount();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // ==============================
  // CLOSE DROPDOWNS WHEN CLICK OUTSIDE
  // ==============================
  useEffect(() => {
    const handleClick = () => {
      setOpen(false);
      setNotifOpen(false);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // ==============================
  // API CALLS
  // ==============================
  const fetchMe = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRequestCount = async () => {
    try {
      const res = await api.get('/assignments/resubmit-requests-count');
      setRequestCount(res.data.count);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/assignments/resubmit-notifications');
      setNotifications(res.data);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-6">

      {/* LEFT */}
      <h1 className="text-lg font-semibold text-gray-800">
        Homework System
      </h1>

      {/* RIGHT */}
      <div className="flex items-center gap-5">

        {/* =========================
            NOTIFICATION ICON
        ========================= */}
        {(user.role === 'teacher' || user.role === 'student') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen(!notifOpen);
            }}
            className="relative"
          >
            <Bell size={22} className="text-gray-700 hover:text-blue-600 transition" />

            {requestCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-semibold">
                {requestCount}
              </span>
            )}
          </button>
        )}

        {/* =========================
            NOTIFICATION DROPDOWN
        ========================= */}
        {notifOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-20 top-14 w-80 bg-white shadow-xl rounded-xl border z-50"
          >
            <div className="p-4 border-b font-semibold">
              Notifications
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No notifications
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to="/resubmit-request"
                    onClick={() => setNotifOpen(false)}
                    className="block p-4 border-b hover:bg-gray-50 transition"
                  >
                    <p className="text-sm font-medium">
                      {n.student_name} requested resubmit
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {n.assignment_title}
                    </p>

                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                    View all notifications
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================
            PROFILE
        ========================= */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {user.name?.charAt(0)}
            </div>
          </button>

          {/* DROPDOWN */}
          {open && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-60 bg-white shadow-xl rounded-xl p-4 z-50"
            >
              <div className="mb-3 border-b pb-3">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {user.role}
                </p>

                {user.role === 'student' && (
                  <>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {user.nim}
                    </p>
                    <p className="text-xs text-gray-400">
                      Class: {user.class_name || '-'}
                    </p>
                  </>
                )}

                {user.role === 'teacher' && (
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {user.nip}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left py-2 px-2 rounded-lg text-red-500 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}