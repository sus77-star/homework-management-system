import { useEffect, useState } from 'react';

import Layout from '../components/Layout';
import api from '../services/api';

import { jwtDecode } from 'jwt-decode';

import {
  Search,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

export default function SubmissionsPage() {

  const [submissions, setSubmissions] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  // ==============================
  // INIT
  // ==============================
  useEffect(() => {

    const token = localStorage.getItem('token');

    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }

    fetchSubmissions();

  }, []);

  // ==============================
  // SEARCH FILTER
  // ==============================
  useEffect(() => {

    const keyword = search.toLowerCase();

    const result = submissions.filter((s) => {

      if (role === 'teacher') {

        return (
          s.student_name
            ?.toLowerCase()
            .includes(keyword)

          ||

          s.assignment_title
            ?.toLowerCase()
            .includes(keyword)

          ||

          s.course_title
            ?.toLowerCase()
            .includes(keyword)
        );
      }

      return (
        s.assignment_title
          ?.toLowerCase()
          .includes(keyword)

        ||

        s.course_title
          ?.toLowerCase()
          .includes(keyword)
      );
    });

    setFiltered(result);

  }, [search, submissions, role]);

  // ==============================
  // FETCH
  // ==============================
  const fetchSubmissions = async () => {

    try {

      const res = await api.get('/submissions');

      setSubmissions(res.data);
      setFiltered(res.data);

    } catch (err) {

      console.log(err.response?.data);

    }
  };

  return (
    <Layout>

      {/* ======================
          HEADER
      ====================== */}
      <div className="mb-8">

        <div className="
          flex items-center
          gap-3 mb-2
        ">

          <FileCheck
            className="text-blue-600"
            size={30}
          />

          <h1 className="
            text-3xl font-bold
            text-gray-800
          ">
            Submissions
          </h1>

        </div>

        <p className="text-gray-500">
          Track and manage assignment submissions.
        </p>

      </div>

      {/* ======================
          SEARCH
      ====================== */}
      <div className="
        bg-white rounded-2xl
        shadow p-4 mb-6
      ">

        <div className="relative">

          <Search
            className="
              absolute left-3 top-3
              text-gray-400
            "
            size={18}
          />

          <input
            type="text"
            placeholder="Search submissions..."

            className="
              w-full border
              rounded-xl
              pl-10 pr-4 py-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "

            value={search}

            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      {/* ======================
          TABLE
      ====================== */}
      <div className="
        bg-white rounded-2xl
        shadow overflow-x-auto
      ">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr className="text-left text-gray-600">

              {/* TEACHER */}
              {role === 'teacher' && (
                <th className="p-4">
                  Student
                </th>
              )}

              <th className="p-4">
                Assignment
              </th>

              <th className="p-4">
                Course
              </th>

              <th className="p-4">
                Submitted
              </th>

              <th className="p-4">
                Status
              </th>

              <th className="p-4">
                Score
              </th>

              <th className="p-4">
                Grade
              </th>

              <th className="p-4">
                File
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length === 0 ? (

              <tr>

                <td
                  colSpan={
                    role === 'teacher'
                      ? 8
                      : 7
                  }

                  className="
                    text-center
                    py-14
                    text-gray-500
                  "
                >
                  No submissions found
                </td>

              </tr>

            ) : (

              filtered.map((s) => {

                const submittedDate =
                  new Date(s.submitted_at);

                return (

                  <tr
                    key={s.id}

                    className="
                      border-t
                      hover:bg-gray-50
                      transition
                    "
                  >

                    {/* TEACHER */}
                    {role === 'teacher' && (

                      <td className="p-4">

                        <div className="
                          flex items-center
                          gap-2
                        ">

                          <GraduationCap
                            size={16}
                            className="
                              text-blue-600
                            "
                          />

                          <span className="
                            font-medium
                            text-gray-800
                          ">
                            {s.student_name}
                          </span>

                        </div>

                      </td>
                    )}

                    {/* ASSIGNMENT */}
                    <td className="p-4">

                      <p className="
                        font-medium
                        text-gray-800
                      ">
                        {s.assignment_title}
                      </p>

                    </td>

                    {/* COURSE */}
                    <td className="p-4 text-gray-600">

                      {s.course_title}

                    </td>

                    {/* SUBMITTED */}
                    <td className="p-4">

                      <div className="
                        flex items-center
                        gap-2 text-gray-600
                      ">

                        <Clock size={15} />

                        <span className="text-sm">

                          {submittedDate.toLocaleString()}

                        </span>

                      </div>

                    </td>

                    {/* STATUS */}
                    <td className="p-4">

                      {s.status === 'graded' ? (

                        <span className="
                          inline-flex
                          items-center
                          gap-1

                          bg-green-100
                          text-green-700

                          px-3 py-1
                          rounded-full
                          text-xs font-semibold
                        ">

                          <CheckCircle2 size={14} />

                          Graded

                        </span>

                      ) : (

                        <span className="
                          inline-flex
                          items-center
                          gap-1

                          bg-yellow-100
                          text-yellow-700

                          px-3 py-1
                          rounded-full
                          text-xs font-semibold
                        ">

                          <AlertCircle size={14} />

                          Pending

                        </span>

                      )}

                    </td>

                    {/* SCORE */}
                    <td className="p-4">

                      <span className="
                        font-semibold
                        text-gray-800
                      ">

                        {s.score ?? '-'}

                      </span>

                    </td>

                    {/* GRADE */}
                    <td className="p-4">

                      <span className="
                        bg-blue-100
                        text-blue-700

                        px-3 py-1
                        rounded-lg

                        text-xs
                        font-semibold
                      ">

                        {s.grade_letter || '-'}

                      </span>

                    </td>

                    {/* FILE */}
                    <td className="p-4">

                      <a
                        href={`http://localhost:3000${s.file_url}`}
                        target="_blank"
                        rel="noreferrer"

                        className="
                          text-blue-600
                          hover:underline
                          font-medium
                        "
                      >
                        View File
                      </a>

                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>

    </Layout>
  );
}