import Layout from '../components/Layout';
import {
  useEffect,
  useState
} from 'react';

import api from '../services/api';

export default function NotificationsPage() {

  const [
    notifications,
    setNotifications
  ] = useState([]);

  useEffect(() => {

    fetchNotifications();

  }, []);

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

    const markAllRead =
    async () => {

        await api.put(
        '/notifications/read-all'
        );

        fetchNotifications();

    };

    const clearRead =
    async () => {

        await api.delete(
        '/notifications/read'
        );

        fetchNotifications();

    };

  return (
    <Layout>
    
    <div className="p-6">

    <div className="
    flex
    justify-between
    items-center
    mb-6
    ">

    <h1 className="
        text-2xl
        font-semibold
    ">
        Notifications
    </h1>

    <div className="flex gap-2">

    <button
        onClick={markAllRead}
        className="
        px-4
        py-2
        bg-blue-600
        text-white
        rounded-lg
        "
    >
        Mark All Read
    </button>

    <button
        onClick={clearRead}
        className="
        px-4
        py-2
        border
        border-red-300
        text-red-600
        rounded-lg
        "
    >
        Clear Read
    </button>

    </div>

    </div>

      <div className="
        space-y-4
      ">

        {notifications.map(
          n => (

            <div
            key={n.id}
            className={`
                border
                rounded-xl
                p-4
                transition

                ${
                !n.is_read
                    ? `
                    bg-blue-50
                    border-blue-200
                    `
                    : `
                    bg-white
                    border-gray-200
                    opacity-80
                    `
                }
            `}
            >

            <h3 className="
              font-semibold
            ">
              {n.title}
            </h3>

            <p className="
              text-gray-600
              mt-1
            ">
              {n.message}
            </p>

          </div>

        ))}

      </div>

    </div>
    </Layout>
  );

}