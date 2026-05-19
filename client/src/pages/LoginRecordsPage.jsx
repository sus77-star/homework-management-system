import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';


export default function LoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTER
  const [roleFilter, setRoleFilter] = useState('all');

  // SORT
  const [sortOrder, setSortOrder] = useState('newest');

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // ==============================
  // FETCH LOGS
  // ==============================
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await api.get('/users/login-logs');

      setLogs(res.data);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FILTER + SORT
  // ==============================
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // FILTER ROLE
    if (roleFilter !== 'all') {
      filtered = filtered.filter(
        (log) => log.role === roleFilter
      );
    }

    // SORT DATE
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.login_time) - new Date(a.login_time);
      }

      return new Date(a.login_time) - new Date(b.login_time);
    });

    return filtered;
  }, [logs, roleFilter, sortOrder]);

  // ==============================
  // PAGINATION
  // ==============================
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;

  return (
  <Layout>
  <div className="p-6">

    {/* HEADER */}
    <div className="flex items-center justify-between mb-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Login Records
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Monitor user login activity
        </p>
      </div>

    </div>

    {/* FILTER + SORT */}
    <div className="flex flex-wrap gap-4 mb-6">

      {/* ROLE FILTER */}
      <select
        value={roleFilter}
        onChange={(e) => {
          setRoleFilter(e.target.value);
          setCurrentPage(1);
        }}
        className="
          border rounded-lg
          px-4 py-2 text-sm
          bg-white
        "
      >
        <option value="all">All Roles</option>
        <option value="admin">Admin</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>

      {/* SORT */}
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="
          border rounded-lg
          px-4 py-2 text-sm
          bg-white
        "
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

    </div>

    {/* TABLE */}
    <div
      className="
        bg-white
        rounded-2xl
        border
        shadow-sm
        overflow-hidden
      "
    >

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          {/* TABLE HEADER */}
          <thead className="bg-gray-50 border-b">

            <tr>

              <th className="text-left px-6 py-4 font-semibold text-gray-600">
                Name
              </th>

              <th className="text-left px-6 py-4 font-semibold text-gray-600">
                Role
              </th>

              <th className="text-left px-6 py-4 font-semibold text-gray-600">
                Login Time
              </th>

            </tr>

          </thead>

          {/* TABLE BODY */}
          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan="3"
                  className="text-center py-10 text-gray-500"
                >
                  Loading...
                </td>
              </tr>

            ) : filteredLogs
                .slice(startIndex, endIndex)
                .length === 0 ? (

              <tr>
                <td
                  colSpan="3"
                  className="text-center py-10 text-gray-500"
                >
                  No login records found
                </td>
              </tr>

            ) : (

              filteredLogs
                .slice(startIndex, endIndex)
                .map((log) => (

                <tr
                  key={log.id}
                  className="
                    border-b
                    hover:bg-gray-50
                    transition
                  "
                >

                  {/* NAME */}
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {log.name}
                  </td>

                  {/* ROLE */}
                  <td className="px-6 py-4">

                    <span
                      className={`
                        px-3 py-1 rounded-full
                        text-xs font-medium capitalize

                        ${
                          log.role === 'admin'
                            ? 'bg-red-100 text-red-600'
                            : log.role === 'teacher'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        }
                      `}
                    >
                      {log.role}
                    </span>

                  </td>

                  {/* LOGIN TIME */}
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(log.login_time).toLocaleString()}
                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (

        <div
          className="
            flex items-center justify-between
            px-6 py-4
            border-t
            bg-gray-50
          "
        >

          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">

            {/* PREVIOUS */}
            <button
              onClick={() =>
                setCurrentPage((prev) => prev - 1)
              }
              disabled={currentPage === 1}
              className="
                px-4 py-2
                border rounded-lg
                text-sm
                disabled:opacity-50
                hover:bg-gray-100
              "
            >
              Previous
            </button>

            {/* NEXT */}
            <button
              onClick={() =>
                setCurrentPage((prev) => prev + 1)
              }
              disabled={currentPage === totalPages}
              className="
                px-4 py-2
                border rounded-lg
                text-sm
                disabled:opacity-50
                hover:bg-gray-100
              "
            >
              Next
            </button>

          </div>

        </div>

      )}

    </div>

  </div>
  </Layout>
);
}