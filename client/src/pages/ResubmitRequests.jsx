import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function ResubmitRequests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const res = await api.get('/assignments/resubmit-requests');
    setRequests(res.data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, status) => {
    await api.patch(`/assignments/resubmit-requests/${id}`, {
      status
    });

    fetchRequests();
  };

  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-4">
        Resubmit Requests
      </h2>

      {requests.length === 0 ? (
        <p>No requests</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Assignment</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.student_name}</td>
                <td className="p-3">{r.assignment_title}</td>
                <td className="p-3">{r.reason}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => handleAction(r.id, 'approved')}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleAction(r.id, 'rejected')}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}