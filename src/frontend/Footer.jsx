import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      position: 'fixed',
      left: 0,
      bottom: 0,
      width: '100vw',
      background: 'linear-gradient(90deg, #f5f6ff 0%, #fff 100%)',
      boxShadow: '0 -2px 8px #e0e7ef22',
      zIndex: 100,
      padding: '0',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 48,
        fontSize: 16,
        color: '#888',
        fontFamily: 'monospace',
        letterSpacing: 0.2,
        padding: '0 32px',
      }}>
        <span style={{ marginLeft: -222, fontSize: 10 }}>V 1.0.1</span>
        <span style={{ marginRight: 222, fontSize: 12 }}>Copyright © 2025 Yiyang Liu</span>
        <span style={{ marginRight: 22, fontSize: 12 }}>Made with ❤️ in Toronto</span>
      </div>
    </footer>
  );
} 