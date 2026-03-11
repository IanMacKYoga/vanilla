import React from 'react';
import { Wallet } from 'lucide-react';

export default function ConnectWallet({ onConnect }) {
    return (
        <div className="app-container" style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            background: 'radial-gradient(circle at 50% 0%, #1a1c30 0%, var(--bg-primary) 70%)'
        }}>
            <div className="glass-panel animate-slide-up" style={{
                padding: '40px 32px',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)'
                }}>
                    <Wallet size={32} color="var(--accent-blue)" />
                </div>

                <div>
                    <h1 style={{ fontSize: '28px', marginBottom: '8px' }} className="gradient-text">Vanilla</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
                        Connect your wallet to start automating your Web3 workflows.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={onConnect}
                    style={{ width: '100%', marginTop: '12px' }}
                >
                    Connect Wallet
                </button>
            </div>
        </div>
    );
}
