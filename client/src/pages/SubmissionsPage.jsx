import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

  const [courseFilter, setCourseFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [gradeFilter, setGradeFilter] =
    useState('all');

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

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

    const keyword =
      search.toLowerCase();

    const result =
      submissions.filter((s) => {

        const matchesSearch =

          s.assignment_title
            ?.toLowerCase()
            .includes(keyword)

          ||

          s.course_title
            ?.toLowerCase()
            .includes(keyword);

        const matchesCourse =

          courseFilter === 'all'

          ||

          s.course_title ===
          courseFilter;

        const matchesStatus =

          statusFilter === 'all'

          ||

          (
            statusFilter ===
            'graded'

            &&

            s.status ===
            'graded'
          )

          ||

          (
            statusFilter ===
            'pending'

            &&

            s.status !==
            'graded'
          );

        const matchesGrade =

          gradeFilter === 'all'

          ||

          s.grade_letter ===
          gradeFilter;

        return (

          matchesSearch

          &&

          matchesCourse

          &&

          matchesStatus

          &&

          matchesGrade

        );

      });

    setFiltered(result);

  }, [

    search,

    submissions,

    courseFilter,

    statusFilter,

    gradeFilter

  ]);

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

  const courses = [

    ...new Set(

      submissions.map(
        s => s.course_title
      )

    )

  ];

  const totalPages = Math.ceil(
    filtered.length /
    itemsPerPage
  );

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return [...Array(totalPages)].map((_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
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
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginatedSubmissions =
    filtered.slice(
      startIndex,
      startIndex + itemsPerPage
    );


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
      <div
  className="
    grid
    grid-cols-2
    md:grid-cols-4
    gap-4
    mb-6
  "
>

  <div className="bg-white p-4 rounded-xl shadow">

    <p className="text-sm text-gray-500">
      Total
    </p>

    <p className="text-2xl font-bold">
      {submissions.length}
    </p>

  </div>

  <div className="bg-white p-4 rounded-xl shadow">

    <p className="text-sm text-gray-500">
      Graded
    </p>

    <p className="text-2xl font-bold text-green-600">

      {
        submissions.filter(
          s => s.status === 'graded'
        ).length
      }

    </p>

  </div>

  <div className="bg-white p-4 rounded-xl shadow">

    <p className="text-sm text-gray-500">
      Pending
    </p>

    <p className="text-2xl font-bold text-yellow-600">

      {
        submissions.filter(
          s => s.status !== 'graded'
        ).length
      }

    </p>

  </div>

  <div className="bg-white p-4 rounded-xl shadow">

    <p className="text-sm text-gray-500">
      Average Score
    </p>

    <p className="text-2xl font-bold text-blue-600">

      {
        submissions.filter(
          s => s.score != null
        ).length

          ? Math.round(

              submissions
                .filter(
                  s => s.score != null
                )
                .reduce(
                  (sum, s) =>
                    sum + Number(s.score),
                  0
                )

              /

              submissions.filter(
                s => s.score != null
              ).length

            )

          : '-'
      }

    </p>

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
            size={23}
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
              bg-gray-50
            "

            value={search}

            onChange={(e) => {

              setSearch(
                e.target.value
              );

              setCurrentPage(1);

            }}
          />

        </div>

      </div>

<div
  className="
    grid
    md:grid-cols-3
    gap-3
    mb-6
  "
>

  {/* COURSE */}

  <select
    value={courseFilter}
    onChange={(e) => {

      setCourseFilter(
        e.target.value
      );

      setCurrentPage(1);

    }}
    className="
      border
      rounded-xl
      px-4 py-3
      bg-white
    "
  >

    <option value="all">
      All Courses
    </option>

    {courses.map(course => (

      <option
        key={course}
        value={course}
      >
        {course}
      </option>

    ))}

  </select>

  {/* STATUS */}

  <select
    value={statusFilter}
    onChange={(e) => {

      setStatusFilter(
        e.target.value
      );

      setCurrentPage(1);

    }}
    className="
      border
      rounded-xl
      px-4 py-3
      bg-white
    "
  >

    <option value="all">
      All Status
    </option>

    <option value="graded">
      Graded
    </option>

    <option value="pending">
      Pending
    </option>

  </select>

  {/* GRADE */}

  <select
    value={gradeFilter}
    onChange={(e) => {

      setGradeFilter(
        e.target.value
      );

      setCurrentPage(1);

    }}
    className="
      border
      rounded-xl
      px-4 py-3
      bg-white
    "
  >

    <option value="all">
      All Grades
    </option>

    <option value="A">A</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B">B</option>
    <option value="B-">B-</option>
    <option value="C">C</option>

  </select>

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
                Type
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
                      ? 9
                      : 8
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

              paginatedSubmissions.map((s) => {

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

                      <Link
                        to={`/assignments/${s.assignment_id}`}
                        className="block"
                      >

                        <p className="
                          font-medium
                          text-blue-600
                          hover:underline
                        ">
                          {s.assignment_title}
                        </p>

                        <p className="
                          text-xs
                          text-gray-500
                          mt-1
                        ">
                          View  details 
                        </p>

                      </Link>

                    </td>

                    <td className="p-4">

                      {s.submission_type === 'quiz'
                        ? (
                          <span className="
                            bg-purple-100
                            text-purple-700
                            px-2 py-1
                            rounded-lg
                            text-xs
                            font-semibold
                          ">
                            Quiz
                          </span>
                        )
                        : (
                          <span className="
                            bg-blue-100
                            text-blue-700
                            px-2 py-1
                            rounded-lg
                            text-xs
                            font-semibold
                          ">
                            Upload
                          </span>
                        )
                      }

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

                      {s.score != null
                        ? Number(s.score)
                        : '-'}

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

                      {s.submission_type === 'quiz'
                        ? (
                          <span className="
                            text-purple-600
                            font-medium
                          ">
                            Quiz Submission
                          </span>
                        )
                        : (
                          <a
                            href={`http://localhost:3000${s.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              text-blue-600
                              hover:underline
                            "
                          >
                            View File
                          </a>
                        )
                      }

                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>
        
{totalPages > 1 && (

  <div
    className="
      flex justify-center
      items-center
      gap-2
      mt-6
      mb-4
      flex-wrap
    "
  >

    {/* PREV */}
    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage(currentPage - 1)
      }
      className="
        px-3 py-1
        bg-gray-200
        rounded-md
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
            className="
              px-2
              text-gray-500
            "
          >
            ...
          </span>
        );
      }

      return (
        <button
          key={`${item}-${index}`}
          onClick={() =>
            setCurrentPage(item)
          }
          className={`
            px-3 py-1
            rounded-md
            font-medium
            transition

            ${
              currentPage === item
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
      disabled={
        currentPage === totalPages
      }
      onClick={() =>
        setCurrentPage(currentPage + 1)
      }
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