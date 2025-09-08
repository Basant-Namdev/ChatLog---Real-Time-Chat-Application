import React, { useEffect, useState, useRef, } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import './home.css';

const Home = () => {
    const navigate = useNavigate();
    const be_url = import.meta.env.VITE_BE_URL;
    const { login } = useAuth();
    const [activeForm, setActiveForm] = useState('login');
    const [formErrors, setFormErrors] = useState({ login: '', signup: '' });
    const [passwordVisibility, setPasswordVisibility] = useState({
        'login-password': false,
        'signup-password': false,
        'signup-confirm': false
    });

    const signupFormRef = useRef(null);
    const loginFormRef = useRef(null);

    useEffect(() => {
        AOS.init({
            once: true, // animation happens only once
        });
    }, []);

    const toggleForms = (mode) => {
        setActiveForm(mode);
        setFormErrors({ login: '', signup: '' }); // Clear errors when switching forms
    };

    const togglePasswordVisibility = (targetId) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [targetId]: !prev[targetId]
        }));
    };

    const setError = (type, error) => {
        setFormErrors(prev => ({ ...prev, [type]: error }));
    };

    const validateForm = (formData) => {
        setError('signup', '');

        const name = formData.get('name');
        if (name.length < 3) {
            setError('signup', '*name length is too short.');
            return false;
        }

        const password = formData.get('password');
        if (password.length < 6) {
            setError('signup', '*password length should be minimum 6.');
            return false;
        }

        if (!(/[A-Z]/.test(password))) {
            setError('signup', '*password should atleast contain a capital letter');
            return false;
        }

        if (!(/[a-z]/.test(password))) {
            setError('signup', '*password should atleast contain a small letter');
            return false;
        }

        if (!(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password))) {
            setError('signup', '*password should atleast contain a special character');
            return false;
        }

        const cnfPassword = formData.get('cnf-password');
        if (cnfPassword !== password) {
            setError('signup', '*passwords do not match.');
            return false;
        }

        return true;
    };

    const handleSignupSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        if (!validateForm(formData)) {
            return;
        }

        // Convert FormData to regular object
        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BE_URL}/signUp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            });

            const result = await response.json();

            if (result.success) {
                // Using browser's native alert if swal is not available
                if (window.swal) {
                    window.swal.fire({
                        icon: 'success',
                        title: 'signup successful',
                        text: "You are successfully registered. You can now proceed with login.",
                        confirmButtonColor: 'green',
                        confirmButtonText: 'Okay'
                    });
                } else {
                    alert('Signup successful! You are successfully registered. You can now proceed with login.');
                }
            } else {
                if (window.swal) {
                    window.swal.fire({
                        icon: 'info',
                        title: 'failed',
                        text: "Something went wrong! try again later.",
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Okay'
                    });
                } else {
                    alert('Something went wrong! try again later.');
                }
                console.error('Error submitting form:', result.error);
            }
        } catch (error) {
            if (window.swal) {
                window.swal.fire({
                    icon: 'info',
                    title: 'Internal server error',
                    text: "Something went wrong! try again later.",
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Okay'
                });
            } else {
                alert('Internal server error. Something went wrong! try again later.');
            }
            console.error('Error submitting form:', error);
        }
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch(`${import.meta.env.VITE_BE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const result = await response.json();

            if (result.redirectUrl) {
                // hide the modal
                document.getElementById('authModal')?.classList.remove('show');
                document.body.classList.remove('modal-open');
                document.querySelector('.modal-backdrop')?.remove();
                login(result.userId, result.token);
                navigate('/dashbord');
            } else if (!result.success) {
                setError('login', '*Invalid username or password!');
            }
        } catch (error) {
            if (window.swal) {
                window.swal.fire({
                    icon: 'info',
                    title: 'Internal server error',
                    text: "Something went wrong! try again later.",
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Okay'
                });
            } else {
                alert('Internal server error. Something went wrong! try again later.');
            }
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div>
            <>
                {/* ================== NAVBAR ================== */}
                <nav
                    className="navbar navbar-expand-lg navbar-dark fixed-top shadow-sm"
                    data-aos="fade-down"
                    data-aos-delay={100}
                >
                    <div className="container">
                        <a
                            className="navbar-brand fw-bold"
                            href="#home"
                            data-aos="fade-right"
                            data-aos-delay={200}
                        >
                            Chatlog
                        </a>
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                            data-aos="fade-left"
                            data-aos-delay={300}
                        >
                            <span className="navbar-toggler-icon" />
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-lg-2 text-center">
                                <li className="nav-item" data-aos="fade-down" data-aos-delay={400}>
                                    <a className="nav-link" href="#about">
                                        About
                                    </a>
                                </li>
                                <li className="nav-item" data-aos="fade-down" data-aos-delay={500}>
                                    <a className="nav-link" href="#features">
                                        Features
                                    </a>
                                </li>
                                <li className="nav-item" data-aos="fade-down" data-aos-delay={600}>
                                    <a className="nav-link" href="#contact">
                                        Contact
                                    </a>
                                </li>
                                {/* Auth Buttons */}
                                <li
                                    className="nav-item d-flex flex-column flex-lg-row gap-2 mt-2 mt-lg-0 justify-content-center"
                                    data-aos="fade-left"
                                    data-aos-delay={700}
                                >
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        data-bs-toggle="modal"
                                        data-bs-target="#authModal"
                                        onClick={() => toggleForms('login')}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        data-bs-toggle="modal"
                                        data-bs-target="#authModal"
                                        onClick={() => toggleForms('signup')}
                                    >
                                        Sign Up
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
                {/* ================== HERO ================== */}
                <section
                    id="home"
                    className="py-5 position-relative text-center text-white"
                    style={{
                        minHeight: "100vh",
                        background: 'url("../../../images/B.avif") center/cover no-repeat'
                    }}
                >
                    {/* Overlay */}
                    <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ background: "rgba(0, 0, 0, 0.75)", zIndex: 1 }}
                    ></div>
                    {/* Content */}
                    <div
                        className="container d-flex flex-column justify-content-center align-items-center h-100 position-relative z-2"
                        data-aos="fade-up"
                        data-aos-delay={300}
                    >
                        <h1
                            className="display-3 fw-bold mb-3"
                            style={{ textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)" }}
                        >
                            Welcome to <span className="text-primary">ChatLog</span>
                        </h1>
                        <p
                            className="lead mb-4 px-3"
                            style={{ maxWidth: 640, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                        >
                            Your private, secure chat space.
                            <br className="d-none d-md-block" />
                            Connect, share, and collaborate — instantly and safely.
                        </p>
                        <button
                            className="btn btn-lg btn-primary px-4 py-2 shadow"
                            data-bs-toggle="modal"
                            data-bs-target="#authModal"
                            onClick={() => toggleForms('signup')}
                            data-aos="zoom-in"
                            data-aos-delay={600}
                        >
                            Get Started
                        </button>
                    </div>
                </section>
                {/* ================== ABOUT ================== */}
                <section id="about" className="py-5 text-white bg-black">
                    <div className="container">
                        <h2 className="text-center mb-4 fw-bold" data-aos="fade-up">
                            About ChatLog
                        </h2>
                        <div className="row align-items-center">
                            <div
                                className="col-md-6 mb-4 mb-md-0"
                                data-aos="zoom-in-right"
                                data-aos-delay={200}
                            >
                                <img
                                    src="../../../images/A.webp"
                                    alt="About ChatLog"
                                    className="img-fluid rounded shadow"
                                />
                            </div>
                            <div className="col-md-6" data-aos="fade-left" data-aos-delay={400}>
                                <p className="lead">
                                    <strong>ChatLog</strong> is a modern, secure, and user-friendly chat
                                    platform designed to connect people instantly. Whether you want to
                                    chat with friends, collaborate with colleagues, or communicate with
                                    clients—ChatLog offers a seamless messaging experience with built-in
                                    privacy and performance.
                                </p>
                                <p>
                                    Our goal is to make real-time communication easy, fast, and
                                    enjoyable. We offer features like one-on-one chats, login/signup
                                    authentication, Google sign-in, responsive design, and more—all
                                    built using cutting-edge technologies like{" "}
                                    <strong>MERN Stack</strong> and <strong>Bootstrap 5</strong>.
                                </p>
                                <p>
                                    Designed with simplicity and speed in mind, ChatLog ensures that
                                    your conversations are smooth and secure. We're constantly working
                                    on new features to make ChatLog better every day.
                                </p>
                                <p className="mt-3 mb-0">
                                    <strong>Join us today</strong> and experience the future of
                                    messaging!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ================== Features ================== */}
                <section id="features" className="py-5 bg-dark text-white">
                    <div className="container">
                        <h3 className="text-center mb-4 fw-bold" data-aos="fade-up">
                            Why Choose ChatLog?
                        </h3>
                        <div className="row text-center">
                            <div className="col-md-4 mb-3" data-aos="fade-up" data-aos-delay={100}>
                                <i className="fa-solid fa-lock fa-2x mb-3" />
                                <h5>Secure Authentication</h5>
                                <p>
                                    Sign in securely with email or Google accounts. Your data is
                                    encrypted and safe with us.
                                </p>
                            </div>
                            <div className="col-md-4 mb-3" data-aos="fade-up" data-aos-delay={200}>
                                <i className="fa-solid fa-bolt fa-2x mb-3" />
                                <h5>Real-Time Messaging</h5>
                                <p>
                                    Chat instantly with friends, clients, or teammates—no lag, no
                                    hassle.
                                </p>
                            </div>
                            <div className="col-md-4 mb-3" data-aos="fade-up" data-aos-delay={300}>
                                <i className="fa-solid fa-mobile-screen fa-2x mb-3" />
                                <h5>Mobile Responsive</h5>
                                <p>
                                    Use ChatLog comfortably on any device—smartphone, tablet, or
                                    desktop.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ================== CONTACT ================== */}
                <section
                    id="contact"
                    className="py-5 text-white"
                    style={{ backgroundColor: "#111" }}
                >
                    <div className="container" data-aos="fade-up">
                        <h2
                            className="text-center fw-bold mb-4"
                            data-aos="fade-up"
                            data-aos-delay={100}
                        >
                            Contact Us
                        </h2>
                        <div className="row g-4 align-items-start">
                            {/* Contact Form */}
                            <div
                                className="col-md-6 mb-3"
                                data-aos="fade-right"
                                data-aos-delay={200}
                            >
                                <form>
                                    <div className="mb-3">
                                        <label htmlFor="contact-name" className="form-label">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-white border-secondary"
                                            id="contact-name"
                                            placeholder="Your Name"
                                            required=""
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="contact-email" className="form-label">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control bg-dark text-white border-secondary"
                                            id="contact-email"
                                            placeholder="you@example.com"
                                            required=""
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="contact-message" className="form-label">
                                            Message
                                        </label>
                                        <textarea
                                            className="form-control bg-dark text-white border-secondary"
                                            id="contact-message"
                                            rows={4}
                                            placeholder="Your message here..."
                                            required=""
                                            defaultValue={""}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        Send Message
                                    </button>
                                </form>
                            </div>
                            {/* Contact Info */}
                            <div
                                className="col-md-6 m-auto"
                                data-aos="fade-left"
                                data-aos-delay={300}
                            >
                                <div className="p-3 rounded bg-dark border border-secondary shadow">
                                    <h5 className="fw-bold">Get in Touch</h5>
                                    <p>
                                        If you have any questions, suggestions, or just want to say hello
                                        — we'd love to hear from you!
                                    </p>
                                    <ul className="list-unstyled">
                                        <li className="mb-2">
                                            <i className="fa-solid fa-envelope me-2" />
                                            <a
                                                href="mailto:support@chatlog.com"
                                                className="text-white text-decoration-none"
                                            >
                                                support@chatlog.com
                                            </a>
                                        </li>
                                        <li className="mb-2">
                                            <i className="fa-solid fa-phone me-2" />
                                            <a
                                                href="tel:+919876543210"
                                                className="text-white text-decoration-none"
                                            >
                                                +91 98765 43210
                                            </a>
                                        </li>
                                        <li className="mb-2">
                                            <i className="fa-solid fa-location-dot me-2" />
                                            Indore, Madhya Pradesh, India
                                        </li>
                                    </ul>
                                    <div className="mt-3">
                                        <a href="#" className="text-white me-3">
                                            <i className="fa-brands fa-facebook fa-lg" />
                                        </a>
                                        <a href="#" className="text-white me-3">
                                            <i className="fa-brands fa-x-twitter fa-lg" />
                                        </a>
                                        <a href="#" className="text-white me-3">
                                            <i className="fa-brands fa-linkedin fa-lg" />
                                        </a>
                                        <a href="#" className="text-white">
                                            <i className="fa-brands fa-github fa-lg" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ================== FOOTER ================== */}
                <footer className="text-center text-white py-4 bg-dark border-top border-secondary">
                    <div className="container">
                        <p className="mb-1">© 2025 ChatLog. All rights reserved.</p>
                        <div>
                            <a href="#home" className="text-white me-3">
                                Home
                            </a>
                            <a href="#about" className="text-white me-3">
                                About
                            </a>
                            <a href="#contact" className="text-white">
                                Contact
                            </a>
                        </div>
                    </div>
                </footer>
                {/* ================== AUTH MODAL ================== */}
                <div className="modal fade" id="authModal" tabIndex={-1} aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content auth-card border-0 p-0">
                            <div className="modal-body p-0">
                                {/* Inner Card for spacing */}
                                <div className="p-4">
                                    {/* Toggle buttons */}
                                    <div className="btn-group w-100 mb-4" role="group">
                                        <button
                                            className={`btn btn-outline-primary ${activeForm === 'login' ? 'active' : ''}`}
                                            id="btn-login"
                                            type="button"
                                            onClick={() => toggleForms('login')}
                                        >
                                            Login
                                        </button>
                                        <button
                                            className={`btn btn-outline-primary ${activeForm === 'signup' ? 'active' : ''}`}
                                            id="btn-signup"
                                            type="button"
                                            onClick={() => toggleForms('signup')}
                                        >
                                            Sign&nbsp;Up
                                        </button>
                                    </div>
                                    {/* Login Form */}
                                    <form
                                        id="login-form"
                                        className={activeForm === 'login' ? '' : 'd-none'}
                                        onSubmit={handleLoginSubmit}
                                        ref={loginFormRef}
                                    >
                                        <div className="mb-3">
                                            <label htmlFor="login-email" className="form-label">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="login-email"
                                                name="username"
                                                placeholder="Enter email"
                                                required=""
                                            />
                                        </div>
                                        <div className="mb-3 position-relative">
                                            <label htmlFor="login-password" className="form-label">
                                                Password
                                            </label>
                                            <input
                                                type={passwordVisibility['login-password'] ? 'text' : 'password'}
                                                className="form-control"
                                                id="login-password"
                                                name="password"
                                                placeholder="Enter password"
                                                required=""
                                            />
                                            <i
                                                className={`fa-solid ${passwordVisibility['login-password'] ? 'fa-eye-slash' : 'fa-eye'} eye-icon position-absolute end-0 translate-middle-y m-3`}
                                                style={{ top: '50%', cursor: 'pointer' }}
                                                onClick={() => togglePasswordVisibility('login-password')}
                                            />
                                        </div>
                                        <div
                                            id="login-error"
                                            className="text-danger fw-semibold mb-3"
                                            style={{ minHeight: "1.2rem" }}
                                        >
                                            {formErrors.login}
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100 mb-2">
                                            Login
                                        </button>
                                        <a
                                            href={`${be_url}/auth/google?mode=login`}
                                            className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
                                        >
                                            <img
                                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                                alt="Google"
                                                style={{ height: "20px", width: "fit-content" }}
                                            />
                                            Sign&nbsp;in&nbsp;with&nbsp;Google
                                        </a>
                                    </form>
                                    {/* Sign‑Up Form */}
                                    <form
                                        id="signup-form"
                                        className={activeForm === 'signup' ? '' : 'd-none'}
                                        name="sign-up-form"
                                        onSubmit={handleSignupSubmit}
                                        ref={signupFormRef}
                                    >
                                        <div className="mb-3">
                                            <label htmlFor="signup-name" className="form-label">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="signup-name"
                                                name="name"
                                                placeholder="Enter name"
                                                required=""
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="signup-email" className="form-label">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="signup-email"
                                                name="username"
                                                placeholder="Enter email"
                                                required=""
                                            />
                                        </div>
                                        <div className="mb-3 position-relative">
                                            <label htmlFor="signup-password" className="form-label">
                                                Password
                                            </label>
                                            <input
                                                type={passwordVisibility['signup-password'] ? 'text' : 'password'}
                                                className="form-control"
                                                name="password"
                                                id="signup-password"
                                                placeholder="Enter password"
                                                required=""
                                            />
                                            <i
                                                className={`fa-solid ${passwordVisibility['signup-password'] ? 'fa-eye-slash' : 'fa-eye'} eye-icon position-absolute end-0 translate-middle-y m-3`}
                                                style={{ top: '50%', cursor: 'pointer' }}
                                                onClick={() => togglePasswordVisibility('signup-password')}
                                            />
                                        </div>
                                        <div className="mb-3 position-relative">
                                            <label htmlFor="signup-confirm" className="form-label">
                                                Confirm&nbsp;Password
                                            </label>
                                            <input
                                                type={passwordVisibility['signup-confirm'] ? 'text' : 'password'}
                                                name="cnf-password"
                                                className="form-control"
                                                id="signup-confirm"
                                                placeholder="Confirm password"
                                                required=""
                                            />
                                            <i
                                                className={`fa-solid ${passwordVisibility['signup-confirm'] ? 'fa-eye-slash' : 'fa-eye'} eye-icon position-absolute end-0 translate-middle-y m-3`}
                                                style={{ top: '50%', cursor: 'pointer' }}
                                                onClick={() => togglePasswordVisibility('signup-confirm')}
                                            />
                                        </div>
                                        <div
                                            id="signup-error"
                                            className="text-danger fw-semibold mb-3"
                                            style={{ minHeight: "1.2rem" }}
                                        >
                                            {formErrors.signup}
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100 mb-2">
                                            Sign&nbsp;Up
                                        </button>
                                        <a
                                            href={`${be_url}/auth/google?mode=signup`}
                                            className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2"
                                        >
                                            <img
                                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                                alt="Google"
                                                style={{ height: "20px", width: "fit-content" }}
                                            />
                                            Sign&nbsp;up&nbsp;with&nbsp;Google
                                        </a>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </div>
    );
};

export default Home;