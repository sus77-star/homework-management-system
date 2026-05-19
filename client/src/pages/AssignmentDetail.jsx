import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AssignmentDetail() {
const { id } = useParams();

const [assignment, setAssignment] = useState(null);
const [role, setRole] = useState('');
const [file, setFile] = useState(null);
const [submissions, setSubmissions] = useState([]);
const [requests, setRequests] = useState([]);
const [questions, setQuestions] = useState([]);
const [answers, setAnswers] = useState({});

const [showQuestionModal, setShowQuestionModal] =
  useState(false);

const [questionForm, setQuestionForm] = useState({
  question_text: '',
  question_type: 'subjective',
  points: 10,

  options: [
    '',
    '',
    '',
    ''
  ],

  correct_index: 0
});

const [mySubmission, setMySubmission] = useState(null);
const [resubmitStatus, setResubmitStatus] = useState(null);
const [reason, setReason] = useState('');


// ==============================
// INIT
// ==============================
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = jwtDecode(token);
    setRole(decoded.role);
  }

  fetchAll();
}, []);

// teacher only
useEffect(() => {
  if (role === 'teacher') {
    fetchRequests();
  }
}, [role]);


// ==============================
// FETCH ALL (SINGLE SOURCE)
// ==============================
const fetchAll = async () => {
  try {
    await Promise.all([
      fetchAssignment(),
      fetchSubmissions(),
      fetchMySubmission(),
      fetchResubmitStatus(), //  selalu ambil status
      fetchQuestions()
    ]);
  } catch (err) {
    console.error("Fetch error:", err);
  }
};


// ==============================
// FETCH FUNCTIONS
// ==============================
const fetchAssignment = async () => {
  const res = await api.get(`/assignments/${id}`);
  setAssignment(res.data);
};

const fetchSubmissions = async () => {
  const res = await api.get(`/assignments/${id}/submissions`);
  setSubmissions(res.data);
};

const fetchMySubmission = async () => {
  const res = await api.get(`/assignments/${id}/my-submission`);
  setMySubmission(res.data);
};

const fetchResubmitStatus = async () => {
  const r = await api.get(
    `/assignments/${id}/resubmit-status`
  );

  if (r.data?.status === 'used') {
    setResubmitStatus(null);
    return;
  }

  setResubmitStatus(r.data);
};

const fetchRequests = async () => {
  const res = await api.get(`/assignments/${id}/resubmit-requests`);
  setRequests(res.data);
};

const fetchQuestions = async () => {

  try {

    const res = await api.get(
      `/assignments/${id}/questions`
    );

    setQuestions(res.data);

  } catch (err) {

    console.error(err);
  }
};


// ==============================
// SUBMIT / RESUBMIT
// ==============================
const handleSubmit = async () => {

  if (!file) {
    return toast.error('Select file');
  }

  // =========================
  // DEADLINE CHECK
  // =========================
  const isExpired =
    assignment?.due_date &&
    new Date(assignment.due_date) < new Date();

  if (isExpired) {
    return toast.error('Deadline sudah lewat');
  }

  // =========================
  // RESUBMIT CHECK
  // =========================
  if (
    mySubmission &&
    resubmitStatus?.status !== 'approved'
  ) {
    return toast.error('Resubmit belum di-approve');
  }

  // =========================
  // FORMAT VALIDATION
  // =========================
  const allowedFormats =
    assignment.allowed_formats || [];

  const fileExt =
    file.name.split('.').pop().toLowerCase();

  if (
    allowedFormats.length &&
    !allowedFormats.includes(fileExt)
  ) {
    return toast.error(
      `Format not allowed. Allowed: ${allowedFormats.join(', ')}`
    );
  }

  // =========================
  // SIZE VALIDATION
  // =========================
  const maxSizeMB =
    assignment.max_file_size || 5;

  const fileSizeMB =
    file.size / (1024 * 1024);

  if (fileSizeMB > maxSizeMB) {
    return toast.error(
      `File too large. Max ${maxSizeMB} MB`
    );
  }

  // =========================
  // SUBMIT
  // =========================
  try {

    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(
      `/assignments/${id}/submit`,
      formData
    );

    toast.success(res.data.message);

    setFile(null);

    await fetchAll();

  } catch (err) {

    console.error(err);

    toast.error(
      err.response?.data?.message ||
      'Submit failed'
    );
  }
};


