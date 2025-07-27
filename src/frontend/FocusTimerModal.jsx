import React from 'react';

export default function FocusTimerModal({ open, onClose, task, onStart, onPause, onStop, running, elapsed }) {
  if (!open) return null;
  
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };
  
  const total = (task.timeRecords || []).reduce((sum, r) => 
    sum + (r.end && r.start ? Math.floor((r.end - r.start) / 1000) : 0), 0
  ) + (running ? elapsed : 0);
  
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 10,
        padding: 32,
        minWidth: 320,
        boxShadow: '0 4px 24px #0002'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          专注计时：{task.text}
        </h3>
        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          {fmt(elapsed)}
        </div>
        <div style={{ marginBottom: 16, color: '#888' }}>
          累计用时：{fmt(total)}
        </div>
        <div>
          {running ? (
            <>
              <button 
                onClick={onPause} 
                style={{
                  marginRight: 8,
                  background: '#fbbf24',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 18px',
                  fontWeight: 600
                }}
              >
                暂停
              </button>
              <button 
                onClick={onStop} 
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 18px',
                  fontWeight: 600
                }}
              >
                结束
              </button>
            </>
          ) : (
            <button 
              onClick={onStart} 
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 18px',
                fontWeight: 600
              }}
            >
              开始
            </button>
          )}
          <button 
            onClick={onClose} 
            style={{
              marginLeft: 8,
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: 4,
              padding: '6px 18px'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
} 