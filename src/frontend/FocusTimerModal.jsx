import React, { useMemo } from 'react';

export default function FocusTimerModal({ open, onClose, task, onStart, onPause, onStop, running, elapsed }) {
  if (!open) return null;
  
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };
  
  // 使用 useMemo 避免每次都重新计算
  const completedTime = useMemo(() => {
    return (task.timeRecords || []).reduce((sum, r) => {
      // 只计算已完成的记录（有 end 时间的）
      if (r.end && r.start) {
        return sum + Math.floor((r.end - r.start) / 1000);
      }
      return sum;
    }, 0);
  }, [task.timeRecords]);
  
  // 当前总时间 = 历史完成时间 + 当前这次的 elapsed
  const total = completedTime + elapsed;
  
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
                  fontWeight: 600,
                  cursor: 'pointer'
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
                  fontWeight: 600,
                  cursor: 'pointer'
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
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {elapsed > 0 ? '继续' : '开始'}
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
              padding: '6px 18px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}