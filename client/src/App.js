import React, { useState, useEffect, useRef } from "react";
import Login from "./Login";
import logo from "./assets/maxfit-logo.png";
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Grid, Card, CardContent, Typography, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import CountUp from 'react-countup';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const isOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  return due < today.setHours(0, 0, 0, 0);
};

// Extracted blue from MAX FIT title (e.g., #1976d2 or your actual blue)
const maxFitBlue = '#1976d2'; // Change this if your title uses a different blue

function getTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: maxFitBlue,
      },
      background: {
        default: mode === 'dark' ? '#181c20' : '#f4f6fa',
        paper: mode === 'dark' ? '#23272f' : '#fff',
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
  });
}

function Dashboard({ users }) {
  const theme = useTheme();
  const total = users.length;
  const active = users.filter(u => !isOverdue(u.fee_due_date)).length;
  const overdue = users.filter(u => isOverdue(u.fee_due_date)).length;

  const cards = [
    {
      label: 'Total Members',
      value: total,
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Active',
      value: active,
      icon: <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <WarningIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }} justifyContent="center" textAlign="center">
      {cards.map((card, idx) => (
        <Grid item xs={12} sm={6} md={4} key={card.label} display="flex" justifyContent="center">
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: theme.palette.background.paper,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
              p: 2,
              minWidth: 220,
              maxWidth: 260,
              mx: 'auto',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)',
                transform: 'scale(1.04)',
              },
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box>{card.icon}</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                  {card.label}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: card.color }}>
                  <CountUp end={card.value} duration={1} />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function App() {
  const [users, setUsers] = useState([]);
  const [themeMode, setThemeMode] = useState('light');
  const theme = getTheme(themeMode);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    fee_start_date: "",
    fee_due_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [loggedIn, setLoggedIn] = useState(() => {
    // Check localStorage for login state
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 15;
  const formRef = useRef(null);
  const [tab, setTab] = useState(0);

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
  const handleDismissAlert = () => setAlert({ ...alert, show: false });

  // Pagination logic
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  if (!loggedIn) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  // Logout button at top right of page
  const logoutButton = (
    <Button
      variant="outlined"
      color="error"
      style={{ position: 'fixed', top: '24px', right: '40px', zIndex: 9999 }}
      onClick={handleLogout}
    >
      Logout
    </Button>
  );

  return (
    <ThemeProvider theme={theme}>
      {logoutButton}
      <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
        {/* Responsive Sidebar */}
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setDrawerOpen(true)}
              sx={{ position: 'fixed', top: 24, left: 24, zIndex: 1301 }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: 200, bgcolor: theme.palette.primary.main, pt: 8 } }}
            >
              <Tabs
                orientation="vertical"
                value={tab}
                onChange={(e, v) => { setTab(v); setDrawerOpen(false); }}
                TabIndicatorProps={{ style: { background: '#fff', width: 4, left: 0 } }}
                sx={{ minHeight: '100vh' }}
              >
                <Tab icon={<DashboardIcon sx={{ color: '#fff', mr: 1 }} />} iconPosition="start" label="Dashboard" sx={{ color: '#fff', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pl: 0, fontWeight: tab === 0 ? 700 : 400, background: tab === 0 ? 'rgba(255,255,255,0.08)' : 'transparent', '&.Mui-selected': { color: '#fff' } }} />
                <Tab icon={<GroupIcon sx={{ color: '#fff', mr: 1 }} />} iconPosition="start" label="Members" sx={{ color: '#fff', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pl: 0, fontWeight: tab === 1 ? 700 : 400, background: tab === 1 ? 'rgba(255,255,255,0.08)' : 'transparent', '&.Mui-selected': { color: '#fff' } }} />
              </Tabs>
            </Drawer>
          </>
        ) : (
          <Box sx={{ width: 200, bgcolor: theme.palette.primary.main, borderRight: 0, pt: 8, minHeight: '100vh' }}>
            <Tabs
              orientation="vertical"
              value={tab}
              onChange={(e, v) => setTab(v)}
              TabIndicatorProps={{ style: { background: '#fff', width: 4, left: 0 } }}
              sx={{ minHeight: '100vh' }}
            >
              <Tab icon={<DashboardIcon sx={{ color: '#fff', mr: 1 }} />} iconPosition="start" label="Dashboard" sx={{ color: '#fff', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pl: 0, fontWeight: tab === 0 ? 700 : 400, background: tab === 0 ? 'rgba(255,255,255,0.08)' : 'transparent', '&.Mui-selected': { color: '#fff' } }} />
              <Tab icon={<GroupIcon sx={{ color: '#fff', mr: 1 }} />} iconPosition="start" label="Members" sx={{ color: '#fff', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pl: 0, fontWeight: tab === 1 ? 700 : 400, background: tab === 1 ? 'rgba(255,255,255,0.08)' : 'transparent', '&.Mui-selected': { color: '#fff' } }} />
            </Tabs>
          </Box>
        )}
        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: 4, background: theme.palette.background.default, minHeight: '100vh' }}>
          <div className="container my-5">
            {/* Header */}
            <div className="mb-4 d-flex flex-column align-items-center justify-content-center position-relative">
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={themeMode === 'dark'}
                      onChange={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                      color="primary"
                    />
                  }
                  label={themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  sx={{ color: theme.palette.text.primary }}
                />
              </div>
              <img src={logo} alt="MAX FIT Logo" className="header-logo" />
              <h1 className="maxfit-title mb-1">
                MAX FIT
              </h1>
              <p className="text-secondary mb-0" style={{ textAlign: 'center' }}>
                Track your gym members' fees with ease!
              </p>
            </div>
            {/* Snackbar Alert */}
            <Snackbar
              open={alert.show}
              autoHideDuration={2500}
              onClose={handleDismissAlert}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <MuiAlert
                onClose={handleDismissAlert}
                severity={alert.type === 'danger' ? 'error' : alert.type}
                elevation={6}
                variant="filled"
                sx={{ width: '100%' }}
              >
                {alert.message}
              </MuiAlert>
            </Snackbar>
            {/* Dashboard Tab */}
            {tab === 0 && <Dashboard users={users} />}
            {/* Members Tab */}
            {tab === 1 && <>
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
              <div ref={formRef} style={{ marginBottom: 32 }}>
                <Card elevation={3} sx={{ borderRadius: 3, background: theme.palette.background.paper }}>
                  <CardContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <form onSubmit={handleSubmit} autoComplete="off">
                        <Grid container spacing={2} alignItems="end">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              label="User Name"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              required
                              fullWidth
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              label="Phone Number"
                              name="phone"
                              value={form.phone}
                              onChange={handleChange}
                              onInput={handlePhoneInput}
                              required
                              fullWidth
                              variant="outlined"
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <DatePicker
                              label="Start Date"
                              value={form.fee_start_date ? new Date(form.fee_start_date) : null}
                              onChange={date => setForm({ ...form, fee_start_date: date ? date.toISOString().slice(0, 10) : '' })}
                              slotProps={{ textField: { fullWidth: true, required: true, variant: 'outlined' } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <DatePicker
                              label="Due Date"
                              value={form.fee_due_date ? new Date(form.fee_due_date) : null}
                              onChange={date => setForm({ ...form, fee_due_date: date ? date.toISOString().slice(0, 10) : '' })}
                              slotProps={{ textField: { fullWidth: true, required: true, variant: 'outlined' } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3} container spacing={1} alignItems="end">
                            <Grid item xs={editingId ? 6 : 12}>
                              <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                startIcon={editingId ? <i className="bi bi-pencil-square"></i> : <i className="bi bi-plus-circle"></i>}
                              >
                                {editingId ? "Update User" : "Add User"}
                              </Button>
                            </Grid>
                            {editingId && (
                              <Grid item xs={6}>
                                <Button
                                  type="button"
                                  variant="outlined"
                                  color="secondary"
                                  fullWidth
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </form>
                    </LocalizationProvider>
                  </CardContent>
                </Card>
              </div>
              {/* Table */}
              <TableContainer component={Paper} sx={{ mt: 2, background: theme.palette.background.paper }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: theme.palette.background.paper }}>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Name</b></TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Phone</b></TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Fee Start Date</b></TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Fee Due Date</b></TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Status</b></TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}><b>Actions</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedUsers.map((u) => (
                          <TableRow
                            key={u.id}
                            sx={{
                              ...(isOverdue(u.fee_due_date) ? { backgroundColor: theme.palette.mode === 'dark' ? '#3a2327' : '#f8d7da' } : {}),
                              transition: 'background 0.2s',
                              '&:hover': {
                                background: isOverdue(u.fee_due_date)
                                  ? (theme.palette.mode === 'dark' ? '#4a2a2f' : '#f5c6cb')
                                  : (theme.palette.mode === 'dark' ? '#23272f' : '#f0f4f8'),
                              },
                            }}
                          >
                            <TableCell sx={{ color: theme.palette.text.primary }}>{u.name}</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>{u.phone}</TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>
                              {u.fee_start_date
                                ? new Date(u.fee_start_date).toLocaleDateString()
                                : ""}
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary }}>
                              {u.fee_due_date
                                ? new Date(u.fee_due_date).toLocaleDateString()
                                : ""}
                            </TableCell>
                            <TableCell>
                              {isOverdue(u.fee_due_date) ? (
                                <span style={{ background: theme.palette.error.main, color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600 }}>Overdue</span>
                              ) : (
                                <span style={{ background: theme.palette.success.main, color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600 }}>Active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<i className="bi bi-pencil-square"></i>}
                                onClick={() => handleEdit(u)}
                                sx={{ mr: 1 }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<i className="bi bi-trash"></i>}
                                onClick={() => handleDelete(u.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedUsers.length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ color: theme.palette.text.primary }}>
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <nav style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
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
              </TableContainer>
            </>}
            {/* Footer */}
            <footer>
              &copy; {new Date().getFullYear()} MAX FIT Gym. All rights reserved.
            </footer>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default App; 