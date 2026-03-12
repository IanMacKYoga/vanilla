import React, { useState, useEffect } from 'react';
import { Plus, Zap, ArrowRight, Play, Activity, Trash2, Cpu } from 'lucide-react';
import WireframeIceCream from './WireframeIceCream';

export default function Dashboard({ onCreateNew }) {
    const [workflows, setWorkflows] = useState([]);
    const [stats, setStats] = useState({ activeCount: 0, runCount: 0 });
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchDashboardData = async () => {
        try {
            const resW = await fetch(`${apiUrl}/api/workflows`);
            const dataW = await resW.json();
            setWorkflows(dataW.workflows);

            const resS = await fetch(`${apiUrl}/api/stats`);
            const dataS = await resS.json();
            setStats(dataS);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleActive = async (id, currentStatus) => {
        await fetch(`${apiUrl}/api/workflows/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !currentStatus })
        });
        fetchDashboardData();
    };

    const deleteWorkflow = async (id) => {
        await fetch(`${apiUrl}/api/workflows/${id}`, { method: 'DELETE' });
        fetchDashboardData();
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 3D Wireframe Ice Cream Hero */}
            <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--glass-border)' }}>
                <WireframeIceCream height="240px" />
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', pointerEvents: 'none' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '8px' }}>
                        <Cpu size={14} /> AI Engine Online
                    </div>
                </div>
            </div>

            <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Active Hooks</span>
                        <span style={{ fontSize: '24px', fontWeight: 600 }}>{stats.activeCount}</span>
                    </div>
                    <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Tasks Run (30d)</span>
                        <span style={{ fontSize: '24px', fontWeight: 600 }}>{stats.runCount}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <h2 style={{ fontSize: '20px' }}>Your Hooks</h2>
                    <button className="btn-primary" onClick={onCreateNew} style={{ padding: '8px 16px', borderRadius: '10px' }}>
                        <Plus size={18} /> New
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {workflows.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
                            No workflows yet. Click New to create one!
                        </div>
                    )}

                    {workflows.map((wk) => (
                        <div key={wk.id} className="glass-panel animate-slide-up" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: wk.active ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-border)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                cursor: 'pointer'
                            }} onClick={() => toggleActive(wk.id, wk.active)}>
                                {wk.active ? <Activity size={20} color="var(--success)" /> : <Zap size={20} color="var(--text-secondary)" />}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: 500, fontSize: '15px' }}>{wk.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <span>{wk.trigger_type}</span>
                                    <ArrowRight size={12} />
                                    <span>{wk.action_type}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteWorkflow(wk.id)}
                                style={{
                                    background: 'transparent', border: 'none', padding: '8px',
                                    color: 'var(--danger)', cursor: 'pointer', opacity: 0.7
                                }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
