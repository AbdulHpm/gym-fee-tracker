import React, { useState, useEffect, useRef } from "react";
import Login from "./Login";
import logo from "./assets/maxfit-logo.png";
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


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
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loggedIn, setLoggedIn] = useState(() => {
    // Check localStorage for login state
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 15;
  const formRef = useRef(null);

  // Login handler
  const handleLogin = (username, password) => {
    if (username === "khurram" && password === "4466#") {
      setLoggedIn(true);
      setLoginError("");
      localStorage.setItem("isLoggedIn", "true");
    } else {
      setLoginError("Invalid username or password");
    }
  };
 
  // Logout handler
  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  // Fetch users from backend
  const fetchUsers = () => {
    setLoading(true);
    const url = search
      ? `https://gym-fee-tracker.onrender.com/users?search=${encodeURIComponent(search)}`
      : "https://gym-fee-tracker.onrender.com/users";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loggedIn) fetchUsers();
    // eslint-disable-next-line
  }, [search, loggedIn]);

  // When users or search changes, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle phone input to allow only digits
  const handlePhoneInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    handleChange(e);
  };

  // Show alert
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 2500);
  };

  // Handle form submission (add or edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    // Duplicate check (case-insensitive, trimmed)
    const newName = form.name.trim().toLowerCase();
    const newPhone = form.phone.trim();
    // Phone number validation
    if (!/^[0-9]+$/.test(newPhone)) {
      showAlert("Phone number must contain only digits!", "danger");
      return;
    }
    const isDuplicate = users.some(u =>
      u.name.trim().toLowerCase() === newName &&
      u.phone.trim() === newPhone &&
      (!editingId || u.id !== editingId)
    );
    if (isDuplicate) {
      showAlert("A user with the same name and phone number already exists!", "danger");
      return;
    }
    if (editingId) {
      // Edit user
      fetch(`https://gym-fee-tracker.onrender.com/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.error) {
            showAlert(res.error, "danger");
          } else {
            showAlert("User updated successfully!");
            setForm({ name: "", phone: "", fee_start_date: "", fee_due_date: "" });
            setEditingId(null);
            fetchUsers();
          }
        });
    } else {
      // Add user
      fetch("https://gym-fee-tracker.onrender.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.error) {
            showAlert(res.error, "danger");
          } else {
            showAlert("User added successfully!");
            setForm({ name: "", phone: "", fee_start_date: "", fee_due_date: "" });
            fetchUsers();
          }
        });
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`https://gym-fee-tracker.onrender.com/users/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => {
          showAlert("User deleted!", "warning");
          fetchUsers();
        });
    }
  };

  // Handle edit
  const handleEdit = (user) => {
    // Format dates as yyyy-MM-dd for input type="date"
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    };
    setForm({
      name: user.name,
      phone: user.phone,
      fee_start_date: formatDate(user.fee_start_date),
      fee_due_date: formatDate(user.fee_due_date),
    });
    setEditingId(user.id);
    // Scroll to form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Dismiss alert handler
  const handleDismissAlert = () => setAlert({ show: false, message: "", type: "" });

  // Pagination logic
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  if (!loggedIn) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  // Logout button at top right of page
  const logoutButton = (
    <button
      className="btn btn-outline-danger"
      style={{ position: 'fixed', top: '24px', right: '40px', zIndex: 9999 }}
      onClick={handleLogout}
    >
      Logout
    </button>
  );

  return (
    <>
      {logoutButton}
      <div className="container my-5">
        {/* Header */}
        <div className="mb-4 d-flex flex-column align-items-center justify-content-center">
          <img src={logo} alt="MAX FIT Logo" className="header-logo" />
          <h1 className="maxfit-title mb-1">
            MAX FIT
          </h1>
          <p className="text-secondary mb-0" style={{ textAlign: 'center' }}>
            Track your gym members' fees with ease!
          </p>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
            <span className="me-2">
              {alert.type === 'success' && <i className="bi bi-check-circle-fill"></i>}
              {alert.type === 'danger' && <i className="bi bi-exclamation-triangle-fill"></i>}
              {alert.type === 'warning' && <i className="bi bi-exclamation-circle-fill"></i>}
            </span>
            {alert.message}
            <button type="button" className="btn-close ms-auto" aria-label="Close" onClick={handleDismissAlert}></button>
          </div>
        )}

        {/* Search */}
        <div className="row justify-content-center mb-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or phone"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center" ref={formRef}>
          <div className="col-lg-10">
            <div className="card shadow mb-4 position-relative">
              <div className="card-body">
                <form onSubmit={handleSubmit} className="row g-3 align-items-end">
                  <div className="col-md-3 form-floating">
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      id="floatingName"
                      placeholder="User Name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="floatingName">User Name</label>
                  </div>
                  <div className="col-md-2 form-floating">
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      id="floatingPhone"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      onInput={handlePhoneInput}
                      required
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                    <label htmlFor="floatingPhone">Phone Number</label>
                  </div>
                  <div className="col-md-2 form-floating">
                    <input
                      type="date"
                      name="fee_start_date"
                      className="form-control"
                      id="floatingStartDate"
                      placeholder="Start Date"
                      value={form.fee_start_date}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="floatingStartDate">Start Date</label>
                  </div>
                  <div className="col-md-2 form-floating">
                    <input
                      type="date"
                      name="fee_due_date"
                      className="form-control"
                      id="floatingDueDate"
                      placeholder="Due Date"
                      value={form.fee_due_date}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="floatingDueDate">Due Date</label>
                  </div>
                  <div className="col-md-3 d-flex align-items-end gap-2">
                    <button type="submit" className="btn btn-primary w-100">
                      {editingId ? <><i className="bi bi-pencil-square me-1"></i>Update User</> : <><i className="bi bi-plus-circle me-1"></i>Add User</>}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Fee Start Date</th>
                        <th>Fee Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={isOverdue(u.fee_due_date) ? "table-danger" : ""}
                        >
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>
                            {u.fee_start_date
                              ? new Date(u.fee_start_date).toLocaleDateString()
                              : ""}
                          </td>
                          <td>
                            {u.fee_due_date
                              ? new Date(u.fee_due_date).toLocaleDateString()
                              : ""}
                          </td>
                          <td>
                            {isOverdue(u.fee_due_date) ? (
                              <span className="badge bg-danger">Overdue</span>
                            ) : (
                              <span className="badge bg-success">Active</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit(u)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(u.id)}
                            >
                              <i className="bi bi-trash me-1"></i>Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedUsers.length === 0 && !loading && (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <nav className="mt-3 d-flex justify-content-center">
                      <ul className="pagination">
                        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prev</button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <li key={i + 1} className={`page-item${currentPage === i + 1 ? ' active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next &raquo;</button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer>
          &copy; {new Date().getFullYear()} MAX FIT Gym. All rights reserved.
        </footer>
      </div>
    </>
  );
}
export default App; 