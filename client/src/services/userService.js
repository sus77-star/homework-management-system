export const getUsers = async () => {
  const res = await fetch('http://localhost:3000/api/users');
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return res.json();
};