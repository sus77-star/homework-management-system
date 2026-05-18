import { useEffect, useState } from 'react';

import Layout from '../components/Layout';
import api from '../services/api';

import { jwtDecode } from 'jwt-decode';

import {
  Search,
  Trophy,
  GraduationCap,
  BookOpen,
  ClipboardList
} from 'lucide-react';

export default function GradesPage() {

  const [grades, setGrades] = useState([]);
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

    fetchGrades();

  }, []);

  // ==============================
  // FILTER
  // ==============================
  useEffect(() => {

    const keyword = search.toLowerCase();

    const result = grades.filter((g) => {

      if (role === 'teacher') {

        return (
          g.student_name
            ?.toLowerCase()
            .includes(keyword)

          ||

          g.assignment_title
            ?.toLowerCase()
            .includes(keyword)

          ||

          g.course_title
            ?.toLowerCase()
            .includes(keyword)
        );
      }

      return (
        g.assignment_title
          ?.toLowerCase()
          .includes(keyword)

        ||

        g.course_title
          ?.toLowerCase()
          .includes(keyword)
      );
    });

    setFiltered(result);

  }, [search, grades, role]);

  // ==============================
  // FETCH
  // ==============================
  const fetchGrades = async () => {

    try {

      const res = await api.get('/grades');

      setGrades(res.data);
      setFiltered(res.data);

    } catch (err) {

      console.log(err.response?.data);

    }
  };

  // ==============================
  // AVERAGE
  // ==============================
  const averageScore = filtered.length
    ? (
        filtered.reduce(
          (acc, item) =>
            acc + Number(item.score || 0),
          0
        ) / filtered.length
      ).toFixed(2)
    : 0;

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

          <Trophy
            className="text-yellow-500"
            size={30}
          />

          <h1 className="
            text-3xl font-bold
            text-gray-800
          ">
            Grades
          </h1>

        </div>

        <p className="text-gray-500">
          Academic grading and evaluation overview.
        </p>

      </div>

      {/* ======================
          SUMMARY CARD
      ====================== */}
      <div className="
        bg-white rounded-2xl
        shadow p-6 mb-6
      ">

        <div className="
          flex items-center
          justify-between
        ">

          <div>

            <p className="
              text-gray-500 text-sm
              mb-1
            ">
              Average Score
            </p>

            <h2 className="
              text-4xl font-bold
              text-gray-800
            ">
              {averageScore}
            </h2>

          </div>

          <div className="
            w-16 h-16
            rounded-2xl
            bg-yellow-100

            flex items-center
            justify-center
          ">

            <Trophy
              size={32}
              className="text-yellow-600"
            />

          </div>

        </div>

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
            placeholder="Search grades..."

            className="
              w-full border
              rounded-xl
              pl-10 pr-4 py-3
              focus:outline-none
              focus:ring-2
              focus:ring-yellow-500
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
                Score
              </th>

              <th className="p-4">
                Grade
              </th>

              <th className="p-4">
                Feedback
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length === 0 ? (

              <tr>

                <td
                  colSpan={
                    role === 'teacher'
                      ? 6
                      : 5
                  }

                  className="
                    text-center
                    py-14
                    text-gray-500
                  "
                >
                  No grades found
                </td>

              </tr>

            ) : (

              filtered.map((g) => (

                <tr
                  key={g.id}

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
                          {g.student_name}
                        </span>

                      </div>

                    </td>
                  )}

                  {/* ASSIGNMENT */}
                  <td className="p-4">

                    <div className="
                      flex items-center
                      gap-2
                    ">

                      <ClipboardList
                        size={16}
                        className="
                          text-gray-500
                        "
                      />

                      <span className="
                        font-medium
                        text-gray-800
                      ">
                        {g.assignment_title}
                      </span>

                    </div>

                  </td>

                  {/* COURSE */}
                  <td className="p-4">

                    <div className="
                      flex items-center
                      gap-2
                    ">

                      <BookOpen
                        size={16}
                        className="
                          text-gray-500
                        "
                      />

                      <span className="
                        text-gray-700
                      ">
                        {g.course_title}
                      </span>

                    </div>

                  </td>

                  {/* SCORE */}
                  <td className="p-4">

                    <span className="
                      text-lg font-bold
                      text-gray-800
                    ">
                      {g.score}
                    </span>

                  </td>

                  {/* GRADE */}
                  <td className="p-4">

                    <span className="
                      bg-yellow-100
                      text-yellow-700

                      px-3 py-1
                      rounded-lg

                      text-xs
                      font-semibold
                    ">

                      {g.grade_letter}

                    </span>

                  </td>

                  {/* FEEDBACK */}
                  <td className="p-4">

                    <p className="
                      text-sm text-gray-600
                      max-w-xs
                    ">

                      {g.feedback || '-'}

                    </p>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </Layout>
  );
}