// ==============================
// REQUEST RESUBMIT
// ==============================
const handleRequestResubmit = async () => {
  if (!reason) return alert('Please enter reason');

  try {
    const res = await api.post(
      `/assignments/${id}/resubmit-requests`,
      { reason }
    );

    console.log("SUCCESS:", res.data);

    alert('Request sent');
    setReason('');

    await fetchAll(); // 🔥 FIX UTAMA (bukan fetch status doang)

  } catch (err) {
    console.log("ERROR:", err.response?.data);
    alert(err.response?.data?.message || 'Request failed');
  }
};


// ==============================
// TEACHER APPROVE / REJECT
// ==============================
const handleUpdateRequest = async (requestId, status) => {
  try {
    await api.patch(`/assignments/resubmit-requests/${requestId}`, {
      status
    });

    await fetchRequests(); // update list teacher

  } catch (err) {
    console.error(err);
    alert('Update gagal');
  }
};

  // ==============================
  // GRADE
  // ==============================

  const [gradeData, setGradeData] = useState({});
  const handleGrade = async (submissionId) => {

  try {

    const payload = gradeData[submissionId];

    const res = await api.patch(
      `/assignments/submissions/${submissionId}/grade`,
      {
        score: payload.score,
        feedback: payload.feedback
      }
    );

    toast.success(res.data.message);

    fetchSubmissions();

  } catch (err) {

    console.log(err.response?.data);

    toast.error(
      err.response?.data?.message ||
      'Error grading'
    );
  }
};
const [editMode, setEditMode] = useState(false);

const [editForm, setEditForm] = useState({
  title: '',
  description: '',
  due_date: '',
  allowed_formats: '',
  max_file_size: '',
  difficulty: ''
});

