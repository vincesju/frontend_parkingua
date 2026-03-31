import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);
    
    // State for the Verify Input
    const [verifyInput, setVerifyInput] = useState('');
    const [activeVerify, setActiveVerify] = useState('');

    const decryptData = (ciphertext) => {
        try {
            const bytes = CryptoJS.DES.decrypt(ciphertext, 'UA-SECRET-KEY');
            return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
        } catch (e) { return ciphertext; }
    };

    const fetchData = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/admin-records/');
            setRecords(res.data);
        } catch (err) { console.error("Admin fetch error:", err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.post('http://127.0.0.1:8000/api/update-status/', { id, status });
            fetchData(); 
        } catch (err) { alert("Update failed"); }
    };

    // Logic to handle the Verify Button click
    const handleVerify = () => {
        setActiveVerify(verifyInput.trim().toUpperCase());
    };

    // Logic to clear verification
    const clearVerify = () => {
        setVerifyInput('');
        setActiveVerify('');
    };

    const getFee = (type) => type?.includes("2") ? 1000 : (type?.includes("Service") ? 3000 : 2000);

    const pendingCount = records.filter(r => r.status === 'Pending').length;
    const approvedCount = records.filter(r => r.status === 'Approved').length;
    const totalRevenue = records.filter(r => r.status === 'Approved')
                                .reduce((acc, curr) => acc + getFee(curr.vehicle_type), 0);

    return (
        <div className="center">
            <div className="card dashboard-card">
                <div className="topbar">
                    <div>
                        <h2>UA Admin Panel</h2>
                        <p className="subtitle">IT3B Finals • Secure Parking Management</p>
                    </div>
                    <div className="topbar-actions">
                        <button className="btn-purple slim" onClick={fetchData}>Refresh System</button>
                        <button className="btn-blue slim" onClick={() => navigate('/')}>Logout</button>
                    </div>
                </div>

                {/* --- FUNCTIONAL QUICK VERIFY SECTION --- */}
                <div className="panel">
                    <h3>Quick Verify Sticker</h3>
                    <div className="action-grid" style={{ gridTemplateColumns: '1fr auto auto', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Enter Sticker ID (e.g. UA-001)" 
                            value={verifyInput}
                            onChange={(e) => setVerifyInput(e.target.value)}
                        />
                        <button className="btn-blue slim" onClick={handleVerify} style={{marginTop: '7px'}}>Verify Now</button>
                        {activeVerify && (
                            <button className="btn-gray slim" onClick={clearVerify} style={{marginTop: '7px'}}>Clear</button>
                        )}
                    </div>
                    {activeVerify && (
                        <p style={{fontSize: '0.8rem', color: '#6366f1', marginTop: '5px'}}>
                            Filtering by Sticker ID: <strong>{activeVerify}</strong>
                        </p>
                    )}
                </div>

                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
                    <div className="stat-card"><h3>TOTAL APPLICATIONS</h3><p>{records.length}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #ea580c' }}><h3 style={{color:'#ea580c'}}>PENDING</h3><p style={{color:'#ea580c'}}>{pendingCount}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #16a34a' }}><h3 style={{color:'#16a34a'}}>APPROVED</h3><p style={{color:'#16a34a'}}>{approvedCount}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #2563eb' }}><h3>REVENUE</h3><p>₱{totalRevenue.toLocaleString()}</p></div>
                </div>

                <div className="panel">
                    <div className="panel-header-with-filter">
                        <h3 style={{ margin: 0 }}>Application Records</h3>
                        <div className="filter-controls">
                            <button className={isDecrypted ? "btn-green slim" : "btn-gray slim"} onClick={() => setIsDecrypted(!isDecrypted)}>
                                Data: {isDecrypted ? 'DECRYPTED' : 'HIDDEN'}
                            </button>
                            <input type="text" className="table-filter" placeholder="Filter by Plate..." onChange={(e) => setSearch(e.target.value.toLowerCase())} />
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr><th>Owner Name</th><th>Plate Number</th><th>Sticker ID</th><th>Vehicle Type</th><th>Fee</th><th>Status</th><th style={{ textAlign: 'right' }}>Manage</th></tr>
                            </thead>
                            <tbody>
                                {records
                                    .filter(r => {
                                        // 1. If Quick Verify is active, only show that Sticker ID
                                        if (activeVerify) {
                                            return r.sticker_id === activeVerify;
                                        }
                                        // 2. Otherwise, use the standard search filter
                                        return decryptData(r.plate_number).toLowerCase().includes(search);
                                    })
                                    .slice().reverse().map((v) => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 600 }}>{isDecrypted ? decryptData(v.owner_name) : v.owner_name}</td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{isDecrypted ? decryptData(v.plate_number) : v.plate_number}</td>
                                        <td style={{ color: '#2563eb', fontWeight: 800 }}>{v.sticker_id || '---'}</td>
                                        <td>{v.vehicle_type}</td>
                                        <td style={{ fontWeight: 600 }}>₱{getFee(v.vehicle_type).toLocaleString()}</td>
                                        <td><span className={`role-badge ${v.status === 'Approved' ? 'admin' : (v.status === 'Rejected' ? 'red' : '')}`}>{v.status}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            {v.status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-green slim" onClick={() => handleUpdateStatus(v.id, 'Approved')}>✔</button>
                                                    <button className="btn-red slim" onClick={() => handleUpdateStatus(v.id, 'Rejected')}>✖</button>
                                                </div>
                                            ) : <button className="btn-gray slim" onClick={() => handleUpdateStatus(v.id, 'Pending')}>Reset</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeVerify && records.filter(r => r.sticker_id === activeVerify).length === 0 && (
                            <div style={{textAlign: 'center', padding: '20px', color: '#ef4444'}}>
                                No record found with Sticker ID: {activeVerify}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}