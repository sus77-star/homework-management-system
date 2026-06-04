import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursesPage() {

  const [role, setRole] = useState('');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const [editingCourse, setEditingCourse] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    teacher_id: ''
  });

  // ==============================
  // ROLE
  // ==============================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }
  }, []);

  // ==============================
  // FETCH
  // ==============================
  const fetchData = async () => {
  setLoading(true);
  try {
    const cRes = await api.get('/courses');
    const clsRes = await api.get('/classes');

    let tRes = { data: [] };

    if (role === 'admin') {
      tRes = await api.get('/users?role=teacher');
    }

    const data = Array.isArray(cRes.data)
      ? cRes.data
      : cRes.data.data || [];

    setCourses(data);
    setClasses(clsRes.data);
    setTeachers(tRes.data);

  } catch (err) {
    console.log(err.response?.data);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
      if (role) {
        fetchData();
      }
    }, [role]);

    useEffect(() => {
      setCurrentPage(1);
    }, [search, teacherFilter]);

  // ==============================
  // SORT
  // ==============================
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc'
      ? <ArrowUp size={14} className="inline ml-1" />
      : <ArrowDown size={14} className="inline ml-1" />;
  };

  // ==============================
  // FILTER + SORT
  // ==============================
const filteredCourses = courses
  .filter((c) => {

    const keyword = search.toLowerCase().trim();

    const matchSearch =
      (c.title || '')
        .toLowerCase()
        .includes(keyword) ||

      (c.description || '')
        .toLowerCase()
        .includes(keyword) ||

      (c.teacher_name || '')
        .toLowerCase()
        .includes(keyword);

    const matchTeacher =
      !teacherFilter ||
      (c.teacher_name || '')
        .toLowerCase()
        .trim() === teacherFilter
        .toLowerCase()
        .trim();

    return matchSearch && matchTeacher;
  })
  .sort((a, b) => {
    if (!sortKey) return 0;

    let valA = a[sortKey] ?? '';
    let valB = b[sortKey] ?? '';

    valA = valA.toString().toLowerCase();
    valB = valB.toString().toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;

    return 0;
  });

  // ==============================
  // PAGINATION
  // ==============================
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const totalPages = Math.ceil(filteredCourses.length / perPage);

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const uniqueTeachers = [
    ...new Map(
      courses
        .filter((c) => c.teacher_name)
        .map((c) => [
          c.teacher_name,
          {
            id: c.teacher_id,
            name: c.teacher_name
          }
        ])
    ).values()
  ];

  // ==============================
  // CREATE
  // ==============================
  const handleCreate = async () => {
    if (!form.title || !form.description || !form.teacher_id) {
      toast.error('Every Field must be Filled');
      return;
    }

    try {
      await api.post('/courses', form);
      toast.success('Course Create Success');

      setForm({ title: '', description: '', teacher_id: '' });
      fetchData();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot Create Course');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/courses/${editingCourse.id}`, form);

      toast.success('Course Updated');

      setEditingCourse(null);
      setForm({ title: '', description: '', teacher_id: '' });
      fetchData();

    } catch (err) {
      toast.error('Course Fail to Update');
    }
  };
  // ==============================
  // DELETE
  // ==============================
  const handleDelete = async (id) => {
    if (!confirm('Delete course?')) return;
    await api.delete(`/courses/${id}`);
    fetchData();
  };

  
  return (
    <Layout>

      {/* CREATE */}
      {role === 'admin' && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="font-semibold mb-3 text-gray-800">Create Course</h2>

          <div className="grid grid-cols-4 gap-3">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500"
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button
              onClick={editingCourse ? handleUpdate : handleCreate}
              className="bg-blue-600 text-white rounded px-4"
            >
              {editingCourse ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-1/3
          bg-white focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="
            p-2 border rounded
            bg-white focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">All Teachers</option>

          {uniqueTeachers.map((t) => (
            <option
              key={t.id || t.name}
              value={t.name}
            >
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th onClick={() => handleSort('title')} className="p-3 cursor-pointer">
                Title {renderSortIcon('title')}
              </th>

              <th className="p-3">Description</th>

              <th onClick={() => handleSort('teacher_name')} className="p-3 cursor-pointer">
                Teacher {renderSortIcon('teacher_name')}
              </th>

              {role === 'admin' && <th className="p-3">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td className="p-4">Loading...</td></tr>
            ) : paginatedCourses.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/courses/${c.id}`)}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-3 font-semibold">{c.title}</td>
                <td className="p-3">{c.description}</td>
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                    {c.teacher_name || '-'}
                  </span>
                </td>

                {role === 'admin' && (
                  <td className="p-3 flex gap-2">
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCourse(c);
                      setForm({
                        title: c.title,
                        description: c.description,
                        teacher_id: c.teacher_id
                      });
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                  </td>
                )}
              </tr>
            ))}

            {!loading && paginatedCourses.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-gray-500">
                  No courses found
                </td>
              </tr>
            )}

          </tbody>
        </table>

        <div className="flex justify-center items-center gap-2 mt-4">
        {/* PREV */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Prev
        </button>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 p-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* NEXT */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Next
        </button>

      </div>
      </div>
    </Layout>
  );
}