import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock3,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  ArrowLeft
} from 'lucide-react';

export default function AssignmentDetail() {
const { id } = useParams();
const navigate = useNavigate();

const [assignment, setAssignment] = useState(null);
const [role, setRole] = useState('');
const [file, setFile] = useState(null);
const [submissions, setSubmissions] = useState([]);
const [requests, setRequests] = useState([]);
const [questions, setQuestions] = useState([]);

const [reminders, setReminders] =
  useState([]);

const [customDay, setCustomDay] =
  useState('');

const fetchReminders = async () => {

  const res =
    await api.get(
      `/assignments/${id}/reminders`
    );

  const data =
    res.data.reminders;

  setReminders(
    data.filter(
      d => [1,3,7].includes(
        Math.round(d)
      )
    )
  );

  const custom =
    data.find(
      d =>
        ![1,3,7].includes(
          Math.round(d)
        )
    );

  if (custom) {

    setCustomDay(
      Math.round(custom)
    );

  } else {

    setCustomDay('');

  }

};

const saveReminders = async () => {

  try {

    let finalReminders =
      [...reminders];

    // custom day
    if (
      customDay &&
      Number(customDay) > 0
    ) {

      finalReminders.push(
        Number(customDay)
      );

    }

    // remove duplicate
    finalReminders =
      [...new Set(finalReminders)];

    const res =
      await api.post(
        `/assignments/${id}/reminders`,
        {
          reminders:
            finalReminders
        }
      );

    toast.success(
      res.data.message
    );

    if (
      res.data.skipped?.length
    ) {

      toast(
        `Cannot create ${res.data.skipped.join(', ')} day reminder because deadline is too close.`
      );

    }
    setCustomDay('');

    await fetchReminders();

  } catch (err) {

    console.error(err);

    toast.error(
      'Failed to save reminder'
    );

  }

};

const [quizAnswers, setQuizAnswers] =
  useState([]);

const [quizAnalytics, setQuizAnalytics] =
  useState([]);

const [quizGradeData, setQuizGradeData] =
  useState({});

const [answers, setAnswers] = useState({});
const [quizSubmitted, setQuizSubmitted] =
  useState(false);

const [quizLocked, setQuizLocked] =
  useState(false);

const [hasSubmittedQuiz, setHasSubmittedQuiz] =
  useState(false);

const [showQuestionModal, setShowQuestionModal] =
  useState(false);

const [editingQuestion, setEditingQuestion] =
  useState(null);

const [quizReview, setQuizReview] =
  useState(null);

const fetchQuizReview =
  async () => {

    try {

      const res =
        await api.get(
          `/assignments/${id}/quiz-review`
        );

      setQuizReview(res.data);

    } catch (err) {

      console.error(err);

    }
  };

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

const waitingForGrade =
  quizReview &&
  quizReview.questions &&
  quizReview.questions.some(
    q =>
      q.question_type === 'subjective' &&
      q.score == null
  );

  const groupedQuizAnswers =
  quizAnswers.reduce((acc, answer) => {

    if (!acc[answer.student_name]) {
      acc[answer.student_name] = [];
    }

    acc[answer.student_name].push(answer);

    return acc;

  }, {});

  const [expandedStudent, setExpandedStudent] =
  useState(null);

  const [expandedQuestions,
    setExpandedQuestions] =
    useState([]);

  const [expandedAnalytics,
    setExpandedAnalytics] =
    useState([]);

  
// ==============================
// INIT
// ==============================
useEffect(() => {

  const token =
    localStorage.getItem('token');

  if (token) {

    const decoded =
      jwtDecode(token);

    setRole(decoded.role);
  }

}, []);

useEffect(() => {

  if (role) {
    fetchAll();
  }

}, [role]);

// teacher only
useEffect(() => {
  if (role === 'teacher') {
    fetchRequests();
  }
}, [role]);

const [quizScores, setQuizScores] =
  useState([]);

const fetchQuizScores = async () => {

  const res =
    await api.get(
      `/assignments/${id}/quiz-scores`
    );

  setQuizScores(res.data);
};

// ==============================
// FETCH ALL (SINGLE SOURCE)
// ==============================
const fetchAll = async () => {

  try {

    // =========================
    // FETCH ASSIGNMENT FIRST
    // =========================
    const assignmentRes =
      await api.get(`/assignments/${id}`);

    setAssignment(assignmentRes.data);

    const assignmentData =
      assignmentRes.data;

    // =========================
    // FETCH OTHERS
    // =========================
    await Promise.all([

      fetchSubmissions(),
      fetchReminders(),

      assignmentData.type === 'upload'
        ? fetchMySubmission()
        : Promise.resolve(),

      fetchResubmitStatus(),

      fetchQuestions(),

      role === 'student'
        ? Promise.all([
            fetchQuizSubmissionStatus(),
            fetchQuizReview()
          ])
        : Promise.resolve(),

      role === 'teacher'
        ? Promise.all([
            fetchQuizAnswers(),
            fetchQuizAnalytics(),
            fetchQuizScores()
          ])
        : Promise.resolve()
    ]);

  } catch (err) {

    console.error(
      'Fetch error:',
      err
    );
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

const fetchQuizAnswers = async () => {

  try {

    const res = await api.get(
      `/assignments/${id}/quiz-answers`
    );

    setQuizAnswers(res.data);
    setQuizLocked(res.data.length > 0);

  } catch (err) {

    console.error(err);
  }
};

const fetchQuizAnalytics =
  async () => {

  try {

    const res = await api.get(
      `/assignments/${id}/quiz-analytics`
    );

    setQuizAnalytics(res.data);

  } catch (err) {

    console.error(err);
  }
};

const fetchQuizSubmissionStatus =
  async () => {

  try {

    const res = await api.get(
      `/assignments/${id}/quiz-submission-status`
    );

    setHasSubmittedQuiz(
      res.data.submitted
    );

    if (res.data.submitted) {
      setQuizSubmitted(true);
    }

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
  if (!reason) return toast.error('Please enter reason');

  try {
    const res = await api.post(
      `/assignments/${id}/resubmit-requests`,
      { reason }
    );

    console.log("SUCCESS:", res.data);

    toast.success('Request sent');
    setReason('');

    await fetchAll(); 

  } catch (err) {
    console.log("ERROR:", err.response?.data);
    toast.error(err.response?.data?.message || 'Request failed');
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

    if (
      payload.score < 0 ||
      payload.score > 100
    ) {

      return toast.error(
        'Score must be between 0 and 100'
      );
    }

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

const handleEditQuestion = (q) => {

  setEditingQuestion(q);

  setQuestionForm({

    question_text:
      q.question_text,

    question_type:
      q.question_type,

    points:
      q.points,

    options:
      q.options?.map(
        o => o.option_text
      ) || [
        '',
        '',
        '',
        ''
      ],

    correct_index:
      q.options?.findIndex(
        o => o.is_correct
      ) || 0
  });

  setShowQuestionModal(true);
};

const handleDeleteQuestion = (
  questionId
) => {

  toast((t) => (

    <div className="
      flex flex-col gap-3
    ">

      <p className="
        text-sm font-medium
      ">
        Delete this question?
      </p>
      <p className="text-xs text-gray-500">
        This action cannot be undone
      </p>

      <div className="
        flex justify-end gap-2
      ">

        <button
          onClick={() =>
            toast.dismiss(t.id)
          }
          className="
            px-3 py-1
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
          "
        >
          Cancel
        </button>

        <button
          onClick={async () => {

            toast.dismiss(t.id);

            try {

              const res =
                await api.delete(
                  `/assignments/questions/${questionId}`
                );

              toast.success(
                res.data.message
              );

              fetchQuestions();

            } catch (err) {

              console.error(err);

              toast.error(
                err.response?.data?.message ||
                'Delete failed'
              );

            }

          }}
          className="
            px-3 py-1
            rounded-lg
            bg-red-600
            hover:bg-red-700
            text-white
          "
        >
          Delete
        </button>

      </div>

    </div>

  ));

};



      const handleSaveQuestion = async () => {

        try {
        // =========================
        // TOTAL POINT VALIDATION
        // =========================
        if (
          Number(questionForm.points) <= 0
        ) {
          return toast.error(
            'Points must be greater than 0'
          );
        }

        if (
          questionForm.question_type ===
          'single_choice'
        ) {

          const hasEmptyOption =
            questionForm.options.some(
              opt => opt.trim() === ''
            );

          if (hasEmptyOption) {

            return toast.error(
              'All options must be filled'
            );

          }

        }
        
        const currentTotal =
          questions.reduce(
            (sum, q) => {

              // exclude edited question
              if (
                editingQuestion &&
                q.id === editingQuestion.id
              ) {
                return sum;
              }

              return sum + Number(q.points);
            },
            0
          );

        const newTotal =
          currentTotal +
          Number(questionForm.points);

        if (newTotal > 100) {

          return toast.error(
            `Total quiz points cannot exceed 100 (Current: ${newTotal})`
          );
        }

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

const res = editingQuestion

  ? await api.patch(
      `/assignments/questions/${editingQuestion.id}`,
      payload
    )

  : await api.post(
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
          setEditingQuestion(null);
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
// =========================
// VALIDATE EMPTY ANSWERS
// =========================
for (const q of questions) {

  const answer = answers[q.id];

  if (
    answer === undefined ||
    answer === null ||
    answer === ''
  ) {

    return toast.error(
      'Please answer all questions'
    );
  }
}

        // =========================
        // TOTAL POINT CHECK
        // =========================
        const totalPoints =
          questions.reduce(
            (sum, q) =>
              sum + Number(q.points),
            0
          );

        if (totalPoints !== 100) {

          return toast.error(
            'Quiz total points must equal exactly 100'
          );
        }

        try {

          const payload = {
            answers
          };

          const res = await api.post(
            `/assignments/${id}/quiz-submit`,
            payload
          );

          toast.success(res.data.message);

          await fetchAll();

          setQuizSubmitted(true);

        } catch (err) {

          console.error(err);

          toast.error(
            err.response?.data?.message ||
            'Error submitting quiz'
          );
        }
      };

      const handleGradeQuizAnswer =
        async (answerId) => {

        try {

          const payload =
            quizGradeData[answerId];
          
            const answer =
            quizAnswers.find(
              q => q.answer_id === answerId
            );

          const maxPoints =
            answer?.points || 0;

          if (
            Number(payload.score) < 0 ||
            Number(payload.score) > maxPoints
          ) {

            return toast.error(
              `Score must be between 0 and ${maxPoints}`
            );
          }
          const res = await api.patch(
            `/assignments/quiz-answers/${answerId}/grade`,
            {
              score: payload?.score,
              teacher_comment:
                payload?.teacher_comment
            }
          );

          toast.success(res.data.message);

          fetchQuizAnswers();

        } catch (err) {

          console.error(err);

          toast.error(
            err.response?.data?.message ||
            'Error grading answer'
          );
        }
      };

  if (!assignment) return <Layout>Loading...</Layout>;

  const isExpired =
    new Date(assignment.due_date) < new Date();

  const totalQuizPoints =
    questions.reduce(
      (sum, q) =>
        sum + Number(q.points),
      0
    );

    const pendingRequests =
      requests.filter(
        r => r.status === 'pending'
      );


  return (
    <Layout>

    <button
      onClick={() => navigate(-1)}
      className="
        fixed
        bottom-6
        right-6
        z-50

        bg-blue-600
        hover:bg-blue-700

        text-white
        p-3

        rounded-full
        shadow-lg
        transition
      "
    >
      <ArrowLeft size={22} />
    </button>

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

          {quizLocked && (

            <p className="
              text-xs
              text-red-600
              mt-2
            ">
              Quiz structure locked because students have submitted answers
            </p>

          )}

          </div>

          <button
            disabled={quizLocked}
            onClick={() => {

              setEditingQuestion(null);

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

              setShowQuestionModal(true);

            }}

            className={`
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-4 py-2
              rounded-xl
              transition

              ${quizLocked 
                ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
                }

            `}
            
          >
            Add Question
          </button>

        </div>

      </div>
    )}

{role === 'student' &&
 !isExpired &&
 !mySubmission && (

<div
  className="
    mt-6
    border-t
    pt-5
  "
>

  {/* HEADER */}
  <div className="mb-4">

    <h3
      className="
        text-lg
        font-semibold
        text-blue-700
      "
    >
      Reminder Settings
    </h3>

    <p
      className="
        text-sm
        text-blue-500
        mt-1
      "
    >
      Stay on track with your assignment deadline
    </p>

  </div>

  {/* PRESET BUTTONS */}
  <div
    className="
      flex
      gap-3
      flex-wrap
      justify-center
    "
  >

    {[7,3,1].map(day => {

      const selected =
        reminders.includes(day);

      return (

        <button
          key={day}
          type="button"
          onClick={() => {

            if (selected) {

              setReminders(
                reminders.filter(
                  r => r !== day
                )
              );

            } else {

              setReminders([
                ...reminders,
                day
              ]);

            }

          }}

          className={`
            px-4
            py-2

            rounded-xl

            text-sm
            font-medium

            transition-all

            ${
              selected
                ? `
                  bg-blue-600
                  text-white
                `
                : `
                  bg-blue-50
                  text-blue-700
                  border
                  border-blue-200
                  hover:bg-blue-100
                `
            }
          `}
        >
          {day} Days
        </button>

      );

    })}

  </div>

  {/* CUSTOM */}
  <div
    className="
      mt-6
      flex
      flex-col
      items-center
    "
  >

    <label
      className="
        text-sm
        font-medium
        text-blue-700
        mb-2
        
      "
    >
      Custom Reminder
    </label>

    <input
      type="number"
      min="1"
      value={customDay}
      onChange={(e) =>
        setCustomDay(
          e.target.value
        )
      }
      placeholder="5"
      className="
        w-28

        text-center
        font-semibold
        bg-blue-50
        border-2
        border-blue-300
        text-blue-700
        rounded-xl
        placeholder:text-blue-200
        


        px-3
        py-2

        focus:outline-none
        focus:ring-2
        focus:ring-blue-300
      "
    />

    <span
      className="
        mt-2
        text-sm
        text-blue-500
      "
    >
      days before deadline
    </span>

  </div>

  {/* SAVE */}
  <div
    className="
      flex
      justify-center
      mt-6
    "
  >

    <button
      onClick={saveReminders}
      className="
        bg-blue-600
        hover:bg-blue-700

        text-white
        font-medium

        px-5
        py-2.5

        rounded-xl

        transition
      "
    >
      Save Reminder
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
    EDIT FORM
====================== */}
{role === 'teacher' && editMode && (

  <div className="
    bg-white
    border
    rounded-2xl
    p-5 mt-6
    space-y-4
    mb-6

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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
      "
    >
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>

    {assignment.type === 'upload' && (
    <>
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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
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
        bg-gray-50 focus:ring-2 focus:ring-blue-500
      "
    />
    </>
    )}

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
          text-gray-700
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


{/* ======================
    QUESTIONS LIST
====================== */}
{assignment.type === 'quiz' && (
  <div className="
    bg-white rounded-2xl
    shadow p-6 mb-6
  ">

    <div className="
      flex
      justify-between
      items-center
      mb-5
    ">

    <div>

      <h2 className="
        text-xl font-bold text-gray-800
      ">
        Questions
      </h2>

      <p className="
        text-sm text-gray-500
        mt-1
      ">
        {questions.length} Questions 
        {' '}
        {totalQuizPoints}/100 Points
      </p>

    </div>

    {role === 'teacher' && (

      <div className="flex gap-2">

        <button
          onClick={() =>
            setExpandedQuestions(
              questions.map(q => q.id)
            )
          }
          className="
            px-3 py-1
            text-sm
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
          "
        >
          Expand All
        </button>

        <button
          onClick={() =>
            setExpandedQuestions([])
          }
          className="
            px-3 py-1
            text-sm
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
          "
        >
          Collapse All
        </button>

      </div>

    )}

      {role === 'student' &&
      quizSubmitted &&
      quizReview && (

        <div className="
          bg-blue-50
          border border-blue-200
          rounded-xl
          px-4 py-2
        ">

          <p className="
            text-x font-medium
            text-blue-700  
          ">
            Quiz Result
          </p>

          {waitingForGrade ? (

            <>
              <p className="
                text-lg font-semibold
                text-yellow-600
              ">
                Pending Review
              </p>

              <p className="
                text-xs text-gray-500
              ">
                Some subjective questions are still being graded by the teacher
              </p>
            </>

          ) : (

            <p className="
              text-xl font-bold
              text-blue-600
            ">
              {quizReview.total_score}/100
            </p>

          )}

        </div>

      )}

    </div>

    {questions.length === 0 ? (

      <p className="text-gray-500">
        No questions added yet
      </p>

    ) : (

      <div className="space-y-5">

        
    {questions.map((q, index) => {

    const review =
      quizReview?.questions?.find(
        r => r.id === q.id
      );

    const isQuestionOpen =
      expandedQuestions.includes(q.id);

      return (

          <div
            key={q.id}
            className="
              border rounded-xl
              overflow-hidden
            "
          >
{/* HEADER */}
<div
  onClick={() => {

    if (isQuestionOpen) {

      setExpandedQuestions(
        expandedQuestions.filter(
          id => id !== q.id
        )
      );

    } else {

      setExpandedQuestions([
        ...expandedQuestions,
        q.id
      ]);

    }

  }}
  className="
    flex items-center
    justify-between
    p-5
    cursor-pointer
    hover:bg-gray-50
    transition
  "
>

    <div className="
      flex items-center
      gap-3
    ">

      {isQuestionOpen ? (
        <ChevronDown size={18}/>
      ) : (
        <ChevronRight size={18}/>
      )}

      <div>

        <h3 className="
          font-semibold
          text-gray-800
        ">
          Question {index + 1}
        </h3>

        <p className="
          text-xs
          text-gray-500
        ">
          {q.question_type === 'subjective'
            ? 'Subjective'
            : 'Single Choice'}
        </p>

      </div>

    </div>

    <div className="
      flex items-center
      gap-3
    ">

      <span className="
        bg-blue-100
        text-blue-700
        px-3 py-1
        rounded-full
        text-xs font-medium
      ">
        {q.points} pts
      </span>

      {role === 'teacher' &&
      !quizLocked && (

        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditQuestion(q);
            }}
            className="
              p-2
              rounded-lg
              hover:bg-yellow-100
              text-yellow-600
            "
          >
            <Pencil size={16}/>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteQuestion(q.id);
            }}
            className="
              p-2
              rounded-lg
              hover:bg-red-100
              text-red-600
            "
          >
            <Trash2 size={16}/>
          </button>
        </>

      )}

    </div>

</div>

{isQuestionOpen && (

  <div className="
    p-5
    border-t
  ">

{/* ======================
    STUDENT QUIZ FORM
====================== */}

{role === 'student' && !quizSubmitted && (

  <div className="mt-5">

    <p className="font-medium text-gray-700 mb-4">
      {q.question_text}
    </p>

    {q.question_type === 'subjective' && (
      <textarea
        placeholder="Write your answer..."
        value={answers[q.id] || ''}
        onChange={(e) =>
          setAnswers({
            ...answers,
            [q.id]: e.target.value
          })
        }
        className="
          border rounded-xl
          w-full p-3
          bg-gray-50 focus:ring-2 focus:ring-blue-500
        "
      />
    )}

    {q.question_type === 'single_choice' && (
      <div className="space-y-3">

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
              checked={answers[q.id] === opt.id}
              onChange={() =>
                setAnswers({
                  ...answers,
                  [q.id]: opt.id
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

)}

{role === 'student' &&
 quizSubmitted && (

  <div className="mt-5">

    <p className="font-medium text-gray-700 mb-4">
      {q.question_text}
    </p>

    <div className="
      bg-white-50
      rounded-xl
      p-4
      space-y-2
    ">

      {q.question_type === 'subjective' && ( 
      <p>
          <span className="font-medium">
            Your Answer:
          </span>{' '}
          {review?.student_answer ||
          review?.answer_text ||
          '-'}
        </p>   

      )}
      
      {q.question_type === 'single_choice' && (

        <div className="space-y-2 mt-3">

          {q.options?.map((opt) => {

            const isStudentAnswer =
              opt.option_text === review?.student_answer;

            const isCorrect =
              opt.option_text === review?.correct_answer;

            return (

              <div
                key={opt.id}
                className={`
                  border rounded-xl
                  px-4 py-3
                  flex justify-between items-center

                  ${
                    isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isStudentAnswer
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white'
                  }
                `}
              >

                <span>
                  {opt.option_text}
                </span>

              <div className="flex items-center gap-2">

                {isCorrect && (
                  <>
                    <CheckCircle
                      size={18}
                      className="text-green-600"
                    />
                    <span className="text-green-700 text-sm font-medium">
                      Correct
                    </span>
                  </>
                )}

                {!isCorrect &&
                isStudentAnswer && (
                  <>
                    <XCircle
                      size={18}
                      className="text-red-600"
                    />
                    <span className="text-red-700 text-sm font-medium">
                      Your Answer
                    </span>
                  </>
                )}

              </div>

              </div>

            );

          })}

        </div>

      )}

      {review?.teacher_comment && (

        <p>
          <span className="font-medium">
            Feedback:
          </span>{' '}
          {review?.teacher_comment}
        </p>

      )}

    </div>

  </div>

)}

{/* ======================
    TEACHER VIEW
====================== */}
{role === 'teacher' && (

  <>

    {/* QUESTION TEXT */}
    <p className="
      font-medium
      text-gray-700
      mt-4 mb-4
    ">
      {q.question_text}
    </p>

    {/* TYPE */}
    <p className="
      text-sm text-gray-500
      capitalize
    ">
      {q.question_type.replace('_',' ')}
    </p>

    {/* OPTIONS */}
    {q.question_type === 'single_choice' && (

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
          <div className="flex items-center justify-between">

            <span>
              {opt.option_text}
            </span>

            {opt.is_correct && (
              <CheckCircle
                size={18}
                className="text-green-600"
              />
            )}

          </div>
        </div>

        ))}

      </div>

    )}

  </>

)}
           
      </div>

    )}
          </div>
        );})}



        {/* ======================
            STUDENT SUBMIT
        ====================== */}
        {role === 'student' &&
         !quizSubmitted && (
        <button
          disabled={isExpired}

          onClick={handleSubmitQuiz}

          className={`
            px-6 py-3
            rounded-xl
            text-white
            transition

            ${
              isExpired
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isExpired
            ? 'Deadline Passed'
            : 'Submit Quiz'}
        </button>
        )}

      </div>
    )}

  </div>
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
            bg-gray-50 focus:ring-2 focus:ring-blue-500
            text-sm mb-3
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

      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col">

        <h3 className="font-semibold mb-3 flex items-center gap-2 text-center">
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

    {assignment.type === 'upload' && (
      <>
      {/* ======================
          SUBMISSIONS TABLE
      ====================== */}
      <div>
        <div className="p-4 border-b font-semibold">
        
        </div>
      
      

         {/* ======================
              RESUBMIT REQUESTS (TEACHER)
          ====================== */}
          {role === 'teacher' &&
          pendingRequests.length > 0 && (

            <div className="bg-white rounded-xl shadow mt-6">

              <div className="p-4 border-b font-semibold text-gray-700 bg-gray-50">
                Resubmit Requests
              </div>

              <table className="w-full text-sm">

                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-center font-semibold text-black">
                      Student
                    </th>

                    <th className="p-4 text-center font-semibold text-black">
                      Reason
                    </th>

                    <th className="p-4 text-center font-semibold text-black">
                      Status
                    </th>

                    <th className="p-4 text-center font-semibold text-black">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {pendingRequests.map((r) => (
                    <tr key={r.id} className="border-t">

                      <td className="p-3">
                        {r.student_name}
                      </td>

                      <td className="p-3">
                        {r.reason}
                      </td>

                      <td className="p-3">
                        {r.status}
                      </td>

                      <td className="p-3 text-center space-x-2">

                        <button
                          onClick={() =>
                            handleUpdateRequest(
                              r.id,
                              'approved'
                            )
                          }
                          className="
                            bg-green-500
                            text-white
                            px-2 py-1
                            rounded
                          "
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleUpdateRequest(
                              r.id,
                              'rejected'
                            )
                          }
                          className="
                            bg-red-500
                            text-white
                            px-2 py-1
                            rounded
                          "
                        >
                          Reject
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

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
    <th className="p-4 text-left font-semibold">Student</th>

    <th className="p-4 text-left  font-semibold">
      File
    </th>

    <th className="p-4 text-left font-semibold">
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
          bg-gray-50
          text-center
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
          bg-gray-50
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
    </>
  )}


{/* ======================
    QUIZ ANSWERS
====================== */}
{role === 'teacher' &&
 assignment.type === 'quiz' && (
<>


{/* STUDENT QUIZ ANSWERS */}
{quizAnswers.length > 0 && (

  <div
    className="
      bg-white rounded-2xl
      shadow p-6 mb-6
    "
  >

    <h2 className="text-xl font-bold mb-4 text-gray-800">
      Student Quiz Answers
    </h2>

    <div className="space-y-5">

{Object.entries(groupedQuizAnswers).map(
  ([studentName, answers]) => {

    const studentScore =
      quizScores.find(
        s => s.name === studentName
      );

    const pendingCount =
      answers.filter(
        a =>
          a.question_type === 'subjective' &&
          a.score == null
      ).length;

    const isOpen =
      expandedStudent === studentName;

return (

  <div
    key={studentName}
    className="
      border rounded-xl
      overflow-hidden
    "
  >

    <div
      onClick={() =>
        setExpandedStudent(
          isOpen
            ? null
            : studentName
        )
      }
      className="
        flex items-center
        justify-between
        p-4
        bg-gray-50
        cursor-pointer
        hover:bg-gray-100
        transition
      "
    >

      <div>

        <h3 className="
          font-semibold
          text-gray-800
        ">
          {studentName}
        </h3>

        <p className="
          text-sm
          text-gray-500
        ">
        {answers.filter(
          a => a.question_type === 'subjective'
        ).length} Subjective Questions
        </p>

      </div>

      <div className="
        flex items-center
        gap-3
      ">

        {pendingCount > 0 && (
          <span
            className="
              bg-yellow-100
              text-yellow-700
              px-3 py-1
              rounded-full
              text-sm
              font-medium
            "
          >
            <Clock3 size={14}/>
            {pendingCount} Pending
          </span>
        )}

        <span
          className="
            bg-blue-100
            text-blue-700
            px-3 py-1
            rounded-full
            text-sm
            font-medium
          "
        >
          {Math.round(
            studentScore?.total_score || 0
          )}/100
        </span>

      </div>

    </div>

    {isOpen && (

      <div className="
        p-5
        space-y-5
      ">

      {answers
        .filter(
          a => a.question_type === 'subjective'
        )
        .map((a, index) => (

        <div
          key={a.answer_id}
          className="
            border rounded-xl
            p-5
          "
        >

          {/* STUDENT */}
          <div className="
            flex items-center
            justify-between
            mb-3
          ">

            <div>

              <h3 className="
                font-semibold
                text-gray-800
              ">
                Question {index + 1}
              </h3>

              <p className="
                text-sm text-gray-500
              ">
                {a.question_type.replace(
                  '_',
                  ' '
                )}
              </p>

            </div>

            <span className="
              bg-blue-100
              text-blue-700
              px-3 py-1
              rounded-full
              text-xs font-medium
            ">
              {a.points} pts
            </span>

          </div>

          {/* QUESTION */}
          <p className="
            font-medium
            text-gray-700
            mb-4
          ">
            {a.question_text}
          </p>

          {/* SUBJECTIVE */}
          {a.question_type ===
            'subjective' && (

            <div className="
              bg-gray-50
              border rounded-xl
              p-4
            ">
              {a.answer_text || '-'}
            </div>
          )}

          {/* SINGLE CHOICE */}
          {a.question_type ===
            'single_choice' && (

            <div className="
              space-y-2
            ">

              <div className="
                bg-blue-50
                border border-blue-200
                rounded-xl
                p-3
              ">
                <span className="
                  text-sm text-gray-500
                ">
                  Student Answer:
                </span>

                <p className="
                  font-medium text-blue-700
                ">
                  {a.option_text || '-'}
                </p>

              </div>

              <div className="
                bg-green-50
                border border-green-200
                rounded-xl
                p-3
              ">
                <span className="
                  text-sm text-gray-500
                ">
                  Correct Answer:
                </span>

                <p className="
                  font-medium text-green-700
                ">
                  {a.correct_answer || '-'}
                </p>

              </div>

            </div>
          )}

          {a.question_type === 'subjective' && (

            <div>
              <div className="
                mt-5
                border-t pt-5
              ">

                <input
                  type="number"
                  min="0"
                  max={a.points}
                  value={
                    quizGradeData[a.answer_id]?.score ??
                    a.score ??
                    ''
                  }
                  placeholder={`0 - ${a.points}`}
                  onChange={(e) =>
                    setQuizGradeData({
                      ...quizGradeData,

                      [a.answer_id]: {
                        ...quizGradeData[a.answer_id],

                        score: e.target.value
                      }
                    })
                  }
                  className="
                    border rounded-xl
                    px-4 py-3
                    w-full mb-3
                    bg-gray-50
                  "
                />

                <textarea
                  placeholder="Write feedback..."
                  value={
                    quizGradeData[a.answer_id]
                      ?.teacher_comment ??
                    a.teacher_comment ??
                    ''
                  }
                  onChange={(e) =>
                    setQuizGradeData({
                      ...quizGradeData,

                      [a.answer_id]: {
                        ...quizGradeData[a.answer_id],

                        teacher_comment:
                          e.target.value
                      }
                    })
                  }
                  className="
                    border rounded-xl
                    w-full p-3 mb-3
                    bg-gray-50
                  "
                />

                <button
                  onClick={() =>
                    handleGradeQuizAnswer(
                      a.answer_id
                    )
                  }
                  className="
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    px-5 py-2
                    rounded-xl
                  "
                >
                {a.score != null
                    ? 'Update Grade'
                    : 'Save Grade'}
                </button>

              </div>
            </div>

          )}
        </div>
        ))}

      </div>

    )}

  </div>

);

}
)}
</div>
</div>

)}
  </>
)}


{/* ======================
    QUIZ ANALYTICS
====================== */}
{role === 'teacher' &&
 assignment.type === 'quiz' && (

  <div className="
    bg-white rounded-2xl
    shadow p-6 mb-6
  ">

    <div className="
      flex items-center
      justify-between
      mb-5
    ">

      <h2 className="
        text-xl font-bold
        text-gray-800
      ">
        Quiz Analytics
      </h2>

      <div className="flex gap-2">

        <button
          onClick={() =>
            setExpandedAnalytics(
              quizAnalytics.map(
                q => q.question_id
              )
            )
          }
          className="
            px-3 py-1
            text-sm
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
          "
        >
          Expand All
        </button>

        <button
          onClick={() =>
            setExpandedAnalytics([])
          }
          className="
            px-3 py-1
            text-sm
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
          "
        >
          Collapse All
        </button>

      </div>

    </div>

    {quizAnalytics.length === 0 ? (

      <p className="text-gray-500">
        No analytics available
      </p>

    ) : (

      <div className="space-y-6">

      {[...quizAnalytics]
        .sort((a, b) => a.question_id - b.question_id)
        .map((q, index) => {

        const isAnalyticsOpen =
          expandedAnalytics.includes(
            q.question_id
          );

        return (

          <div
            key={q.question_id}
            className="
              border rounded-xl
              overflow-hidden
            "
          >

            {/* QUESTION */}
            
            <div
              onClick={() => {

                if (isAnalyticsOpen) {

                  setExpandedAnalytics(
                    expandedAnalytics.filter(
                      id => id !== q.question_id
                    )
                  );

                } else {

                  setExpandedAnalytics([
                    ...expandedAnalytics,
                    q.question_id
                  ]);

                }

              }}
              className="
                flex items-center
                justify-between
                p-5
                cursor-pointer
                hover:bg-gray-50
              "
            >

              <div className="
                flex items-center
                gap-3
              ">

                {isAnalyticsOpen ? (
                  <ChevronDown size={18}/>
                ) : (
                  <ChevronRight size={18}/>
                )}

              <div>

                <h3 className="
                  font-semibold
                  text-gray-800
                ">
                  Question {index + 1}
                </h3>



                <p className="
                  text-xs
                  text-gray-500
                  mt-1
                ">
                  {q.question_type === 'subjective'
                    ? 'Subjective'
                    : 'Single Choice'}
                </p>

              </div>

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

            {/* OPTIONS */}
            {isAnalyticsOpen && (

            <div className="
              p-5
              border-t
            ">

            <p className="
              font-medium
              text-gray-800
              mb-4
            ">
              {q.question_text}
            </p>
            
            <div className="space-y-4">

              {q.question_type === 'single_choice' ? (

                q.options?.map((opt) => (

                  <div
                    key={opt.id}
                    className="
                      border rounded-xl
                      p-4
                    "
                  >

                    <div
                      className="
                        flex items-center
                        justify-between
                        mb-3
                      "
                    >

                      <div>

            <p
              className={`
                font-medium
                flex items-center gap-2
                ${
                  opt.is_correct
                    ? 'text-green-700'
                    : 'text-gray-700'
                }
              `}
            >
              {opt.option_text}

            {opt.is_correct && (
              <span
                className="
                  bg-green-100
                  text-green-700
                  px-2 py-0.5
                  rounded-full
                  flex items-center
                  gap-1
                  text-xs
                "
              >
                <CheckCircle size={12} />
                Correct
              </span>
            )}
            </p>

                      </div>

                      <span
                        className="
                          bg-blue-100
                          text-blue-700
                          px-3 py-1
                          rounded-full
                          text-sm font-medium
                        "
                      >
                        {opt.selection_rate}%
                      </span>

                    </div>

                    <div
                      className="
                        flex flex-wrap
                        gap-2
                      "
                    >

                      {opt.students?.length ? (

                        opt.students.map(
                          (student, index) => (

                            <span
                              key={index}
                              className="
                                bg-gray-100
                                text-gray-700
                                px-3 py-1
                                rounded-full
                                text-xs
                              "
                            >
                              {student}
                            </span>

                          )
                        )

                      ) : (

                        <span
                          className="
                            text-sm
                            text-gray-400
                          "
                        >
                          No students selected
                        </span>

                      )}

                    </div>

                  </div>

                ))

              ) : (
                
                    <div
                      className="
                        bg-blue-50
                        border
                        border-blue-200
                        rounded-xl
                        p-4
                      "
                    >
                  

                  <div className="grid grid-cols-2 gap-4">
                    

                    <div>
                      <p className="text-sm text-gray-500">
                        Total Answers
                      </p>

                      <p className="text-xl font-bold text-blue-700">
                        {q.total_answers}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Average Score
                      </p>

                      <p className="text-xl font-bold text-green-700">
                        {q.average_score ?? 0}
                      </p>
                    </div>

                  </div>

                </div>
                

                

              )}

            </div>

          </div>
            )}

          </div>

        );

      })}

      </div>
    )}

  </div>
)}

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
              {editingQuestion
                  ? 'Edit Question'
                  : 'Add Question'}
              </h2>

              <button
                onClick={() => {

                  setShowQuestionModal(false);

                  setEditingQuestion(null);

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

                }}

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
                bg-gray-50 focus:ring-2 focus:ring-blue-500
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
                bg-gray-50 focus:ring-2 focus:ring-blue-500
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
                bg-gray-50 focus:ring-2 focus:ring-blue-500
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
                        bg-gray-50 focus:ring-2 focus:ring-blue-500
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
                onClick={() => {

                  setShowQuestionModal(false);

                  setEditingQuestion(null);

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

                }}

                className="
                  bg-gray-50
                  hover:bg-gray-200
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
              {editingQuestion
                ? 'Update Question'
                : 'Save Question'}
              </button>

            </div>

          </div>

        </div>
      )}
    </Layout>
  );
}
