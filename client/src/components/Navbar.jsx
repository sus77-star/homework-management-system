import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [
    notificationCount,
    setNotificationCount
  ] = useState(0);

  const fetchNotificationCount =
    async () => {

      try {

        const res =
          await api.get(
            '/notifications/unread-count'
          );

        setNotificationCount(
          res.data.count
        );

      } catch (err) {

        console.log(err);

      }

    };
  const [notifications, setNotifications] = useState([]);

  // ==============================
  // INIT USER
  // ==============================
  useEffect(() => {
    fetchMe();
  }, []);

  // ==============================
  // AUTO REFRESH 
  // ==============================
  useEffect(() => {

    if (
      user?.role !== 'teacher' &&
      user?.role !== 'student'
    ) return;

    fetchNotificationCount();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotificationCount();
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


  const fetchNotifications =
    async () => {

      const res =
        await api.get(
          '/notifications'
        );

      setNotifications(
        res.data
      );

    };

  const markAsRead =
    async (id) => {

      try {

        await api.put(
          `/notifications/${id}/read`
        );

        fetchNotificationCount();
        fetchNotifications();

      } catch (err) {

        console.log(err);

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
          <Bell
            size={22}
            className={
              
              notificationCount > 0
                ? 'text-blue-600'
                : 'text-gray-700'
            }
          />

            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-semibold">
                {notificationCount > 9
                  ? '9+'
                  : notificationCount}
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
              <div className="max-h-56 overflow-y-auto">
                {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '/notifications'}

                  onClick={async () => {

                    await markAsRead(
                      n.id
                    );

                    setNotifOpen(false);

                  }}

                  className={`
                    block
                    p-3
                    border-b
                    transition

                    ${
                      !n.is_read
                        ? `
                          bg-blue-50
                          border-l-4
                          border-l-blue-500
                          hover:bg-blue-100
                        `
                        : `
                          bg-white
                          opacity-70
                          hover:bg-gray-50
                        `
                    }
                  `}
                  >

                    {!n.is_read && (

                      <span
                        className="
                          inline-block
                          mb-2
                          px-2
                          py-0.5
                          text-[10px]
                          font-semibold
                          bg-blue-100
                          text-blue-700
                          rounded-full
                        "
                      >
                        NEW
                      </span>

                    )}

                    <p className="text-sm font-semibold text-gray-800">
                      {n.title}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {n.message}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>

                  </Link>
                ))}
              </div>
              
            )}
            <div className="p-3 text-center border-t">
            <Link
              to="/notifications"
              onClick={() => setNotifOpen(false)}
              className="
                text-blue-600
                text-sm
                font-medium
                hover:underline
              "
            >
              View all notifications
            </Link>

          </div>
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