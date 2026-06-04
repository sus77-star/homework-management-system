import { useEffect, useState } from 'react';

import Layout from '../components/Layout';
import api from '../services/api';

import { jwtDecode } from 'jwt-decode';

import {
  Users,
  GraduationCap,
  BookOpen,
  FolderKanban,
  ClipboardList,
  FileCheck,
  BellRing,
  Trophy,
  AlertCircle
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

import { useNavigate } from 'react-router-dom';



export default function Dashboard() {

  const [stats, setStats] = useState(null);
  const [role, setRole] = useState('');
  const navigate = useNavigate();
  // ==============================
  // INIT
  // ==============================
  useEffect(() => {

    const token = localStorage.getItem('token');

    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }

    fetchStats();
    fetchAnalytics();

  }, []);

  // ==============================
  // FETCH
  // ==============================
  const fetchStats = async () => {

    try {

      const res = await api.get('/dashboard/stats');

      setStats(res.data);

    } catch (err) {

      console.log(err.response?.data);

    }
  };

  const [analytics, setAnalytics] =
  useState(null);

  const fetchAnalytics = async () => {

    try {

      const res =
        await api.get('/dashboard/analytics');

      setAnalytics(res.data);

    } catch (err) {

      console.log(err);

    }
  };


  // ==============================
  // LOADING
  // ==============================
  if (!stats) {

    return (
      <Layout>
        <div className="
          flex items-center
          justify-center
          h-[70vh]
          text-gray-500
        ">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* ======================
          HEADER
      ====================== */}
      <div className="mb-8">

        <h1 className="
          text-3xl font-bold
          text-gray-800 mb-2
        ">
          Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome back to Homework Management System.
        </p>

      </div>

      {/* ======================
          ADMIN DASHBOARD
      ====================== */}
      {role === 'admin' && (

        <div className="
          grid grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-6
          mb-8
        ">

          {/* USERS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <Users
                className="text-blue-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-blue-100 text-blue-700
                px-3 py-1 rounded-full
              ">
                USERS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.users}
            </h2>

            <p className="text-gray-500 mt-1">
              Total system users
            </p>

          </div>

          {/* STUDENTS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <GraduationCap
                className="text-green-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-green-100 text-green-700
                px-3 py-1 rounded-full
              ">
                STUDENTS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.students}
            </h2>

            <p className="text-gray-500 mt-1">
              Registered students
            </p>

          </div>

          {/* TEACHERS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <Users
                className="text-purple-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-purple-100 text-purple-700
                px-3 py-1 rounded-full
              ">
                TEACHERS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.teachers}
            </h2>

            <p className="text-gray-500 mt-1">
              Active teachers
            </p>

          </div>

          {/* CLASSES */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <BookOpen
                className="text-orange-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-orange-100 text-orange-700
                px-3 py-1 rounded-full
              ">
                CLASSES
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.classes}
            </h2>

            <p className="text-gray-500 mt-1">
              Total classes
            </p>

          </div>

          {/* COURSES */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <FolderKanban
                className="text-pink-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-pink-100 text-pink-700
                px-3 py-1 rounded-full
              ">
                COURSES
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.courses}
            </h2>

            <p className="text-gray-500 mt-1">
              Available courses
            </p>

          </div>

          {/* ASSIGNMENTS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <ClipboardList
                className="text-cyan-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-cyan-100 text-cyan-700
                px-3 py-1 rounded-full
              ">
                ASSIGNMENTS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.assignments}
            </h2>

            <p className="text-gray-500 mt-1">
              Total assignments
            </p>

          </div>

          {/* SUBMISSIONS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <FileCheck
                className="text-emerald-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-emerald-100 text-emerald-700
                px-3 py-1 rounded-full
              ">
                SUBMISSIONS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.submissions}
            </h2>

            <p className="text-gray-500 mt-1">
              Student submissions
            </p>

          </div>

        </div>
      )}

{/* ======================
          ADMIN CHARTS
      ====================== */}
      {role === 'admin' && analytics && (

        <div className="
          grid grid-cols-1
          lg:grid-cols-2
          gap-6 mb-8
        ">

          {/* USER DISTRIBUTION */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <h2 className="
              text-lg font-semibold
              text-gray-800 mb-4
            ">
              User Distribution
            </h2>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={analytics.users}
                    dataKey="total"
                    nameKey="role"
                    outerRadius={90}
                    label
                  />

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* SYSTEM OVERVIEW */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <h2 className="
              text-lg font-semibold
              text-gray-800 mb-4
            ">
              System Overview
            </h2>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={[
                    {
                      name: 'Assignments',
                      total: analytics.assignments
                    },
                    {
                      name: 'Submissions',
                      total: analytics.submissions
                    }
                  ]}
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="total" />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>
      )}


{role === 'teacher' && (

  <div className="
    flex flex-wrap
    gap-3
    mb-6
  ">

    <button
      onClick={() =>
        navigate('/assignments?review=needs_review')
      }
      className="
        px-4 py-2
        bg-yellow-100
        text-yellow-700
        rounded-xl
        font-medium
      "
    >
      Review ({stats.pending_review})
    </button>

    <button
      onClick={() =>
        navigate('/assignments?review=has_requests')
      }
      className="
        px-4 py-2
        bg-orange-100
        text-orange-700
        rounded-xl
        font-medium
      "
    >
      Requests ({stats.pending_requests})
    </button>

  </div>

)}

      {/* ======================
          TEACHER DASHBOARD
      ====================== */}
      {role === 'teacher' && (

        <div className="
          grid grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-6
          mb-8
        ">

          {/* ASSIGNMENTS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <ClipboardList
                className="text-blue-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-blue-100 text-blue-700
                px-3 py-1 rounded-full
              ">
                REVIEW
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.pending_review}
            </h2>

            <p className="text-gray-500 mt-1">
              Submissions waiting review
            </p>


          </div>

          {/* SUBMISSIONS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <FileCheck
                className="text-green-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-green-100 text-green-700
                px-3 py-1 rounded-full
              ">
                SUBMISSIONS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.submissions}
            </h2>

            <p className="text-gray-500 mt-1">
              Received submissions
            </p>

          </div>

          {/* REQUESTS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <BellRing
                className="text-orange-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-orange-100 text-orange-700
                px-3 py-1 rounded-full
              ">
                REQUESTS
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.pending_requests}
            </h2>

            <p className="text-gray-500 mt-1">
              Pending resubmits
            </p>

          </div>

          {/* AVERAGE */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <Trophy
                className="text-yellow-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-yellow-100 text-yellow-700
                px-3 py-1 rounded-full
              ">
                AVERAGE
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.average_score}
            </h2>

            <p className="text-gray-500 mt-1">
              Average student score
            </p>

          </div>

        </div>
      )}

      {/* ======================
          TEACHER CHARTS
      ====================== */}
      {role === 'teacher' && analytics && (

        <div className="
          grid grid-cols-1
          lg:grid-cols-2
          gap-6 mb-8
        ">

          {/* GRADE DISTRIBUTION */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <h2 className="
              text-lg font-semibold
              text-gray-800 mb-4
            ">
              Grade Distribution
            </h2>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={analytics.grades}
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="grade_letter" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="total" />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* PENDING */}
<div
  className="
    bg-white
    rounded-2xl
    shadow
    p-6
  "
>

  <h2
    className="
      text-lg
      font-semibold
      text-gray-800
      mb-6
    "
  >
    Teacher Inbox
  </h2>

  <div className="space-y-4">

    <div className="
      flex
      justify-between
      items-center
      pb-3
      border-b
    ">

      <span className="text-gray-600">
        Needs Review
      </span>

      <span className="
        font-bold
        text-yellow-600
      ">
        {analytics.pending_review}
      </span>

    </div>

    <div className="
      flex
      justify-between
      items-center
      pb-3
      border-b
    ">

      <span className="text-gray-600">
        Resubmit Requests
      </span>

      <span className="
        font-bold
        text-orange-600
      ">
        {analytics.pending_requests}
      </span>

    </div>

    <div className="
      flex
      justify-between
      items-center
      pb-3
      border-b
    ">

      <span className="text-gray-600">
        Total Submissions
      </span>

      <span className="
        font-bold
        text-green-600
      ">
        {stats.submissions}
      </span>

    </div>

    <div className="
      flex
      justify-between
      items-center
    ">

      <span className="text-gray-600">
        Average Score
      </span>

      <span className="
        font-bold
        text-blue-600
      ">
        {stats.average_score}
      </span>

    </div>

  </div>

</div>

        </div>
      )}

      {/* ======================
          STUDENT DASHBOARD
      ====================== */}
      {role === 'student' && (

        <div className="
          grid grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-6
          mb-8
        ">

          {/* SUBMITTED */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <FileCheck
                className="text-green-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-green-100 text-green-700
                px-3 py-1 rounded-full
              ">
                SUBMITTED
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.submitted}
            </h2>

            <p className="text-gray-500 mt-1">
              Submitted assignments
            </p>

          </div>

          {/* PENDING */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <AlertCircle
                className="text-red-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-red-100 text-red-700
                px-3 py-1 rounded-full
              ">
                PENDING
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.pending}
            </h2>

            <p className="text-gray-500 mt-1">
              Unsubmitted assignments
            </p>

          </div>

          {/* AVERAGE */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <Trophy
                className="text-yellow-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-yellow-100 text-yellow-700
                px-3 py-1 rounded-full
              ">
                AVERAGE
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.average_score}
            </h2>

            <p className="text-gray-500 mt-1">
              Average score
            </p>

          </div>

          {/* LATEST GRADE */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <div className="
              flex items-center
              justify-between mb-4
            ">

              <GraduationCap
                className="text-blue-600"
                size={30}
              />

              <span className="
                text-xs font-medium
                bg-blue-100 text-blue-700
                px-3 py-1 rounded-full
              ">
                LATEST
              </span>

            </div>

            <h2 className="
              text-3xl font-bold
              text-gray-800
            ">
              {stats.latest_grade?.score || '-'}
            </h2>

            <p className="text-gray-500 mt-1">
              Grade:
              {' '}
              {stats.latest_grade?.grade_letter || '-'}
            </p>

          </div>

        </div>
      )}

      {/* ======================
          STUDENT CHARTS
      ====================== */}
      {role === 'student' && analytics && (

        <div className="
          grid grid-cols-1
          gap-6 mb-8
        ">

          {/* SCORE PROGRESS */}
          <div className="
            bg-white rounded-2xl
            shadow p-6
          ">

            <h2 className="
              text-lg font-semibold
              text-gray-800 mb-4
            ">
              Score Progress
            </h2>

            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={analytics.scores}
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="title" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="score"
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>
      )}
    </Layout>
  );
}