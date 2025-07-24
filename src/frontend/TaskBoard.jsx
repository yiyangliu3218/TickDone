import React, { useEffect, useState, useRef } from 'react';
import { getTasks, addTask, updateTask } from '../backend/taskApi';
import { FaPlus, FaRegClock } from 'react-icons/fa';
import Stats from './Stats';

const quadrantMeta = {
  q1: { title: '1', color: '#fef2f2', border: '#fecaca', headerColor: '#b91c1c' },
  q2: { title: '2', color: '#fefce8', border: '#fde68a', headerColor: '#92400e' },
  q3: { title: '3', color: '#ecfdf5', border: '#6ee7b7', headerColor: '#047857' },
  q4: { title: '4', color: '#f0f9ff', border: '#7dd3fc', headerColor: '#0369a1' },
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px',
  flex: 1,
};

const taskCardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '10px 12px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  marginBottom: '12px',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto auto auto',
  alignItems: 'center',
  columnGap: '12px'
};

// 修正DDLCircle逻辑
function DDLCircle({ createdAt, ddlDate, daysToDDL, onClick }) {
  let daysLeft = 1;
  if (createdAt && (ddlDate || daysToDDL)) {
    const start = new Date(createdAt);
    let end;
    if (ddlDate) {
      end = new Date(ddlDate + 'T23:59:59');
    } else {
      end = new Date(start.getTime() + Math.max(1, daysToDDL) * 86400000);
    }
    const now = new Date();
    daysLeft = Math.max(1, Math.ceil((end - now) / 86400000));
  }
  // 圆环进度：剩余1天满圈，2天半圈，3天三分之一圈
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const progress = 1 / daysLeft;
  const offset = circumference * (1 - progress);
  // 颜色判断
  let color = '#22c55e'; // 绿色
  if (daysLeft <= 1) color = '#ef4444'; // 红色
  else if (daysLeft <= 3) color = '#f59e42'; // 橙色
  else if (daysLeft <= 7) color = '#3b82f6'; // 蓝色
  return (
    <div onClick={onClick} title={`剩余${daysLeft}天`} style={{ cursor: 'pointer', position: 'relative', width: 40, height: 40 }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={r} stroke="#eee" strokeWidth={4} fill="none" />
        <circle
          cx={20}
          cy={20}
          r={r}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        position: 'absolute', left: 0, right: 0, top: 10, textAlign: 'center',
        fontSize: 14, color, fontWeight: 700, pointerEvents: 'none'
      }}>
        {daysLeft}
      </span>
    </div>
  );
}

function FocusTimerModal({ open, onClose, task, onStart, onPause, onStop, running, elapsed }) {
  if (!open) return null;
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };
  const total = (task.timeRecords||[]).reduce((sum, r) => sum + (r.end && r.start ? Math.floor((r.end - r.start)/1000) : 0), 0) + (running ? elapsed : 0);
  return (
    <div style={{position:'fixed',left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div style={{background:'#fff',borderRadius:10,padding:32,minWidth:320,boxShadow:'0 4px 24px #0002'}}>
        <h3 style={{marginTop:0,marginBottom:16}}>专注计时：{task.text}</h3>
        <div style={{fontSize:32, fontWeight:700, marginBottom:16}}>{fmt(elapsed)}</div>
        <div style={{marginBottom:16, color:'#888'}}>累计用时：{fmt(total)}</div>
        <div>
          {running ? (
            <>
              <button onClick={onPause} style={{marginRight:8,background:'#fbbf24',color:'#fff',border:'none',borderRadius:4,padding:'6px 18px',fontWeight:600}}>暂停</button>
              <button onClick={onStop} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:4,padding:'6px 18px',fontWeight:600}}>结束</button>
            </>
          ) : (
            <button onClick={onStart} style={{background:'#22c55e',color:'#fff',border:'none',borderRadius:4,padding:'6px 18px',fontWeight:600}}>开始</button>
          )}
          <button onClick={onClose} style={{marginLeft:8,background:'#e5e7eb',color:'#374151',border:'none',borderRadius:4,padding:'6px 18px'}}>关闭</button>
        </div>
      </div>
    </div>
  );
}

