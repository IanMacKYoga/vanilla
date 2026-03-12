import React, { useState } from 'react';
import { ArrowLeft, Box, Check, ChevronRight, Zap, Play, Radio, Youtube, MessageSquare } from 'lucide-react';
import WireframeIceCream from './WireframeIceCream';

export default function WorkflowBuilder({ onCancel, onSave }) {
    const [step, setStep] = useState(1);
    const [trigger, setTrigger] = useState(null);
    const [action, setAction] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const triggers = [
        { id: 'trigger_youtube_rss', title: 'New Top Podcast Drop (Scan RSS)', icon: <Youtube size={20} /> },
        { id: 'always', title: 'Scheduled Time (Daily)', icon: <Play size={20} /> },
    ];

    const actions = [
        { id: 'action_daily_autopilot', title: 'Daily Autopilot (Extract -> AI -> YT Shorts)', icon: <Check size={20} /> },
        { id: 'action_opus_clip', title: 'Extract viral clip via Opus Clip', icon: <Radio size={20} /> },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const selectedT = triggers.find(t => t.id === trigger);
            const selectedA = actions.find(a => a.id === action);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/workflows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${selectedT.title.substring(0, 15)} -> ${selectedA.title.substring(0, 15)}`,
                    trigger_type: trigger,
                    trigger_config: {},
                    action_type: action,
                    action_config: {},
                    active: true
                })
            });
            // Keep the animation visible for at least 3 seconds so the user can enjoy the 3D scene
            setTimeout(() => {
                onSave(); // return to dashboard
            }, 3000);
        } catch (err) {
            console.error('Failed to create workflow', err);
            setIsSaving(false);
        }
    };

    if (isSaving) {
        return (
            <div className="animate-fade-in" style={{
                position: 'fixed', inset: 0, backgroundColor: 'var(--bg-primary)', zIndex: 100,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ width: '400px', height: '400px', position: 'relative' }}>
                    <WireframeIceCream width="100%" height="100%" />
                </div>
                <h2 style={{ marginTop: '20px', color: 'var(--text-primary)', fontSize: '24px', fontWeight: 600 }}>Building your Hook...</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px' }}>The Vanilla Engine is wiring the modules.</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{
            display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)'
        }}>
            <div style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onCancel} style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Create Hook</h3>
                </div>

                {step === 2 && trigger && action && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            background: 'var(--success)', color: '#fff', fontSize: '13px',
                            padding: '6px 14px', borderRadius: '8px', border: 'none', fontWeight: 600,
                            opacity: isSaving ? 0.7 : 1
                        }}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>

            <div className="content-pad" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '16px',
                        background: step >= 1 ? 'var(--accent-blue)' : 'var(--glass-bg)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: step >= 1 ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px'
                    }}>1</div>
                    <div style={{ flex: 1, height: '2px', background: 'var(--glass-border)' }}>
                        <div style={{ height: '100%', width: step === 2 ? '100%' : '0%', background: 'var(--accent-blue)', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '16px',
                        background: step === 2 ? 'var(--accent-purple)' : 'var(--glass-bg)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: step === 2 ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px'
                    }}>2</div>
                </div>

                {step === 1 ? (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Select Trigger</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>When this happens...</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {triggers.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setTrigger(t.id)}
                                    className="glass-panel"
                                    style={{
                                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                                        borderColor: trigger === t.id ? 'var(--accent-blue)' : 'var(--glass-border)',
                                        background: trigger === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--glass-bg)'
                                    }}
                                >
                                    <div style={{ color: trigger === t.id ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{t.icon}</div>
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: '15px' }}>{t.title}</span>
                                    {trigger === t.id ? <Check size={20} color="var(--accent-blue)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn-primary"
                            disabled={!trigger}
                            onClick={() => setStep(2)}
                            style={{ marginTop: 'auto', opacity: trigger ? 1 : 0.5, pointerEvents: trigger ? 'auto' : 'none' }}
                        >
                            Continue <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Select Action</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Then do this...</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {actions.map(a => (
                                <div
                                    key={a.id}
                                    onClick={() => setAction(a.id)}
                                    className="glass-panel"
                                    style={{
                                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                                        borderColor: action === a.id ? 'var(--accent-purple)' : 'var(--glass-border)',
                                        background: action === a.id ? 'rgba(139, 92, 246, 0.05)' : 'var(--glass-bg)'
                                    }}
                                >
                                    <div style={{ color: action === a.id ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>{a.icon}</div>
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: '15px' }}>{a.title}</span>
                                    {action === a.id ? <Check size={20} color="var(--accent-purple)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn-primary"
                            disabled={!action || isSaving}
                            onClick={handleSave}
                            style={{
                                marginTop: 'auto',
                                background: 'linear-gradient(135deg, var(--accent-purple), var(--success))',
                                opacity: action && !isSaving ? 1 : 0.5, pointerEvents: action && !isSaving ? 'auto' : 'none',
                                boxShadow: action ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none'
                            }}
                        >
                            {isSaving ? 'Saving...' : <><span style={{ marginRight: '8px' }}>Finish Setup</span> <Check size={18} /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