// ==============================
// UPDATE ASSIGNMENT
// ==============================
const handleUpdateAssignment = async () => {

  try {

    const payload = {
      title: editForm.title,
      description: editForm.description,
      due_date: editForm.due_date,
      difficulty: editForm.difficulty,
      allowed_formats:
        editForm.allowed_formats
          .split(',')
          .map(f => f.trim().toLowerCase()),
      max_file_size: editForm.max_file_size
    };

    const res = await api.patch(
      `/assignments/${id}`,
      payload
    );

    toast.success(res.data.message);

    setEditMode(false);

    fetchAssignment();

  } catch (err) {

    console.error(err);

    toast.error(
      err.response?.data?.message ||
      'Update failed'
    );
  }
};

      const handleSaveQuestion = async () => {

        try {

          const payload = {
            question_text:
              questionForm.question_text,

            question_type:
              questionForm.question_type,

            points:
              questionForm.points,

            options:
              questionForm.options,

            correct_index:
              questionForm.correct_index
          };

          const res = await api.post(
            `/assignments/${id}/questions`,
            payload
          );

          toast.success(res.data.message);

          // RESET
          setQuestionForm({
            question_text: '',
            question_type: 'subjective',
            points: 10,

            options: [
              '',
              '',
              '',
              ''
            ],

            correct_index: 0
          });

          setShowQuestionModal(false);
          fetchQuestions();

        } catch (err) {

          console.error(err);

          toast.error(
            err.response?.data?.message ||
            'Error saving question'
          );
        }
      };

      const handleSubmitQuiz = async () => {

        try {

          const payload = {
            answers
          };

          const res = await api.post(
            `/assignments/${id}/quiz-submit`,
            payload
          );

          toast.success(res.data.message);

        } catch (err) {

          console.error(err);

          toast.error(
            err.response?.data?.message ||
            'Error submitting quiz'
          );
        }
      };

  if (!assignment) return <Layout>Loading...</Layout>;

  const isExpired =
    new Date(assignment.due_date) < new Date();

  return (
    <Layout>
      {/* ======================
    ASSIGNMENT HEADER
====================== */}
<div className="
  bg-white rounded-2xl shadow
  p-6 mb-6
">

  {/* TITLE */}
  <div className="
    flex flex-col md:flex-row
    md:items-start
    md:justify-between
    gap-4
  ">

    <div>

      <h1 className="
        text-3xl font-bold
        text-gray-800
        flex items-center gap-2
      ">
        <FileText size={26} />
        {assignment.title}
      </h1>

      <p className="
        text-gray-600
        mt-2
        max-w-3xl
      ">
        {assignment.description || 'No description'}
      </p>

    </div>

    {/* EDIT BUTTON */}
{role === 'teacher' && (

  <button
    onClick={() => {

      // =========================
      // CANCEL MODE
      // =========================
      if (editMode) {
        setEditMode(false);
        return;
      }

      // =========================
      // OPEN EDIT
      // =========================
      setEditMode(true);

      setEditForm({
        title: assignment.title || '',
        description: assignment.description || '',

        due_date:
          assignment.due_date?.slice(0, 16),

        allowed_formats:
          assignment.allowed_formats?.join(', ') || '',

        max_file_size:
          assignment.max_file_size || 5,

        difficulty:
          assignment.difficulty || 'easy'
      });
    }}

    className={`
      px-5 py-2.5
      rounded-xl
      text-white
      font-medium
      transition
      whitespace-nowrap

      ${
        editMode
          ? 'bg-gray-500 hover:bg-gray-600'
          : 'bg-yellow-500 hover:bg-yellow-600'
      }
    `}
  >

    {editMode
      ? 'Cancel Edit'
      : 'Edit Assignment'}

  </button>
)}

  </div>

  {/* INFO BADGES */}
  <div className="
    flex flex-wrap
    gap-3
    mt-5
  ">

    {/* DIFFICULTY */}
    <span className={`
      px-3 py-1.5
      rounded-full
      text-sm font-medium

      ${
        assignment.difficulty === 'easy'
          ? 'bg-green-100 text-green-700'
          : assignment.difficulty === 'medium'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-red-100 text-red-700'
      }
    `}>
      Difficulty:
      {' '}
      {assignment.difficulty?.toUpperCase()}
    </span>

    {/* DEADLINE */}
    <span className="
      bg-blue-100 text-blue-700
      px-3 py-1.5
      rounded-full
      text-sm font-medium
    ">
      Due:
      {' '}
      {new Date(
        assignment.due_date
      ).toLocaleString()}
    </span>

  {assignment.type === 'upload' && (
      <>
    {/* ALLOWED FORMATS */}
    <span className="
      bg-purple-100 text-purple-700
      px-3 py-1.5
      rounded-full
      text-sm font-medium
    ">
      Formats:
      {' '}
      {assignment.allowed_formats?.join(', ') || 'Any'}
    </span>

    {/* MAX SIZE */}
    <span className="
      bg-orange-100 text-orange-700
      px-3 py-1.5
      rounded-full
      text-sm font-medium
    ">
      Max Size:
      {' '}
      {assignment.max_file_size || 5} MB
    </span>
      </>
  )}

  </div>

    {/* ======================
        QUIZ MANAGEMENT
    ====================== */}
    {assignment.type === 'quiz' &&
    role === 'teacher' && (

      <div className="
        bg-blue-50
        border border-blue-200
        rounded-2xl
        p-5 mt-6
      ">

        <div className="
          flex items-center
          justify-between
        ">

          <div>

            <h3 className="
              text-lg font-semibold
              text-blue-700
            ">
              Quiz Questions
            </h3>

            <p className="
              text-sm text-blue-600 mt-1
            ">
              Manage quiz questions and choices
            </p>

          </div>

          <button
            onClick={() =>
              setShowQuestionModal(true)
            }

            className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-4 py-2
              rounded-xl
              transition
            "
          >
            Add Question
          </button>

        </div>

      </div>
    )}


  {/* MATERIAL FILE */}
  {assignment.file_url && (
    <a
      href={`http://localhost:3000${assignment.file_url}`}
      target="_blank"
      className="
        inline-flex items-center gap-2
        mt-5
        text-blue-600
        hover:text-blue-700
        font-medium
      "
    >
      <Download size={18} />
      Download Assignment Material
    </a>
  )}

</div>


{/* ======================
    QUESTIONS LIST
====================== */}
{assignment.type === 'quiz' && (
  <div className="
    bg-white rounded-2xl
    shadow p-6 mb-6
  ">

    <h2 className="
      text-xl font-bold
      text-gray-800 mb-5
    ">
      Questions
    </h2>

    {questions.length === 0 ? (

      <p className="text-gray-500">
        No questions added yet
      </p>

    ) : (

      <div className="space-y-5">

        {questions.map((q, index) => (

          <div
            key={q.id}
            className="
              border rounded-xl
              p-5
            "
          >

            {/* HEADER */}
            <div className="
              flex items-start
              justify-between
              gap-4
            ">

              <div>

                <h3 className="
                  font-semibold
                  text-gray-800
                ">
                  Question {index + 1}
                </h3>

                <p className="
                  text-gray-700 mt-2
                ">
                  {q.question_text}
                </p>

              </div>

              <span className="
                bg-blue-100
                text-blue-700
                px-3 py-1
                rounded-full
                text-xs font-medium
              ">
                {q.points} pts
              </span>

            </div>

            {/* ======================
                STUDENT VIEW
            ====================== */}
            {role === 'student' ? (

              <div className="mt-5">

                {/* SUBJECTIVE */}
                {q.question_type ===
                  'subjective' && (

                  <textarea
                    placeholder="Write your answer..."

                    value={
                      answers[q.id] || ''
                    }

                    onChange={(e) =>
                      setAnswers({
                        ...answers,

                        [q.id]:
                          e.target.value
                      })
                    }

                    className="
                      border rounded-xl
                      w-full p-3
                    "
                  />
                )}

                {/* SINGLE CHOICE */}
                {q.question_type ===
                  'single_choice' && (

                  <div className="
                    space-y-3
                  ">

                    {q.options?.map((opt) => (

                      <label
                        key={opt.id}

                        className="
                          flex items-center
                          gap-3
                          border rounded-xl
                          p-3 cursor-pointer
                        "
                      >

                        <input
                          type="radio"

                          checked={
                            answers[q.id] ===
                            opt.id
                          }

                          onChange={() =>
                            setAnswers({
                              ...answers,

                              [q.id]:
                                opt.id
                            })
                          }
                        />

                        <span>
                          {opt.option_text}
                        </span>

                      </label>
                    ))}

                  </div>
                )}

              </div>

            ) : (

              <>
                {/* ======================
                    TEACHER VIEW
                ====================== */}
                <p className="
                  text-sm text-gray-500
                  mt-3 capitalize
                ">
                  {q.question_type.replace(
                    '_',
                    ' '
                  )}
                </p>

                {/* OPTIONS */}
                {q.question_type ===
                  'single_choice' && (

                  <div className="
                    mt-4 space-y-2
                  ">

                    {q.options?.map((opt) => (

                      <div
                        key={opt.id}
                        className={`
                          border rounded-lg
                          px-4 py-2
                          text-sm

                          ${
                            opt.is_correct
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : 'bg-gray-50'
                          }
                        `}
                      >
                        {opt.option_text}

                        {opt.is_correct &&
                          ' ✓'}
                      </div>
                    ))}

                  </div>
                )}
              </>
            )}

          </div>
        ))}

        {/* ======================
            STUDENT SUBMIT
        ====================== */}
        {role === 'student' && (

          <button
            onClick={handleSubmitQuiz}
            className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-6 py-3
              rounded-xl
              transition
            "
          >
            Submit Quiz
          </button>
        )}

      </div>
    )}

  </div>
)}


  {/* ======================
    EDIT FORM
====================== */}
{role === 'teacher' && editMode && (

  <div className="
    bg-gray-50
    border
    rounded-2xl
    p-5 mt-6
    space-y-4
  ">

    <h3 className="font-semibold text-lg">
      Edit Assignment
    </h3>

    {/* TITLE */}
    <input
      type="text"
      placeholder="Title"

      value={editForm.title}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          title: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    />

    {/* DESCRIPTION */}
    <textarea
      placeholder="Description"

      value={editForm.description}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          description: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    />

    {/* DEADLINE */}
    <input
      type="datetime-local"

      value={editForm.due_date}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          due_date: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    />

    {/* DIFFICULTY */}
    <select
      value={editForm.difficulty}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          difficulty: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    >
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>

    {/* FORMATS */}
    <input
      type="text"
      placeholder="pdf, docx, zip"

      value={editForm.allowed_formats}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          allowed_formats: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    />

    {/* MAX SIZE */}
    <input
      type="number"
      placeholder="Max file size"

      value={editForm.max_file_size}

      onChange={(e) =>
        setEditForm({
          ...editForm,
          max_file_size: e.target.value
        })
      }

      className="
        border rounded-xl
        w-full p-3
      "
    />

    {/* ACTIONS */}
    <div className="flex gap-3">

      <button
        onClick={handleUpdateAssignment}

        className="
          bg-blue-600
          hover:bg-blue-700
          text-white
          px-5 py-2
          rounded-xl
          transition
        "
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditMode(false)}

        className="
          bg-gray-300
          hover:bg-gray-400
          px-5 py-2
          rounded-xl
          transition
        "
      >
        Cancel
      </button>

    </div>

  </div>
)}

      {/* FILE */}
      {assignment.file_url && (
        <a
          href={`http://localhost:3000${assignment.file_url}`}
          target="_blank"
          className="text-blue-500 flex items-center gap-1 mb-6"
        >
          <Download size={16} />
          Download Material
        </a>
      )}

      {/* ======================
          YOUR SUBMISSION
      ====================== */}
      {role === 'student' && mySubmission && (
        <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
          <h3 className="font-semibold">Your Submission</h3>

          <a
            href={`http://localhost:3000${mySubmission.file_url}`}
            target="_blank"
            className="text-blue-500 underline"
          >
            View File
          </a>

          <p className="text-sm">
  Score:
  {' '}
  <span className="font-medium">
    {mySubmission.score ?? '-'}
  </span>
</p>

<p className="text-sm">
  Grade:
  {' '}
  <span className="font-medium">
    {mySubmission.grade_letter ?? '-'}
  </span>
</p>

<p className="text-sm">
  Feedback:
  {' '}
  <span className="font-medium">
    {mySubmission.feedback ?? '-'}
  </span>
</p>

          {/* STATUS BADGE */}
          {mySubmission?.status !== 'graded' &&
  resubmitStatus && (
    <span
      className={`
        text-xs px-2 py-1 rounded font-medium

        ${
          resubmitStatus.status === 'approved'
            ? 'bg-green-100 text-green-700'
            : resubmitStatus.status === 'pending'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }
      `}
    >
      {resubmitStatus.status}
    </span>
)}

          {/* REQUEST */}
          
          {/* ======================
    GRADED FINALIZED
====================== */}
{mySubmission?.status === 'graded' ? (

  <p className="text-green-600 text-sm font-medium">
    Assignment has been graded
  </p>

) : (
  <>
    {/* REQUEST FORM */}
    {(resubmitStatus?.status === 'rejected' ||
      !resubmitStatus) && (
      <>
        <textarea
          placeholder="Reason for resubmit"
          className="
            border w-full p-2
            rounded-lg
          "
          value={reason}
          onChange={(e) =>
            setReason(e.target.value)
          }
        />

        <button
          onClick={handleRequestResubmit}
          className="
            bg-orange-500
            hover:bg-orange-600
            text-white
            px-3 py-1
            rounded-lg
            transition
          "
        >
          Request Resubmit
        </button>
      </>
    )}

    {/* PENDING */}
    {resubmitStatus?.status === 'pending' && (
      <p className="text-yellow-600 text-sm">
        Waiting approval...
      </p>
    )}

    {/* APPROVED */}
    {resubmitStatus?.status === 'approved' && (
      <p className="text-green-600 text-sm">
        You can resubmit now
      </p>
    )}
  </>
)}
        </div>
      )}

      {/* ======================
    SUBMIT
====================== */}
{role === 'student' &&
 assignment.type ==='upload' && (

  <>
    {/* ======================
        FINALIZED
    ====================== */}
    {mySubmission?.status === 'graded' ? (

      <div
        className="
          bg-green-50
          border border-green-200
          rounded-xl
          p-4 mb-6
        "
      >
        <p className="text-green-700 font-medium">
          Submission finalized after grading
        </p>

        <p className="text-sm text-green-600 mt-1">
          Resubmission is no longer allowed
        </p>
      </div>

    ) : (

      <div className="bg-white p-4 rounded-xl shadow mb-6">

        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Upload size={16} />
          Submit Assignment
        </h3>

        {/* FILE RULES */}
        <p className="text-sm text-gray-500 mb-1">
          Allowed:
          {' '}
          {assignment.allowed_formats?.join(', ') || 'Any'}
        </p>

        <p className="text-sm text-gray-500 mb-3">
          Max size:
          {' '}
          {assignment.max_file_size || 5} MB
        </p>

        {/* FILE INPUT */}
        <input
          type="file"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
          className="mb-3"
        />

        {/* SUBMIT BUTTON */}
       <button
  disabled={
    isExpired ||

    (
      mySubmission &&
      (
        !resubmitStatus ||
        resubmitStatus.status !== 'approved'
      )
    )
  }

  onClick={handleSubmit}

  className={`
    px-4 py-2 rounded-lg
    text-white transition

    ${
      isExpired ||
      (
        mySubmission &&
        (
          !resubmitStatus ||
          resubmitStatus.status !== 'approved'
        )
      )
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700'
    }
  `}
>
  {isExpired
    ? 'Deadline Passed'
    : mySubmission
    ? 'Resubmit'
    : 'Submit'}
</button>
{mySubmission &&
 !resubmitStatus && (
  <p className="text-sm text-gray-500 mt-3">
    Request teacher approval to resubmit
  </p>
)}

{resubmitStatus?.status === 'pending' && (
  <p className="text-sm text-yellow-600 mt-3">
    Waiting for teacher approval
  </p>
)}

{resubmitStatus?.status === 'approved' && (
  <p className="text-sm text-green-600 mt-3">
    You can resubmit now
  </p>
)}

      </div>

    )}
  </>
)}
      {/* ======================
          SUBMISSIONS TABLE
      ====================== */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {/* <div className="p-4 border-b font-semibold">
          Submissions
        </div> */}

         {/* ======================
    RESUBMIT REQUESTS (TEACHER)
====================== */}
{role === 'teacher' && (
  <div className="bg-white rounded-xl shadow mt-6">
    <div className="p-4 border-b font-semibold text-gray-700 bg-gray-50">
      Resubmit Requests
    </div>
    {requests.length === 0 ? (
      <p className="p-4 text-gray-500">No requests</p>
    ) : (
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-center font-semibold text-black">Student</th>
            <th className="p-4 text-center font-semibold text-black">Reason</th>
            <th className="p-4 text-center font-semibold text-black">Status</th>
            <th className="p-4 text-center font-semibold text-black">Action</th>
          </tr>
        </thead>
        
        <tbody>
            
          {requests.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.student_name}</td>
              <td className="p-3">{r.reason}</td>
              <td className="p-3">{r.status}</td>

              <td className="p-3 text-center space-x-2">
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateRequest(r.id, 'approved')}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => handleUpdateRequest(r.id, 'rejected')}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
        <div className="p-4 border-b font-semibold text-gray-700 bg-gray-50">
      Submission
    </div>
        {submissions.length === 0 ? (
          <p className="p-4 text-gray-500">
            No submissions
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
  <tr>
    <th className="p-4 text-center font-semibold">Student</th>

    <th className="p-4 text-center font-semibold">
      File
    </th>

    <th className="p-4 text-center font-semibold">
      Date
    </th>

    <th className="p-4 text-center font-semibold">
      Status
    </th>
    
    <th className="p-4 text-center font-semibold">
      Score
    </th>

    <th className="p-4 text-center font-semibold">
      Grade
    </th>

    <th className="p-4 text-center font-semibold">
      Feedback
    </th>


    {/* ======================
        TEACHER ONLY
    ====================== */}
    {role === 'teacher' && (
      <>
        <th className="p-4 text-center font-semibold">
          Score
        </th>

        <th className="p-4 text-center font-semibold">
          Grade
        </th>

        <th className="p-4 text-center font-semibold">
          Feedback
        </th>

        <th className="p-4 text-center font-semibold">
          Action
        </th>
      </>
    )}
  </tr>
</thead>

            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{s.student_name}</td>

                  <td className="p-3">
                    <a
                      href={`http://localhost:3000${s.file_url}`}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </td>

                  <td className="p-3">
                    {!s.submitted_at
                      ? '-'
                      : new Date(s.submitted_at).toLocaleString()}
                  </td>

                  {/* STATUS */}
                  <td className="p-4">
                    <div className="flex justify-center">
                    {s.is_late ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> Late
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} /> On Time
                      </span>
                    )}
                     </div>
                  </td>

                    {/* SCORE */}
<td className="p-4 text-center align-middle">
  <span className="font-medium">
    {s.score ?? '-'}
  </span>
</td>

{/* GRADE */}
<td className="p-4 text-center align-middle">
  <span className="
    bg-blue-100
    text-blue-700
    px-2 py-1
    rounded-md
    text-xs
    font-semibold
  ">
    {s.grade_letter ?? '-'}
  </span>
</td>

{/* FEEDBACK */}
<td className="p-4 text-center align-middle">
  <span className="text-gray-600">
    {s.feedback ?? '-'}
  </span>
</td>

                  {/* ======================
    TEACHER GRADING
====================== */}
{role === 'teacher' && (
  <>
    {/* SCORE */}
    <td className="p-3">

      <input
        type="number"
        min="0"
        max="100"
        placeholder="Score"
        className="
          border rounded-lg
          px-3 py-2
          w-24
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "

        value={
          gradeData[s.id]?.score ??
          s.score ??
          ''
        }

        onChange={(e) =>
          setGradeData({
            ...gradeData,

            [s.id]: {
              ...gradeData[s.id],

              score: e.target.value
            }
          })
        }
      />

    </td>

    {/* GRADE LETTER */}
    <td className="p-3">

      <span
        className="
          bg-blue-100
          text-blue-700
          px-2 py-1
          rounded-md
          text-xs
          font-semibold
        "
      >
        {s.grade_letter || '-'}
      </span>

    </td>

    {/* FEEDBACK */}
    <td className="p-3">

      <textarea
        placeholder="Write feedback..."
        rows={2}

        className="
          border rounded-lg
          px-3 py-2
          w-56 resize-none
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "

        value={
          gradeData[s.id]?.feedback ??
          s.feedback ??
          ''
        }

        onChange={(e) =>
          setGradeData({
            ...gradeData,

            [s.id]: {
              ...gradeData[s.id],

              feedback: e.target.value
            }
          })
        }
      />

    </td>

    {/* ACTION */}
    <td className="p-3 text-center">

      <button
        onClick={() => handleGrade(s.id)}
        className="
          bg-green-600
          hover:bg-green-700
          text-white
          px-4 py-2
          rounded-lg
          transition
        "
      >
        Save
      </button>

    </td>
  </>
)}
                </tr>
              ))}
              
            </tbody>
            
          </table>
        )}
      </div>

      {/* ======================
          QUESTION MODAL
      ====================== */}
      {showQuestionModal && (

        <div className="
          fixed inset-0
          bg-black/40
          flex items-center
          justify-center
          z-50
        ">

          <div className="
            bg-white
            w-full max-w-2xl
            rounded-2xl
            p-6
            shadow-xl
          ">

            {/* HEADER */}
            <div className="
              flex items-center
              justify-between
              mb-5
            ">

              <h2 className="
                text-2xl font-bold
                text-gray-800
              ">
                Add Question
              </h2>

              <button
                onClick={() =>
                  setShowQuestionModal(false)
                }

                className="
                  text-gray-500
                  hover:text-gray-700
                "
              >
                ✕
              </button>

            </div>

            {/* QUESTION TEXT */}
            <textarea
              placeholder="Question text"

              value={questionForm.question_text}

              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  question_text: e.target.value
                })
              }

              className="
                border rounded-xl
                w-full p-3
                mb-4
              "
            />

            {/* QUESTION TYPE */}
            <select
              value={questionForm.question_type}

              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  question_type: e.target.value
                })
              }

              className="
                border rounded-xl
                w-full p-3
                mb-4
              "
            >
              <option value="subjective">
                Subjective Question
              </option>

              <option value="single_choice">
                Single Choice Question
              </option>
            </select>

            {/* POINTS */}
            <input
              type="number"
              placeholder="Points"

              value={questionForm.points}

              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  points: e.target.value
                })
              }

              className="
                border rounded-xl
                w-full p-3
                mb-4
              "
            />

            {/* ======================
                SINGLE CHOICE OPTIONS
            ====================== */}
            {questionForm.question_type ===
              'single_choice' && (

              <div className="space-y-3">

                {questionForm.options.map(
                  (opt, index) => (

                  <div
                    key={index}
                    className="
                      flex items-center
                      gap-3
                    "
                  >

                    {/* RADIO */}
                    <input
                      type="radio"

                      checked={
                        questionForm.correct_index ===
                        index
                      }

                      onChange={() =>
                        setQuestionForm({
                          ...questionForm,
                          correct_index: index
                        })
                      }
                    />

                    {/* OPTION INPUT */}
                    <input
                      type="text"

                      placeholder={`Option ${
                        index + 1
                      }`}

                      value={opt}

                      onChange={(e) => {

                        const updated =
                          [...questionForm.options];

                        updated[index] =
                          e.target.value;

                        setQuestionForm({
                          ...questionForm,
                          options: updated
                        });
                      }}

                      className="
                        border rounded-xl
                        w-full p-3
                      "
                    />

                  </div>
                ))}

                <p className="
                  text-sm text-gray-500
                ">
                  Select the correct answer
                </p>

              </div>
            )}

            {/* ACTIONS */}
            <div className="
              flex justify-end
              gap-3 mt-6
            ">

              <button
                onClick={() =>
                  setShowQuestionModal(false)
                }

                className="
                  bg-gray-300
                  hover:bg-gray-400
                  px-5 py-2
                  rounded-xl
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSaveQuestion}
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-5 py-2
                  rounded-xl
                  transition
                "
              >
                Save Question
              </button>

            </div>

          </div>

        </div>
      )}
    </Layout>
  );
}
