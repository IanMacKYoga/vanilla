import { useState } from 'react';
import './index.css';
import Dashboard from './components/Dashboard';
import WorkflowBuilder from './components/WorkflowBuilder';

export default function App() {
    const [currentView, setCurrentView] = useState('dashboard');

    return (
        <div className="app-container animate-fade-in">
            <nav className="top-nav">
                <h2 className="gradient-text" style={{ fontSize: '1.25rem', margin: 0 }}>Vanilla</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-teal)', background: 'rgba(0, 208, 156, 0.1)', border: 'none' }}>
                        Autopilot Active
                    </div>
                </div>
            </nav>

            {currentView === 'dashboard' ? (
                <Dashboard onCreateNew={() => setCurrentView('builder')} />
            ) : (
                <WorkflowBuilder onCancel={() => setCurrentView('dashboard')} onSave={() => setCurrentView('dashboard')} />
            )}
        </div>
    );
}
