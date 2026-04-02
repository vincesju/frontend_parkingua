import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);
    
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

    const handleVerify = () => { setActiveVerify(verifyInput.trim().toUpperCase()); };
    const clearVerify = () => { setVerifyInput(''); setActiveVerify(''); };

    const getFee = (type) => type?.includes("2") ? 1000 : (type?.includes("Service") ? 3000 : 2000);

    const pendingCount = records.filter(r => r.status === 'Pending').length;
    const approvedCount = records.filter(r => r.status === 'Approved').length;
    const totalRevenue = records.filter(r => r.status === 'Approved')
                                .reduce((acc, curr) => acc + getFee(curr.vehicle_type), 0);

    return (
        <div className="center">
            <div className="card admin-large-card">
                
                {/* TOPBAR */}
                <div className="topbar" style={{ marginBottom: '20px' }}>
                    <div>
                        <h2>UA Admin Management</h2>
                        <p className="subtitle">IT3B Finals • System Overview</p>
                    </div>
                    <div className="topbar-actions" style={{ gap: '20px' }}>
                        <button className="btn-purple slim" onClick={fetchData}>Refresh System</button>
                        <button className="btn-blue slim" onClick={() => navigate('/')}>Logout</button>
                    </div>
                </div>

                {/* QUICK VERIFY */}
                <div className="panel" style={{ textAlign: 'center', padding: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Quick Verify Sticker</h3>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <input 
                            type="text" 
                            placeholder="Enter Sticker ID (e.g. UA-001)" 
                            value={verifyInput}
                            style={{ textAlign: 'center', fontSize: '1.1rem', padding: '12px' }}
                            onChange={(e) => setVerifyInput(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                            <button className="btn-blue" onClick={handleVerify} style={{ width: '200px' }}>Verify Now</button>
                            {activeVerify && <button className="btn-gray" onClick={clearVerify} style={{ width: '100px' }}>Clear</button>}
                        </div>
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div className="stat-card"><h3>TOTAL APPS</h3><p>{records.length}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #ea580c' }}><h3 style={{color:'#ea580c'}}>PENDING</h3><p style={{color:'#ea580c'}}>{pendingCount}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #16a34a' }}><h3 style={{color:'#16a34a'}}>APPROVED</h3><p style={{color:'#16a34a'}}>{approvedCount}</p></div>
                    <div className="stat-card" style={{ borderTop: '4px solid #2563eb' }}><h3>REVENUE</h3><p>₱{totalRevenue.toLocaleString()}</p></div>
                </div>

                {/* TABLE PANEL */}
                <div className="panel">
                    <div className="panel-header-with-filter">
                        <h3 style={{ margin: 0 }}>Application Records</h3>
                        <div className="filter-controls">
                            <button className={isDecrypted ? "btn-green slim" : "btn-gray slim"} onClick={() => setIsDecrypted(!isDecrypted)}>
                                {isDecrypted ? 'Hide Data' : 'Decrypt Data'}
                            </button>
                            <input type="text" className="table-filter" placeholder="Search Plate..." onChange={(e) => setSearch(e.target.value.toLowerCase())} />
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Owner Name</th>
                                    <th>Role & Details</th>
                                    <th>Plate Number</th>
                                    <th>Sticker ID</th>
                                    <th>Type</th>
                                    <th>Fee</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records
                                    .filter(r => {
                                        if (activeVerify) return r.sticker_id === activeVerify;
                                        return decryptData(r.plate_number).toLowerCase().includes(search);
                                    })
                                    .slice().reverse().map((v) => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 600 }}>{isDecrypted ? decryptData(v.owner_name) : v.owner_name}</td>
                                        
                                        {/* ROLE INFO COLUMN */}
                                        <td>
                                            <div style={{ lineHeight: '1.2' }}>
                                                <strong style={{ 
                                                    display: 'block', 
                                                    fontSize: '0.75rem', 
                                                    color: v.role?.toLowerCase() === 'guest' ? '#2563eb' : '#ea580c',
                                                    textTransform: 'uppercase' 
                                                }}>
                                                    {v.role || 'USER'}
                                                </strong>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {v.identifier || 'N/A'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="bold-plate">{isDecrypted ? decryptData(v.plate_number) : v.plate_number}</td>
                                        <td className="sticker-id-text">{v.sticker_id || '---'}</td>
                                        <td>{v.vehicle_type}</td>
                                        <td>₱{getFee(v.vehicle_type).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${v.status.toLowerCase()}`}>
                                                {v.status}
                                            </span>
                                        </td>
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
                    </div>
                </div>
            </div>
        </div>
    );
}