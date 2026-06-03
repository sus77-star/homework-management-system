import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ClassesPage() {

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const [editingClass, setEditingClass] = useState(null);

  const [form, setForm] = useState({
    code: '',
    name: ''
  });

  // ==============================
  // FETCH
  // ==============================
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/classes?status=${statusFilter}`);
      setClasses(res.data);
    } catch (err) {
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [statusFilter]);

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
  const filteredClasses = classes
    .filter((c) => {
      const matchSearch =
        `${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === '' ||
        (statusFilter === 'active' && c.is_active) ||
        (statusFilter === 'inactive' && !c.is_active);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;

      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

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

  const totalPages = Math.ceil(filteredClasses.length / perPage);

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // ==============================
  // CREATE
  // ==============================
  const handleCreate = async () => {
    await api.post('/classes', form);
    setForm({ code: '', name: '' });
    fetchClasses();
  };

  // ==============================
  // TOGGLE STATUS (SAMA KAYAK USERS)
  // ==============================
  const handleToggle = async (id, current) => {
    try {
      await api.patch(`/classes/${id}/status`, {
        is_active: !current
      });

      fetchClasses();
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  return (
    <Layout>

      {/* CREATE */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-3 text-gray-800">Create Class</h2>

        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white rounded px-4"
          >
            Create
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-1/3 bg-white focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th onClick={() => handleSort('code')} className="p-3 cursor-pointer">
                Code {renderSortIcon('code')}
              </th>

              <th onClick={() => handleSort('name')} className="p-3 cursor-pointer">
                Name {renderSortIcon('name')}
              </th>

              <th onClick={() => handleSort('is_active')} className="p-3 cursor-pointer">
                Status {renderSortIcon('is_active')}
              </th>

              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td className="p-4">Loading...</td></tr>
            ) : paginatedClasses.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-semibold">{c.code}</td>
                <td className="p-3">{c.name}</td>

                <td className="p-3">
                  <button
                    onClick={() => handleToggle(c.id, c.is_active)}
                    className={`px-2 py-1 rounded text-sm ${
                      c.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => setEditingClass(c)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                onClick={async () => {
                    if (!confirm('Delete this class?')) return;
                    await api.delete(`/classes/${c.id}`);
                    fetchClasses();
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>

                </td>
              </tr>
            ))}
            {!loading && filteredClasses.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-gray-500">No classes found</td>
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

      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">

            <h2 className="font-semibold mb-4 text-black">Edit Class</h2>

            <input
              value={editingClass.code}
              onChange={(e) =>
                setEditingClass({ ...editingClass, code: e.target.value })
              }
              className="border p-2 w-full mb-2 rounded bg-white"
              placeholder="Code"
            />

            <input
              value={editingClass.name}
              onChange={(e) =>
                setEditingClass({ ...editingClass, name: e.target.value })
              }
              className="border p-2 w-full mb-4 rounded bg-white"
              placeholder="Name"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingClass(null)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await api.put(`/classes/${editingClass.id}`, editingClass);
                  setEditingClass(null);
                  fetchClasses();
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
      
    </Layout>
  );
}