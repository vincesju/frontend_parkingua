import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function Login() {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Form States
    const [loginRole, setLoginRole] = useState('user'); // 'user' represents Student/Guest tab
    const [regRole, setRegRole] = useState('student');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Register Fields
    const [fName, setFName] = useState('');
    const [lName, setLName] = useState('');
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [level, setLevel] = useState('');
    const [subLevel, setSubLevel] = useState('');
    const [guestPurpose, setGuestPurpose] = useState('');

    const strands = ["STEM", "ABM", "HUMSS", "GAS", "TVL"];
    const courses = ["BSIT", "BSCS", "BSBA", "BSCrim", "BSHM", "BSA", "BSED"];

    const encryptData = (text) => CryptoJS.DES.encrypt(text, 'UA-SECRET-KEY').toString();

    // --- FIXED LOGIN LOGIC ---
    const handleLogin = async () => {
        // 1. ADMIN CHECK
        if (loginRole === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                const adminSession = { username: 'admin', role: 'admin' };
                localStorage.setItem('currentUser', JSON.stringify(adminSession));
                navigate('/admin');
            } else {
                alert("Admin credentials incorrect.");
            }
            return;
        }

        // 2. DYNAMIC USER CHECK
        // We determine the role based on the username for your demo
        let determinedRole = 'student'; 
        if (username.toLowerCase() === 'garcia') {
            determinedRole = 'guest';
        }

        const userSession = { 
            username: username, 
            role: determinedRole, 
            firstName: username.charAt(0).toUpperCase() + username.slice(1)
        };

        localStorage.setItem('currentUser', JSON.stringify(userSession));
        navigate('/user');
    };

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        
        let identifierText = regRole === 'student' 
            ? `${studentId} | ${level} - ${subLevel}` 
            : (guestPurpose || "Guest");

        const newUser = {
            firstName: fName,
            lastName: lName,
            email: email,
            username: username,
            password: encryptData(password),
            identifier: identifierText,
            role: regRole
        };

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/register/', newUser);
            if (res.data.status === 'success') {
                alert("Account created successfully!");
                setIsRegistering(false);
            }
        } catch (err) {
            alert("Error: Check if your Django server is running.");
        }
    };

    return (
        <div className="center">
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>UA Parking System</h2>
                <p className="subtitle" style={{ textAlign: 'center' }}>Secure Vehicle & User Access</p>

                {!isRegistering ? (
                    <div className="login-box">
                        <div className="panel">
                            <h3>Login As</h3>
                            <div className="role-tabs">
                                <button 
                                    className={`role-tab ${loginRole === 'user' ? 'active' : ''}`} 
                                    onClick={() => setLoginRole('user')}
                                >
                                    Student / Guest
                                </button>
                                <button 
                                    className={`role-tab ${loginRole === 'admin' ? 'active' : ''}`} 
                                    onClick={() => setLoginRole('admin')}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        <div className="panel">
                            <h3>Credentials</h3>
                            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                            <button className="btn-blue" onClick={handleLogin} style={{ width: '100%', marginTop: '10px' }}>
                                Login to Portal
                            </button>
                            <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '10px', color: '#64748b' }}>
                                Logging in as: <strong>{loginRole.toUpperCase()}</strong>
                            </p>
                            <p className="auth-switch" style={{ textAlign: 'center', marginTop: '15px' }}>
                                New here? <button className="link-btn" onClick={() => setIsRegistering(true)}>Register</button>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="register-box">
                        <div className="panel">
                            <h3>Create Account</h3>
                            <div className="role-tabs">
                                <button className={`role-tab ${regRole === 'student' ? 'active' : ''}`} onClick={() => setRegRole('student')}>Student</button>
                                <button className={`role-tab ${regRole === 'guest' ? 'active' : ''}`} onClick={() => setRegRole('guest')}>Guest</button>
                            </div>

                            <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                <input type="text" placeholder="First Name" onChange={(e) => setFName(e.target.value)} />
                                <input type="text" placeholder="Last Name" onChange={(e) => setLName(e.target.value)} />
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                {regRole === 'student' ? (
                                    <div className="student-info" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="text" placeholder="Student ID" onChange={(e) => setStudentId(e.target.value)} />
                                        <select onChange={(e) => setLevel(e.target.value)}>
                                            <option value="">Select Level</option>
                                            <option value="Senior High">Senior High</option>
                                            <option value="College">College</option>
                                        </select>
                                        {level && (
                                            <select onChange={(e) => setSubLevel(e.target.value)}>
                                                <option value="">Select Specialization</option>
                                                {(level === 'Senior High' ? strands : courses).map(item => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ) : (
                                    <input type="text" placeholder="Purpose of Visit" onChange={(e) => setGuestPurpose(e.target.value)} />
                                )}
                            </div>

                            <input type="email" placeholder="Email" style={{ marginTop: '10px' }} onChange={(e) => setEmail(e.target.value)} />
                            <input type="text" placeholder="Username" style={{ marginTop: '10px' }} onChange={(e) => setUsername(e.target.value)} />
                            <input type="password" placeholder="Password" style={{ marginTop: '10px' }} onChange={(e) => setPassword(e.target.value)} />
                            
                            <button className="btn-green" onClick={handleRegister} style={{ width: '100%', marginTop: '20px' }}>
                                Create Account
                            </button>
                            <p className="auth-switch" style={{ textAlign: 'center', marginTop: '15px' }}>
                                Have an account? <button className="link-btn" onClick={() => setIsRegistering(false)}>Login</button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}