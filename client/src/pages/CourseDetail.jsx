import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CourseDetail() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [role, setRole] = useState('');

  const [file, setFile] = useState(null);
  const [formats, setFormats] = useState('');
  const [maxSize, setMaxSize] = useState(5);
  const navigate = useNavigate();


  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    deadline: '',
    type: 'upload'
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
  useEffect(() => {
    fetchCourse();
    fetchAssignments();
  }, [id]);

  const fetchCourse = async () => {
    const res = await api.get(`/courses/${id}`);
    setCourse(res.data);
  };

  const fetchAssignments = async () => {
    const res = await api.get(`/assignments?course_id=${id}`);
    setAssignments(res.data);
  };

  // ==============================
  // STATUS
  // ==============================
  const getStatus = (assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.due_date);

    if (now > deadline) return 'late';
    return 'pending';
  };

  const renderStatus = (status) => {
    if (status === 'late')
      return (
        <span className="flex items-center gap-1 text-red-600 text-xs">
          <AlertCircle size={14} /> Late
        </span>
      );

    return (
      <span className="flex items-center gap-1 text-gray-500 text-xs">
        <Clock size={14} /> Pending
      </span>
    );
  };

  // ==============================
  // CREATE
  // ==============================
  const handleCreate = async () => {

  if (!form.title || !form.deadline) {
    return toast.error('Title and deadline are required');
  }

  try {

    const formData = new FormData();

    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('difficulty', form.difficulty);

    formData.append(
      'due_date',
      new Date(form.deadline).toISOString()
    );

    formData.append('course_id', id);

    formData.append('type', form.type);


    if (file) {
      formData.append('file', file);
    }


    formData.append('allowed_formats', formats);
    formData.append('max_file_size', maxSize);

    // =========================
    // API
    // =========================
    const res = await api.post('/assignments', formData);

    
    toast.success(res.data.message);

    setForm({
      title: '',
      description: '',
      difficulty: 'easy',
      deadline: '',
      type: 'upload'
    });

    setFile(null);

    setFormats('');
    setMaxSize(5);

    fetchAssignments();

  } catch (err) {

    console.log(err.response?.data);

    toast.error(
      err.response?.data?.message ||
      'Error creating assignment'
    );
  }
};

  // ==============================
  // SUBMIT
  // ==============================
  const handleSubmit = async (assignment) => {
    const isExpired =
      new Date(assignment.due_date) < new Date();

    if (isExpired) {
      return alert('Deadline sudah lewat');
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.click();

    input.onchange = async () => {
      const selectedFile = input.files[0];
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post(
        `/assignments/${assignment.id}/submit`,
        formData
      );

      alert('Submitted');
    };
  };

  // ==============================
  // SUBMISSIONS
  // ==============================
  const loadSubmissions = async (id) => {
    const res = await api.get(`/assignments/${id}/submissions`);
    setSubmissions(res.data);
  };

  // ==============================
  // GRADE
  // ==============================
  const handleGrade = async (id) => {
    const grade = prompt('Nilai:');
    const feedback = prompt('Feedback:');

    if (!grade) return;

    await api.patch(`/assignments/submissions/${id}/grade`, {
      grade,
      feedback
    });

    loadSubmissions(selectedAssignment.id);
  };

  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-2">
        {course?.title}
      </h2>

      <p className="text-gray-600 mb-6">
        {course?.description}
      </p>

      {/* CREATE */}
      {role === 'teacher' && (
        <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload size={16} /> Create Assignment
          </h3>

          <input
            placeholder="Title"
            className="border p-2 w-full
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <input
            placeholder="Description"
            className="border p-2 w-full
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="datetime-local"
            className="border p-2 w-full
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
            value={form.deadline}
            onChange={(e) =>
              setForm({ ...form, deadline: e.target.value })
            }
          />

          <select
            className="border p-2 w-full
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
            value={form.difficulty}
            onChange={(e) =>
              setForm({ ...form, difficulty: e.target.value })
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="border p-2 w-full
            bg-gray-50 focus:ring-2 focus:ring-blue-500"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value
              })
            }
          >
            <option value="upload">
              Upload Assignment
            </option>

            <option value="quiz">
              Quiz Assignment
            </option>
          </select>

          {form.type === 'upload' && (

            <>

              <input
                type="text"
                placeholder="Allowed formats (pdf,docx,zip)"
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                className="border p-2 w-full
                bg-gray-50 focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                placeholder="Max file size (MB)"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="border p-2 w-full
                bg-gray-50 focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="file"
                className="border p-2 w-full "
                onChange={(e) => setFile(e.target.files[0])}
              />

            </>

          )}

          {form.type === 'quiz' && (
            <p className="text-sm text-blue-500">
              Questions can be added after assignment creation.
            </p>
          )}

          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b font-semibold">
          Assignments
        </div>

        {assignments.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No assignments yet
          </div>
        ) : (
          <ul>
            {assignments.map((a) => {
              const status = getStatus(a);

              return (
                <li
                  key={a.id}
                  onClick={() => navigate(`/assignments/${a.id}`)}
                  className={`p-4 border-t cursor-pointer ${
                    selectedAssignment?.id === a.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-medium flex items-center gap-2">
                      <FileText size={16} />
                      {a.title}
                    </p>

                    {renderStatus(status)}
                  </div>

                  <p className="text-sm text-gray-500">
                    {new Date(a.due_date).toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-400">
                    Difficulty: {a.difficulty}
                  </p>

                  {a.file_url && (
                    <a
                      href={`http://localhost:3000${a.file_url}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 text-sm flex items-center gap-1 mt-1"
                    >
                      <Download size={14} />
                      Download File
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* STUDENT */}
      {role === 'student' && selectedAssignment && (
        <button
          onClick={() => handleSubmit(selectedAssignment)}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          Submit Assignment
        </button>
      )}

      {/* TEACHER */}
      {role === 'teacher' && selectedAssignment && (
        <div className="mt-6">
          <button
            onClick={() =>
              loadSubmissions(selectedAssignment.id)
            }
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            View Submissions
          </button>

          {submissions.map((s) => (
            <div key={s.id} className="border p-3 mt-3 rounded">
              <p>{s.student_name}</p>

              {s.file_url && (
                <a
                  href={`http://localhost:3000${s.file_url}`}
                  target="_blank"
                  className="text-blue-500"
                >
                  View File
                </a>
              )}

              <p>Grade: {s.grade || '-'}</p>

              <button
                onClick={() => handleGrade(s.id)}
                className="ml-3 bg-blue-500 text-white px-2 py-1 rounded"
              >
                Grade
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}