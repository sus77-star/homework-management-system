  import { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';

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

    const [courseFilter, setCourseFilter] =
      useState('all');

    const [typeFilter, setTypeFilter] =
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

      fetchGrades();

    }, []);

    // ==============================
    // FILTER
    // ==============================
    useEffect(() => {

      const keyword =
        search.toLowerCase();

      const result =
        grades.filter((g) => {

          const matchesSearch =

            role === 'teacher'

              ? (

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

                )

              : (

                  g.assignment_title
                    ?.toLowerCase()
                    .includes(keyword)

                  ||

                  g.course_title
                    ?.toLowerCase()
                    .includes(keyword)

                );

          const matchesCourse =

            courseFilter === 'all'

            ||

            g.course_title ===
            courseFilter;

          const matchesType =

            typeFilter === 'all'

            ||

            g.submission_type ===
            typeFilter;

          const matchesGrade =

            gradeFilter === 'all'

            ||

            g.grade_letter ===
            gradeFilter;

          return (

            matchesSearch

            &&

            matchesCourse

            &&

            matchesType

            &&

            matchesGrade

          );

        });

      setFiltered(result);

      setCurrentPage(1);

    }, [

      search,

      grades,

      role,

      courseFilter,

      typeFilter,

      gradeFilter

    ]);

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

    const courses = [

      ...new Set(

        grades.map(
          g => g.course_title
        )

      )

    ];

    const totalPages =
      Math.ceil(
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
      (currentPage - 1)
      * itemsPerPage;

    const paginatedGrades =
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
              size={23}
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
                bg-gray-50
              "

              value={search}

              onChange={(e) =>
                setSearch(e.target.value)
              }
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
            onChange={(e) =>
              setCourseFilter(
                e.target.value
              )
            }
            className="
              border rounded-xl
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

          {/* TYPE */}

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="
              border rounded-xl
              px-4 py-3
              bg-white
            "
          >

            <option value="all">
              All Types
            </option>

            <option value="upload">
              Upload
            </option>

            <option value="quiz">
              Quiz
            </option>

          </select>

          {/* GRADE */}

          <select
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(
                e.target.value
              )
            }
            className="
              border rounded-xl
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

        {/* TABLE */}
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

                <th className="p-4 justify-center">
                  Course
                </th>

                <th className="p-4">
                  Score
                </th>

                <th className="p-4">
                  Grade
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      role === 'teacher'
                        ? 7
                        : 6
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

                paginatedGrades.map((g) => (

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

                        <Link
                          to={`/assignments/${g.assignment_id}`}
                          className="
                            font-medium
                            text-blue-600
                            hover:underline
                          "
                        >
                          {g.assignment_title}
                        </Link>

                      </div>

                    </td>

                    {/* TYPE */}
                    <td className="p-4">

                      <span
                        className={`
                          px-3 py-1
                          rounded-full
                          text-xs
                          font-medium

                          ${
                            g.submission_type === 'quiz'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        `}
                      >
                        {g.submission_type === 'quiz'
                          ? 'Quiz'
                          : 'Upload'}
                      </span>

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
                        {Number(g.score)}
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



                  </tr>
                ))
              )}

            </tbody>

          </table>

  <div
    className="
      flex justify-center
      items-center
      gap-2
      py-5
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

    {/* PAGES */}
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

        </div>

      </Layout>
    );
  }