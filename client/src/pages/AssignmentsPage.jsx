import { useEffect, useState } from 'react';

import {
  useNavigate
} from 'react-router-dom';

import Layout from '../components/Layout';
import api from '../services/api';

import { jwtDecode } from 'jwt-decode';

import {
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  Layers3
} from 'lucide-react';

export default function AssignmentsPage() {

  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
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

    fetchAssignments();

  }, []);

  // ==============================
  // FETCH
  // ==============================
  const fetchAssignments = async () => {

    try {

      const res = await api.get('/assignments');

      setAssignments(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.log(err.response?.data);

    }
  };

  // ==============================
  // FILTER
  // ==============================
  const filtered = assignments.filter((a) =>
    a.title
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Layout>

      {/* ======================
          PAGE HEADER
      ====================== */}
      <div className="mb-8">

        <div className="
          flex items-center
          gap-3 mb-2
        ">

          <Layers3
            className="text-blue-600"
            size={28}
          />

          <h1 className="
            text-3xl font-bold
            text-gray-800
          ">
            Assignments Dashboard
          </h1>

        </div>

        <p className="text-gray-500">
          Monitor assignments, grades,
          submissions, and deadlines.
        </p>

      </div>

      {/* ======================
          SEARCH
      ====================== */}
      <div className="mb-6">

        <input
          type="text"
          placeholder="Search assignment..."

          className="
            w-full
            border
            px-4 py-3
            rounded-xl
            bg-white
            shadow-sm
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

      {/* ======================
          ASSIGNMENT GRID
      ====================== */}
      <div className="
        grid grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3
        gap-6
      ">

        {filtered.length === 0 ? (

          <div className="
            col-span-full
            bg-white rounded-2xl
            shadow p-10 text-center
          ">

            <FileText
              size={50}
              className="
                mx-auto text-gray-300
                mb-4
              "
            />

            <h3 className="
              text-xl font-semibold
              text-gray-700 mb-2
            ">
              No assignments found
            </h3>

            <p className="text-gray-500">
              There are currently no assignments.
            </p>

          </div>

        ) : (

          filtered.map((a) => {

            const isExpired =
              new Date(a.due_date) < new Date();

            return (

              <div
                key={a.id}

                onClick={() =>
                  navigate(`/assignments/${a.id}`)
                }

                className="
                  bg-white
                  rounded-2xl
                  shadow
                  hover:shadow-xl
                  transition
                  cursor-pointer
                  p-6
                  flex flex-col
                  justify-between
                "
              >

                {/* TOP */}
                <div>

                  {/* TITLE + DIFFICULTY */}
                  <div className="
                    flex items-start
                    justify-between
                    gap-3 mb-3
                  ">

                    <h2 className="
                      text-xl font-bold
                      text-gray-800
                      leading-snug
                    ">
                      {a.title}
                    </h2>

                    <span className={`
                      px-3 py-1
                      rounded-full
                      text-xs font-semibold
                      whitespace-nowrap

                      ${
                        a.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : a.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }
                    `}>
                      {a.difficulty?.toUpperCase()}
                    </span>

                  </div>

                  {/* COURSE */}
                  <p className="
                    text-sm text-gray-500
                    mb-3
                  ">
                    Course:
                    {' '}
                    <span className="
                      font-medium
                      text-gray-700
                    ">
                      {a.course_title}
                    </span>
                  </p>

                  {/* DESCRIPTION */}
                  <p className="
                    text-sm text-gray-600
                    line-clamp-3
                    mb-5
                  ">
                    {a.description || 'No description'}
                  </p>

                  {/* DEADLINE */}
                  <div className="
                    flex items-center
                    gap-2
                    text-sm text-gray-600
                    mb-5
                  ">

                    <Calendar size={16} />

                    {new Date(
                      a.due_date
                    ).toLocaleString()}

                  </div>

                  {/* ======================
                      STUDENT VIEW
                  ====================== */}
                  {role === 'student' && (

                    <div className="space-y-3">

                      {/* SUBMISSION */}
                      <div className="
                        flex items-center
                        justify-between
                      ">

                        <span className="
                          text-sm text-gray-500
                        ">
                          Submission
                        </span>

                        {a.submission_status ? (

                          <span className="
                            bg-green-100
                            text-green-700
                            px-3 py-1
                            rounded-full
                            text-xs font-semibold
                          ">
                            Submitted
                          </span>

                        ) : (

                          <span className="
                            bg-gray-100
                            text-gray-600
                            px-3 py-1
                            rounded-full
                            text-xs font-semibold
                          ">
                            Not Submitted
                          </span>

                        )}

                      </div>

                      {/* GRADE */}
                      <div className="
                        flex items-center
                        justify-between
                      ">

                        <span className="
                          text-sm text-gray-500
                        ">
                          Grade
                        </span>

                        <div className="
                          flex items-center
                          gap-2
                        ">

                          <span className="
                            font-semibold
                            text-gray-800
                          ">
                            {a.score ?? '-'}
                          </span>

                          <span className="
                            bg-blue-100
                            text-blue-700
                            px-2 py-1
                            rounded-md
                            text-xs font-semibold
                          ">
                            {a.grade_letter ?? '-'}
                          </span>

                        </div>

                      </div>

                      {/* RESUBMIT STATUS */}
                      {a.resubmit_status && (

                        <div className="
                          flex items-center
                          justify-between
                        ">

                          <span className="
                            text-sm text-gray-500
                          ">
                            Resubmit
                          </span>

                          <span className={`
                            px-3 py-1
                            rounded-full
                            text-xs font-semibold

                            ${
                              a.resubmit_status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : a.resubmit_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }
                          `}>
                            {a.resubmit_status}
                          </span>

                        </div>
                      )}

                    </div>
                  )}

                  {/* ======================
                      TEACHER VIEW
                  ====================== */}
                  {role === 'teacher' && (

                    <div className="space-y-3">

                      {/* SUBMISSIONS */}
                      <div className="
                        flex items-center
                        justify-between
                      ">

                        <span className="
                          text-sm text-gray-500
                        ">
                          Submissions
                        </span>

                        <span className="
                          font-semibold
                          text-gray-800
                        ">
                          {a.submissions_count}
                        </span>

                      </div>

                      {/* PENDING REQUESTS */}
                      <div className="
                        flex items-center
                        justify-between
                      ">

                        <span className="
                          text-sm text-gray-500
                        ">
                          Pending Requests
                        </span>

                        <span className="
                          bg-orange-100
                          text-orange-700
                          px-3 py-1
                          rounded-full
                          text-xs font-semibold
                        ">
                          {a.pending_requests}
                        </span>

                      </div>

                    </div>
                  )}

                </div>

                {/* FOOTER */}
                <div className="
                  flex items-center
                  justify-between
                  mt-6 pt-4
                  border-t
                ">

                  {isExpired ? (

                    <span className="
                      text-red-600
                      text-sm font-medium
                      flex items-center gap-1
                    ">
                      <AlertCircle size={15} />
                      Expired
                    </span>

                  ) : (

                    <span className="
                      text-green-600
                      text-sm font-medium
                      flex items-center gap-1
                    ">
                      <Clock size={15} />
                      Active
                    </span>

                  )}

                  <span className="
                    text-blue-600
                    text-sm font-medium
                  ">
                    Open →
                  </span>

                </div>

              </div>
            );
          })
        )}

      </div>

    </Layout>
  );
}