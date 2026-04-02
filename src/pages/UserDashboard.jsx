import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function UserDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [records, setRecords] = useState([]);
    
    // UI & Form States
    const [plate, setPlate] = useState('');
    const [type, setType] = useState('4-Wheels');
    const [showNotif, setShowNotif] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings States
    const [newPassword, setNewPassword] = useState('');
    const [newIdentifier, setNewIdentifier] = useState('');
    
    // Data for Dropdowns
    const strands = ["STEM", "ABM", "HUMSS", "GAS", "TVL"];
    const courses = ["BSIT", "BSCS", "BSBA", "BSCrim", "BSHM", "BSA", "BSED"];

    // 1. Decryption Helper
    const decryptData = (ciphertext) => {
        try {
            const bytes = CryptoJS.DES.decrypt(ciphertext, 'UA-SECRET-KEY');
            return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
        } catch (e) { return ciphertext; }
    };

    // 2. Initialize Session & Fetch Data
    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!savedUser) {
            navigate('/');
        } else {
            setUser(savedUser);
            setNewIdentifier(savedUser.identifier || '');
            fetchUserRecords(savedUser.username);
        }
    }, [navigate]);

    const fetchUserRecords = async (username) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/user-records/?username=${username}`);
            setRecords(res.data);
        } catch (err) {
            console.error("User fetch error:", err);
        }
    };

    const notifications = records.filter(r => r.is_seen === false);

    const markAsRead = async () => {
        try {
            await axios.post('http://127.0.0.1:8000/api/mark-notifications-read/', { 
                username: user.username 
            });
            fetchUserRecords(user.username);
            setShowNotif(false);
        } catch (err) {
            console.error("Could not mark as read:", err);
        }
    };

    // 3. Update Profile Logic
    const handleUpdateProfile = async () => {
        try {
            const updateData = {
                username: user.username,
                identifier: newIdentifier,
            };
            
            // Keep your working password logic
            if (newPassword) {
                updateData.password = newPassword.trim();
            }

            await axios.post('http://127.0.0.1:8000/api/update-profile/', updateData);
            
            if (newPassword) {
                alert("Password changed! Please log in again.");
                localStorage.removeItem('currentUser');
                navigate('/');
            } else {
                const updatedUser = { ...user, identifier: newIdentifier };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                setUser(updatedUser);
                alert("Profile updated successfully!");
                setShowSettings(false);
            }
        } catch (err) {
            alert("Update failed. Check backend connection.");
        }
    };

    // 4. Submit Application
    const submitApp = async (e) => {
        e.preventDefault();
        if(!plate) return alert("Please enter Plate Number.");

        const displayFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        const encPlate = CryptoJS.DES.encrypt(plate, 'UA-SECRET-KEY').toString();
        const encOwner = CryptoJS.DES.encrypt(displayFullName, 'UA-SECRET-KEY').toString();
        
        try {
            await axios.post('http://127.0.0.1:8000/api/submit-vehicle/', {
                username: user.username,
                ownerName: encOwner,
                plateNumber: encPlate,
                vehicleType: type
            });
            alert("Application Sent!");
            setPlate('');
            fetchUserRecords(user.username);
        } catch (err) {
            alert("Submission failed.");
        }
    };

    if (!user) return null;

    const isGuest = user.role?.toLowerCase() === 'guest';
    const displayFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;

    return (
        <div className="center">
            <div className="card dashboard-card">
                <div className="topbar">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ margin: 0 }}>Welcome, <span style={{ color: '#6366f1' }}>{displayFullName}</span></h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p className="subtitle" style={{ margin: 0 }}>UA Parking Portal •</p>
                            <span className={`role-badge ${isGuest ? 'guest-tag' : 'student-tag'}`}>
                                {user.role?.toUpperCase() || 'USER'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                        <button className="btn-gray slim" onClick={() => setShowSettings(true)}>⚙️</button>

                        <button className="btn-gray slim bell-btn" onClick={() => setShowNotif(!showNotif)}>
                            🔔
                            {notifications.length > 0 && <span className="notif-count">{notifications.length}</span>}
                        </button>

                        {showNotif && (
                            <div className="notif-dropdown">
                                <h4>Recent Updates</h4>
                                {notifications.length === 0 ? (
                                    <p className="empty-notif">No new notifications.</p>
                                ) : (
                                    notifications.slice().reverse().map((n, i) => (
                                        <div key={i} className="notif-item">
                                            Vehicle <strong>{decryptData(n.plate_number)}</strong> has been 
                                            <strong className={n.status === 'Approved' ? 'text-green' : 'text-red'}> {n.status}</strong>.
                                        </div>
                                    ))
                                )}
                                {notifications.length > 0 && (
                                    <button className="link-btn mark-read" onClick={markAsRead}>Mark as Read</button>
                                )}
                            </div>
                        )}

                        <button className="btn-blue slim" onClick={() => { localStorage.removeItem('currentUser'); navigate('/'); }}>
                            Logout
                        </button>
                    </div>
                </div>

                {/* SETTINGS MODAL POPUP */}
                {showSettings && (
                    <div className="modal-overlay">
                        <div className="modal-content card" style={{ maxWidth: '450px', width: '90%' }}>
                            <h3 style={{ marginTop: 0 }}>Account Settings</h3>
                            <div style={{ textAlign: 'left', marginTop: '15px' }}>
                                
                                <label className="small-label">Change Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter new password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    style={{ marginBottom: '15px' }}
                                />

                                <hr style={{ border: '0.5px solid #e2e8f0', margin: '15px 0' }} />

                                {isGuest ? (
                                    <div>
                                        <label className="small-label">Purpose of Visit</label>
                                        <input 
                                            type="text" 
                                            value={newIdentifier} 
                                            onChange={(e) => setNewIdentifier(e.target.value)} 
                                        />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <label className="small-label">Student ID (Permanent)</label>
                                            <input type="text" value={user.identifier.split(' | ')[0]} disabled className="disabled-input" />
                                        </div>
                                        <div>
                                            <label className="small-label">Update Level</label>
                                            <select 
                                                value={newIdentifier.includes('Senior High') ? 'Senior High' : 'College'} 
                                                onChange={(e) => {
                                                    const idPart = user.identifier.split(' | ')[0];
                                                    setNewIdentifier(`${idPart} | ${e.target.value} - `);
                                                }}
                                            >
                                                <option value="Senior High">Senior High</option>
                                                <option value="College">College</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="small-label">Select Course/Strand</label>
                                            <select 
                                                onChange={(e) => {
                                                    const base = newIdentifier.split(' - ')[0];
                                                    setNewIdentifier(`${base} - ${e.target.value}`);
                                                }}
                                            >
                                                <option value="">-- Choose --</option>
                                                {(newIdentifier.includes('Senior High') ? strands : courses).map(item => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-green" style={{ flex: 1 }} onClick={handleUpdateProfile}>Save Changes</button>
                                <button className="btn-gray" onClick={() => { setShowSettings(false); setNewPassword(''); }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* APPLICATION FORM */}
                <div className="panel">
                    <h3 className="panel-title">Apply for Parking Sticker</h3>
                    <form onSubmit={submitApp}>
                        <div className="form-row-single">
                            <div className="auto-field">
                                <label className="small-label">Registered Owner</label>
                                <input type="text" value={displayFullName} disabled className="disabled-input" />
                            </div>
                            <div className="input-field">
                                <label className="small-label">Plate Number</label>
                                <input placeholder="Enter Plate Number" value={plate} onChange={e => setPlate(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            <div>
                                <label className="small-label">Vehicle Type</label>
                                <select value={type} onChange={e => setType(e.target.value)} style={{ margin: '7px 0' }}>
                                    <option value="2-Wheels">2-Wheels (₱1,000)</option>
                                    <option value="4-Wheels">4-Wheels (₱2,000)</option>
                                    <option value="Service">Service (₱3,000)</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-purple submit-btn" style={{ width: '100%', marginTop: '15px' }}>
                            Submit Application
                        </button>
                    </form>
                </div>

                <div className="panel">
                    <h3 className="panel-title">My Application Records</h3>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Plate Number</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Sticker ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr><td colSpan="4" className="empty-table">No records found.</td></tr>
                                ) : (
                                    records.slice().reverse().map((v, i) => (
                                        <tr key={i}>
                                            <td className="bold-plate">{decryptData(v.plate_number)}</td>
                                            <td>{v.vehicle_type}</td>
                                            <td>
                                                <span className={`status-badge ${v.status.toLowerCase()}`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="sticker-id">{v.sticker_id || '---'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}