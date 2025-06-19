import React, { useState, useEffect } from "react";

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    fee_start_date: "",
    fee_due_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // Fetch users from backend
  const fetchUsers = () => {
    const url = search
      ? `https://gym-fee-tracker.onrender.com/users?search=${encodeURIComponent(search)}`
      : "https://gym-fee-tracker.onrender.com/users";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search]);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission (add or edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      // Edit user
      fetch(`https://gym-fee-tracker.onrender.com/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then(() => {
          setForm({ name: "", phone: "", fee_start_date: "", fee_due_date: "" });
          setEditingId(null);
          fetchUsers();
        });
    } else {
      // Add user
      fetch("https://gym-fee-tracker.onrender.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then(() => {
          setForm({ name: "", phone: "", fee_start_date: "", fee_due_date: "" });
          fetchUsers();
        });
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`https://gym-fee-tracker.onrender.com/users/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => fetchUsers());
    }
  };

  // Handle edit
  const handleEdit = (user) => {
    setForm({
      name: user.name,
      phone: user.phone,
      fee_start_date: user.fee_start_date,
      fee_due_date: user.fee_due_date,
    });
    setEditingId(user.id);
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setForm({ name: "", phone: "", fee_start_date: "", fee_due_date: "" });
    setEditingId(null);
  };

  // Helper: check if user is overdue
  const isOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today.setHours(0, 0, 0, 0);
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4 text-center">Gym Fee Tracker</h1>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or phone"
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-2 align-items-end">
            <div className="col-md-3">
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="User Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="phone"
                className="form-control"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                name="fee_start_date"
                className="form-control"
                value={form.fee_start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                name="fee_due_date"
                className="form-control"
                value={form.fee_due_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">
                {editingId ? "Update User" : "Add User"}
              </button>
            </div>
            {editingId && (
              <div className="col-md-1">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Fee Start Date</th>
              <th>Fee Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={isOverdue(u.fee_due_date) ? "table-danger" : ""}
              >
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{u.fee_start_date}</td>
                <td>{u.fee_due_date}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEdit(u)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;