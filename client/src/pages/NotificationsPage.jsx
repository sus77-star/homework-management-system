import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


export default function NotificationsPage() {

  const [notifications, setNotifications] = useState([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);

  const limit = 5;

  useEffect(() => {
    fetchNotifications();
  }, [page, search, status]);

  const fetchNotifications = async () => {

    try {

      const res = await api.get(
        `/notifications?page=${page}&search=${search}&status=${status}`
      );

      setNotifications(
        res.data.notifications || []
      );

      setTotal(
        res.data.total || 0
      );

    } catch (err) {

      console.error(err);

    }

  };

  const markAllRead = async () => {

    try {

      await api.put(
        '/notifications/read-all'
      );

      fetchNotifications();

    } catch (err) {

      console.error(err);

    }

  };

  const clearRead = async () => {

    try {

      await api.delete(
        '/notifications/read'
      );

      fetchNotifications();

    } catch (err) {

      console.error(err);

    }

  };

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / limit)
    );

  const handleNotificationClick = async (id) => {

    setNotifications(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, is_read: true }
          : item
      )
    );

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }

  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return [...Array(totalPages)].map((_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      '...',
      page - 1,
      page,
      page + 1,
      '...',
      totalPages
    ];
  };

  return (

    <Layout>

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="text-gray-500 mt-1">
              Stay updated with assignments, grades, and system activities.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={markAllRead}
              className="
                flex items-center gap-2
                bg-blue-600 hover:bg-blue-700
                text-white
                px-4 py-2
                rounded-xl
              "
            >
              <CheckCheck size={18} />
              Mark All Read
            </button>

            <button
              onClick={clearRead}
              className="
                flex items-center gap-2
                border border-red-300
                text-red-600
                hover:bg-red-50
                px-4 py-2
                rounded-xl
              "
            >
              <Trash2 size={18} />
              Clear Read
            </button>

          </div>

        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-white border rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Notifications
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {total}
            </h2>

          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Unread
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {
                notifications.filter(
                  n => !n.is_read
                ).length
              }
            </h2>

          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Current Page
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {page}
            </h2>

          </div>

        </div>

        {/* SEARCH */}
        <div className="relative mb-5">

          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            value={search}
            onChange={(e) => {

              setSearch(
                e.target.value
              );

              setPage(1);

            }}
            placeholder="Search notifications..."
            className="
              w-full
              bg-white
              border
              rounded-xl
              py-3
              pl-11
              pr-4
            "
          />

        </div>

        {/* FILTER */}
        <div className="flex gap-2 mb-6">

          {[
            'all',
            'unread',
            'read'
          ].map((item) => (

            <button
              key={item}
              onClick={() => {

                setStatus(item);

                setPage(1);

              }}
              className={`
                px-4 py-2
                rounded-xl
                capitalize

                ${
                  status === item
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border'
                }
              `}
            >
              {item}
            </button>

          ))}

        </div>

        {/* EMPTY */}
        {notifications.length === 0 ? (

          <div className="bg-white border rounded-3xl p-12 text-center">

            <Bell
              size={60}
              className="
                mx-auto
                text-gray-300
              "
            />

            <h3 className="mt-4 text-xl font-semibold">
              No Notifications
            </h3>

            <p className="text-gray-500 mt-2">
              You're all caught up.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {notifications.map((n) => (

              <Link
                key={n.id}
                to={n.link ||'/notifications'}
                onClick={() => handleNotificationClick(n.id)}
              >

                <div
                  className={`
                    border
                    rounded-2xl
                    p-5
                    transition
                    hover:shadow-md

                    ${
                      !n.is_read
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    }
                  `}
                >

                  <div className="flex gap-4">

                    <div
                      className="
                        h-12 w-12
                        rounded-xl
                        bg-blue-100
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                    >
                      <Bell
                        size={20}
                        className="text-blue-600"
                      />
                    </div>

                    <div className="flex-1">

                      <div className="flex items-center gap-2">

                        <h3 className="font-semibold text-gray-900">
                          {n.title}
                        </h3>

                        {!n.is_read && (

                          <span
                            className="
                              text-xs
                              px-2 py-1
                              rounded-full
                              bg-blue-100
                              text-blue-700
                            "
                          >
                            NEW
                          </span>

                        )}

                      </div>

                      <p className="text-gray-600 mt-2">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">

                        <Clock size={14} />

                        {new Date(
                          n.created_at
                        ).toLocaleString()}

                      </div>

                    </div>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        )}

        {/* PAGINATION */}
        {totalPages > 1 && (

          <div
            className="
              flex justify-center
              items-center
              gap-2
              mt-8
              flex-wrap
            "
          >

            {/* PREV */}
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="
                px-3 py-1
                bg-gray-200
                rounded-lg
                hover:bg-gray-300
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Prev
            </button>

            {/* PAGE NUMBERS */}
            {getPageNumbers().map((item, index) => {

              if (item === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-1 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={`${item}-${index}`}
                  onClick={() => setPage(item)}
                  className={`
                    px-3 py-1
                    
                    rounded-md
                    font-medium
                    transition

                    ${
                      page === item
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }
                  `}
                >
                  {item}
                </button>
              );
            })}

            {/* NEXT */}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="
                px-3 py-1
                bg-gray-200
                rounded-md
                hover:bg-gray-300
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Next
            </button>

          </div>

        )}

      </div>

    </Layout>

  );

}