export default function StyledTaskBoard({ user }) {
  const [tasks, setTasks] = useState({ q1: [], q2: [], q3: [], q4: [] });
  const [newTask, setNewTask] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [loading, setLoading] = useState(false);

  // 迁移弹窗和状态
  const [focusTimer, setFocusTimer] = useState({ open: false, quadrant: '', index: -1 });
  const [timerState, setTimerState] = useState({ running: false, start: null, elapsed: 0 });
  const timerRef = useRef();
  const [ddlEdit, setDDLEdit] = useState({ open: false, quadrant: '', index: -1 });
  const [ddlMode, setDDLMode] = useState('date');
  const [ddlDate, setDDLDate] = useState('');
  const [ddlDays, setDDLDays] = useState('');

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, quadrant: '', index: -1 });
  const handleContextMenu = (e, q, i) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, quadrant: q, index: i });
  };
  const closeContextMenu = () => setContextMenu({ open: false, x: 0, y: 0, quadrant: '', index: -1 });
  const handleDelete = async (q, i) => {
    const task = tasks[q][i];
    await updateTask(task.id, { deleted: true });
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].filter((_, idx) => idx !== i)
    }));
    setContextMenu({ open: false, x: 0, y: 0, quadrant: '', index: -1 });
  };

  // 计时相关逻辑
  const openTimer = (q, i) => {
    setFocusTimer({ open: true, quadrant: q, index: i });
    const task = tasks[q][i];
    const last = (task.timeRecords||[]).slice(-1)[0];
    if (last && !last.end) {
      setTimerState({ running: true, start: last.start, elapsed: Math.floor((Date.now() - last.start)/1000) });
      timerRef.current = setInterval(() => {
        setTimerState(s => ({ ...s, elapsed: Math.floor((Date.now() - s.start)/1000) }));
      }, 1000);
    } else {
      setTimerState({ running: false, start: null, elapsed: 0 });
    }
  };
  const startTimer = () => {
    setTimerState({ running: true, start: Date.now(), elapsed: 0 });
    timerRef.current = setInterval(() => {
      setTimerState(s => ({ ...s, elapsed: Math.floor((Date.now() - s.start)/1000) }));
    }, 1000);
    setTasks(prev => {
      const { quadrant, index } = focusTimer;
      return {
        ...prev,
        [quadrant]: prev[quadrant].map((task, i) =>
          i === index ? { ...task, timeRecords: [...(task.timeRecords||[]), { start: Date.now() }] } : task
        )
      };
    });
  };
  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setTimerState(s => ({ ...s, running: false }));
    setTasks(prev => {
      const { quadrant, index } = focusTimer;
      return {
        ...prev,
        [quadrant]: prev[quadrant].map((task, i) => {
          if (i !== index) return task;
          const recs = [...(task.timeRecords||[])];
          if (recs.length && !recs[recs.length-1].end) recs[recs.length-1].end = Date.now();
          return { ...task, timeRecords: recs };
        })
      };
    });
  };
  const stopTimer = async () => {
    clearInterval(timerRef.current);
    setTimerState({ running: false, start: null, elapsed: 0 });
    setTasks(prev => {
      const { quadrant, index } = focusTimer;
      const updated = prev[quadrant].map((task, i) => {
        if (i !== index) return task;
        const recs = [...(task.timeRecords||[])];
        if (recs.length && !recs[recs.length-1].end) recs[recs.length-1].end = Date.now();
        updateTask(task.id, { timeRecords: recs });
        return { ...task, timeRecords: recs };
      });
      return { ...prev, [quadrant]: updated };
    });
    setFocusTimer({ open: false, quadrant: '', index: -1 });
  };
  const closeTimer = () => {
    clearInterval(timerRef.current);
    setFocusTimer({ open: false, quadrant: '', index: -1 });
    setTimerState({ running: false, start: null, elapsed: 0 });
  };

  // DDL 编辑弹窗逻辑
  const openDDLDialog = (q, i) => {
    setDDLEdit({ open: true, quadrant: q, index: i });
    setDDLMode('date');
    setDDLDate('');
    setDDLDays('');
  };
  const saveDDL = () => {
    const { quadrant, index } = ddlEdit;
    if (ddlMode === 'date' && ddlDate) {
      setTasks(prev => ({
        ...prev,
        [quadrant]: prev[quadrant].map((task, i) =>
          i === index ? { ...task, ddlDate, daysToDDL: undefined } : task
        )
      }));
      updateTask(tasks[quadrant][index].id, { ddlDate, daysToDDL: undefined });
    } else if (ddlMode === 'days' && parseInt(ddlDays) > 0) {
      setTasks(prev => ({
        ...prev,
        [quadrant]: prev[quadrant].map((task, i) =>
          i === index ? { ...task, daysToDDL: parseInt(ddlDays), ddlDate: undefined } : task
        )
      }));
      updateTask(tasks[quadrant][index].id, { daysToDDL: parseInt(ddlDays), ddlDate: undefined });
    }
    setDDLEdit({ open: false, quadrant: '', index: -1 });
  };

  // 在StyledTaskBoard顶部加：
  const [quadrantLabels, setQuadrantLabels] = useState({
    q1: '重要且紧急',
    q2: '重要不紧急',
    q3: '不重要但紧急',
    q4: '不重要不紧急',
  });
  const [editing, setEditing] = useState(null);
  const [tempLabel, setTempLabel] = useState('');
  const startEdit = (q) => {
    setEditing(q);
    setTempLabel(quadrantLabels[q]);
  };
  const saveEdit = (q) => {
    setQuadrantLabels(prev => ({ ...prev, [q]: tempLabel }));
    setEditing(null);
  };

  // 在StyledTaskBoard顶部加：
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTasks(user.id).then(data => {
      const grouped = { q1: [], q2: [], q3: [], q4: [] };
      data.filter(t => !t.deleted).forEach(t => grouped[t.quadrant].push(t));
      setTasks(grouped);
      setLoading(false);
    });
  }, [user]);

  const handleAdd = async (q) => {
    if (!newTask[q].trim()) return;
    const task = await addTask(user.id, q, newTask[q]);
    setTasks(prev => ({ ...prev, [q]: [...prev[q], task] }));
    setNewTask(prev => ({ ...prev, [q]: '' }));
  };

  const handleComplete = async (q, i, checked) => {
    const task = tasks[q][i];
    await updateTask(task.id, { completed: checked });
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].map((t, j) => j === i ? { ...t, completed: checked } : t)
    }));
  };

  const handleProgressChange = (q, i, value) => {
    const task = tasks[q][i];
    setTasks(prev => ({
      ...prev,
      [q]: prev[q].map((t, j) => j === i ? { ...t, progress: value } : t)
    }));
    updateTask(task.id, { progress: value });
  };

  if (loading) return <div style={{ padding: 24 }}>加载中...</div>;

  // 1. 修复统计按钮点开没东西
  if (showStats) {
    const allTasks = Object.values(tasks).flat();
    window.tasks = allTasks; // 兼容Stats.jsx
    return <Stats user={user} onBack={() => setShowStats(false)} darkMode={false} />;
  }

  // 2. 统计按钮移到主面板右上角
  return (
    <>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 48 }} onClick={closeContextMenu}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>四象限任务面板</h1>
          <button
            onClick={() => setShowStats(true)}
            style={{
              background: '#60a5fa',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 2px 8px #60a5fa22'
            }}
          >
            统计
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {Object.keys(quadrantMeta).map(q => (
            <div key={q} style={{
              background: quadrantMeta[q].color,
              border: `2px solid ${quadrantMeta[q].border}`,
              borderRadius: 20,
              padding: 32,
              minHeight: 400,
            }}>
              <h3 style={{
                textAlign: 'center',
                fontSize: 18,
                color: quadrantMeta[q].headerColor,
                borderBottom: `2px solid ${quadrantMeta[q].headerColor}`,
                paddingBottom: 8,
                marginTop: -10,
                marginBottom: 20
              }} onClick={() => startEdit(q)}>
                {editing === q ? (
                  <input
                    value={tempLabel}
                    onChange={e => setTempLabel(e.target.value)}
                    onBlur={() => saveEdit(q)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(q)}
                    autoFocus
                    style={{fontSize:20, padding:6, borderRadius:8, border:'1px solid #ddd', width:'80%',textAlign:'center'}}
                  />
                ) : (
                  quadrantLabels[q]
                )}
                <span style={{ fontSize: 16, opacity: 0.7 }}>（{tasks[q].length}）</span>
              </h3>
              {tasks[q].map((t, i) => !t.deleted && !t.completed && (
                <div key={t.id} style={{ ...taskCardStyle, padding: '10px 15px', fontSize: 15, marginBottom: 12 }} onContextMenu={e => handleContextMenu(e, q, i)}>
                  <input type="checkbox" checked={t.completed} onChange={e => handleComplete(q, i, e.target.checked)} style={{ width: 15, height: 15 }} />
                  <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#999' : '#333', fontSize: 15}}>{t.text}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={t.progress || 0}
                    onChange={e => handleProgressChange(q, i, parseInt(e.target.value))}
                    style={{ width: 100, height: 10 }}
                  />
                  <DDLCircle
                    createdAt={t.createdAt}
                    ddlDate={t.ddlDate}
                    daysToDDL={t.daysToDDL}
                    onClick={() => openDDLDialog(q, i)}
                  />
                  <FaRegClock
                    color="#60a5fa"
                    style={{ cursor: 'pointer', fontSize: 22 }}
                    title="点击可计时"
                    onClick={() => openTimer(q, i)}
                  />
                  {/* 右键菜单删除 */}
                  {contextMenu.open && contextMenu.quadrant === q && contextMenu.index === i && (
                    <div style={{position:'fixed',left:contextMenu.x,top:contextMenu.y,background:'#fff',border:'1px solid #eee',borderRadius:8,boxShadow:'0 2px 2px #0002',zIndex:2000,padding:'8px 0',minWidth:60}}>
                      <div onClick={()=>handleDelete(q,i)} style={{padding:'10px 10px',cursor:'pointer',color:'#ef4444',fontWeight:600,fontSize:12}}>
                        删除任务
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', marginTop: 15, gap: 12 }}>
                <input
                  value={newTask[q]}
                  onChange={e => setNewTask(p => ({ ...p, [q]: e.target.value }))}
                placeholder="添加任务..."
                onKeyDown={e => e.key === 'Enter' && handleAdd(q)}
                style={{ ...inputStyle, fontSize: 15, padding: '10px 14px' }}
              />
              <button onClick={() => handleAdd(q)} style={{ background: '#60a5fa', border: 'none', padding: '10px 16px', borderRadius: 10 }}>
                <FaPlus color="#fff" size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* 统计页集成真实任务timeRecords数据 */}
      {/* 在StyledTaskBoard顶部引入Stats并加： */}
      {/* 计时浮窗 */}
      {focusTimer.open && (
        <FocusTimerModal
          open={focusTimer.open}
          onClose={closeTimer}
          task={tasks[focusTimer.quadrant][focusTimer.index]}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          running={timerState.running}
          elapsed={timerState.elapsed}
        />
      )}
      {/* DDL 编辑弹窗 */}
      {ddlEdit.open && (
        <div style={{position:'fixed',left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:10,padding:32,minWidth:320,boxShadow:'0 4px 24px #0002'}}>
            <h3 style={{marginTop:0,marginBottom:16}}>设置截止日期</h3>
            <div style={{marginBottom:16,display:'flex',gap:16}}>
              <label>
                <input type="radio" checked={ddlMode==='date'} onChange={()=>setDDLMode('date')} /> 选择日期
              </label>
              <label>
                <input type="radio" checked={ddlMode==='days'} onChange={()=>setDDLMode('days')} /> 剩余天数
              </label>
            </div>
            {ddlMode === 'date' ? (
              <input
                type="date"
                value={ddlDate}
                onChange={e=>setDDLDate(e.target.value)}
                style={{width:'100%',padding:8,borderRadius:4,border:'1px solid #ddd',marginBottom:16}}
              />
            ) : (
              <input
                type="number"
                min={1}
                value={ddlDays}
                onChange={e=>setDDLDays(e.target.value)}
                style={{width:'100%',padding:8,borderRadius:4,border:'1px solid #ddd',marginBottom:16}}
                placeholder="请输入剩余天数"
              />
            )}
            <button onClick={saveDDL} style={{marginRight:8,background:'#60a5fa',color:'#fff',border:'none',borderRadius:4,padding:'6px 18px',fontWeight:600}}>确定</button>
            <button onClick={()=>setDDLEdit({ open: false, quadrant: '', index: -1 })} style={{background:'#e5e7eb',color:'#374151',border:'none',borderRadius:4,padding:'6px 18px'}}>取消</button>
          </div>
        </div>
      )}
    </div>
    <footer style={{
      width: '100%',
      marginTop: 20,
      padding: '18px 0 12px 0',
      background: 'linear-gradient(90deg, #f5f6ff 0%, #fff 100%)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 12,
      color: '#888',
    //fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
      fontFamily: 'monospace',
      letterSpacing: 0.2
    }}>
     <span style={{marginLeft:20, fontSize: 8}}>V 1.0.1.</span>
      <span style={{marginRight: 1000}}>Copyright © 2025 Yiyang Liu.</span>
      <span style={{marginRight: 300}}>Made with ❤️ in Toronto</span>
    </footer>
  </>
);
}
