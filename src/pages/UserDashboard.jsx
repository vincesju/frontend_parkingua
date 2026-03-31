import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function UserDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [records, setRecords] = useState([]);
    
    // Form & UI States
    const [plate, setPlate] = useState('');
    const [owner, setOwner] = useState('');
    const [type, setType] = useState('4-Wheels');
    const [showNotif, setShowNotif] = useState(false);

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

    // 3. Notification Logic
    // Filters records where is_seen is false (set by Admin in Django)
    const notifications = records.filter(r => r.is_seen === false);

    const markAsRead = async () => {
        try {
            // Update all records for this user to is_seen = true
            await axios.post('http://127.0.0.1:8000/api/mark-notifications-read/', { 
                username: user.username 
            });
            fetchUserRecords(user.username);
            setShowNotif(false);
        } catch (err) {
            console.error("Could not mark as read:", err);
        }
    };

    // 4. Submit Application
    const submitApp = async (e) => {
        e.preventDefault();
        if(!plate || !owner) return alert("Please fill in all fields.");

        const encPlate = CryptoJS.DES.encrypt(plate, 'UA-SECRET-KEY').toString();
        const encOwner = CryptoJS.DES.encrypt(owner, 'UA-SECRET-KEY').toString();
        
        try {
            await axios.post('http://127.0.0.1:8000/api/submit-vehicle/', {
                username: user.username,
                ownerName: encOwner,
                plateNumber: encPlate,
                vehicleType: type
            });
            alert("Application Sent to Admin!");
            setPlate('');
            setOwner('');
            fetchUserRecords(user.username);
        } catch (err) {
            alert("Submission failed.");
        }
    };

    if (!user) return null;

    const isGuest = user.role?.toLowerCase() === 'guest';

    return (
        <div className="center">
            <div className="card dashboard-card">
                
                {/* TOPBAR WITH DYNAMIC ROLE & NOTIFICATIONS */}
                <div className="topbar">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ margin: 0 }}>Welcome, <span style={{ color: '#6366f1' }}>{user.username}</span></h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p className="subtitle" style={{ margin: 0 }}>UA Parking Portal •</p>
                            <span style={{ 
                                padding: '2px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '900',
                                textTransform: 'uppercase', letterSpacing: '1px',
                                backgroundColor: isGuest ? '#dbeafe' : '#fef3c7',
                                color: isGuest ? '#1e40af' : '#92400e',
                                border: `1px solid ${isGuest ? '#bfdbfe' : '#fde68a'}`
                            }}>
                                {user.role || 'USER'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                        {/* NOTIFICATION BELL */}
                        <button 
                            className="btn-gray slim" 
                            onClick={() => setShowNotif(!showNotif)}
                            style={{ position: 'relative', fontSize: '1.1rem' }}
                        >
                            🔔
                            {notifications.length > 0 && (
                                <span style={{ 
                                    position: 'absolute', top: '-5px', right: '-5px', 
                                    background: '#ef4444', color: 'white', borderRadius: '50%',
                                    padding: '2px 5px', fontSize: '0.6rem', fontWeight: 'bold'
                                }}>
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {/* NOTIFICATION DROPDOWN */}
                        {showNotif && (
                            <div className="panel" style={{
                                position: 'absolute', top: '45px', right: 0, width: '280px',
                                zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0', padding: '15px'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>Recent Updates</h4>
                                {notifications.length === 0 ? (
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No new notifications.</p>
                                ) : (
                                    notifications.map((n, i) => (
                                        <div key={i} style={{ 
                                            fontSize: '0.75rem', padding: '10px', marginBottom: '5px',
                                            backgroundColor: '#f8fafc', borderRadius: '5px', borderLeft: '4px solid #6366f1'
                                        }}>
                                            Vehicle <strong>{decryptData(n.plate_number)}</strong> has been 
                                            <strong style={{ color: n.status === 'Approved' ? '#16a34a' : '#ef4444' }}> {n.status}</strong>.
                                        </div>
                                    ))
                                )}
                                {notifications.length > 0 && (
                                    <button className="link-btn" onClick={markAsRead} style={{ width: '100%', marginTop: '10px', fontSize: '0.7rem' }}>
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        )}

                        <button className="btn-blue slim" onClick={() => { localStorage.removeItem('currentUser'); navigate('/'); }}>
                            Logout
                        </button>
                    </div>
                </div>

                {/* APPLICATION FORM */}
                <div className="panel">
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Apply for Parking Sticker</h3>
                    <form onSubmit={submitApp}>
                        <div className="action-grid">
                            <input placeholder="Owner Full Name" value={owner} onChange={e => setOwner(e.target.value)} />
                            <input placeholder="Plate Number" value={plate} onChange={e => setPlate(e.target.value)} />
                        </div>
                        <select value={type} onChange={e => setType(e.target.value)} style={{ marginTop: '10px' }}>
                            <option value="2-Wheels">2-Wheels (₱1,000)</option>
                            <option value="4-Wheels">4-Wheels (₱2,000)</option>
                            <option value="Service">Service (₱3,000)</option>
                        </select>
                        <button type="submit" className="btn-purple" style={{ width: '100%', marginTop: '15px' }}>
                            Submit Application
                        </button>
                    </form>
                </div>

                {/* RECORDS TABLE */}
                <div className="panel">
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>My Application Records</h3>
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
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No records found.</td></tr>
                                ) : (
                                    records.slice().reverse().map((v, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{decryptData(v.plate_number)}</td>
                                            <td>{v.vehicle_type}</td>
                                            <td>
                                                <span className={`role-badge ${v.status === 'Approved' ? 'admin' : (v.status === 'Rejected' ? 'red' : 'pending-tag')}`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6366f1', fontWeight: 800 }}>{v.sticker_id || '---'}</td>
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