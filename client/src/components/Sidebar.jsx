import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Home,
  Users,
  Book,
  FileText,
  Upload,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ==============================
  // SAFE ROLE DETECTION
  // ==============================
  let role = '';

  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      role = decoded.role;
    }
  } catch (err) {
    console.log('Invalid token');
  }

  // ==============================
  // ROLE BASED MENU (FINAL)
  // ==============================
  let menus = [];

  // ==============================
  // ADMIN
  // ==============================
  if (role === 'admin') {
    menus = [
      { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
      { name: 'Users', path: '/users', icon: <Users size={18} /> },
      { name: 'Courses', path: '/courses', icon: <Book size={18} /> },
      { name: 'Classes', path: '/classes', icon: <GraduationCap size={18} /> },
      { name: 'Login Records', path: '/login-records', icon: <FileText size={18} /> },
    ];
  }

  // ==============================
  // TEACHER
  // ==============================
  else if (role === 'teacher') {
    menus = [
      { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
      { name: 'Courses', path: '/courses', icon: <Book size={18} /> },
      { name: 'Assignments', path: '/assignments', icon: <FileText size={18} /> },
      { name: 'Submissions', path: '/submissions', icon: <Upload size={18} /> },
      { name: 'Grades', path: '/grades', icon: <Trophy size={18} /> },
    ];
  }

  // ==============================
  // STUDENT
  // ==============================
  else if (role === 'student') {
    menus = [
      { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
      { name: 'Courses', path: '/courses', icon: <Book size={18} /> },
      { name: 'Assignments', path: '/assignments', icon: <FileText size={18} /> },
      { name: 'Submissions', path: '/submissions', icon: <Upload size={18} /> },
      { name: "Grades", path: '/grades', icon: <Trophy size={18} />}
    ];
  }

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } h-screen bg-gray-900 text-white p-5 transition-all duration-300 relative`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-white text-gray-800 shadow rounded-full w-7 h-7 flex items-center justify-center hover:scale-105 transition"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* TITLE */}
      {!collapsed && (
        <h2 className="text-xl font-semibold mb-8">
          HMS
        </h2>
      )}

      {/* MENU */}
      <nav className="flex flex-col gap-2">
        {menus.map((menu) => {
          const isActive = location.pathname.startsWith(menu.path);

          return (
            <Link
              to={menu.path}
              key={menu.name}
              className={`p-2 rounded flex items-center gap-3 transition ${
                isActive
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              {menu.icon}
              {!collapsed && <span>{menu.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}