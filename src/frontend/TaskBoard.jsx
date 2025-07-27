import React, { useEffect, useState, useRef } from 'react';
import { getTasks, addTask, updateTask, removeTask } from '../backend/taskApi';
import { FaPlus, FaRegClock } from 'react-icons/fa';
import Stats from './Stats';
import Footer from './Footer';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

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
  
  // 撤销功能状态
  const [deletedHistory, setDeletedHistory] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);

  const handleContextMenu = (e, q, i) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, quadrant: q, index: i });
  };
  const closeContextMenu = () => setContextMenu({ open: false, x: 0, y: 0, quadrant: '', index: -1 });

  // 删除任务（直接删除，支持撤销）
  const handleDelete = async (q, i) => {
    const task = tasks[q][i];
    try {
      // 保存到撤销历史
      setDeletedHistory(prev => [...prev, { task, quadrant: q, index: i, timestamp: Date.now() }]);
      await removeTask(task.id);
      setTasks(prev => {
        const arr = [...prev[q]];
        arr.splice(i, 1);
        return { ...prev, [q]: arr };
      });
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  // 撤销删除
  const undoDelete = async () => {
    if (deletedHistory.length === 0) return;
    const lastDeleted = deletedHistory[deletedHistory.length - 1];
    try {
      const restoredTask = await addTask(user.id, lastDeleted.quadrant, lastDeleted.task.text);
      setTasks(prev => ({
        ...prev,
        [lastDeleted.quadrant]: [...prev[lastDeleted.quadrant], { ...restoredTask, ...lastDeleted.task }]
      }));
      setDeletedHistory(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('撤销删除失败:', error);
    }
  };

  // 撤销完成
  const undoComplete = async () => {
    if (completedHistory.length === 0) return;
    const lastCompleted = completedHistory[completedHistory.length - 1];
    try {
      await updateTask(lastCompleted.task.id, { completed: false });
      setTasks(prev => ({
        ...prev,
        [lastCompleted.quadrant]: prev[lastCompleted.quadrant].map((t, i) => 
          i === lastCompleted.index ? { ...t, completed: false } : t
        )
      }));
      setCompletedHistory(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('撤销完成失败:', error);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          undoComplete();
        } else {
          undoDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletedHistory, completedHistory]);

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
  const [completedVisibility, setCompletedVisibility] = useState({ q1: false, q2: false, q3: false, q4: false });
  const [viewMode, setViewMode] = useState('quadrant'); // 'quadrant' or 'list'

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
    if (checked) {
      // 保存到撤销历史
      setCompletedHistory(prev => [...prev, { task, quadrant: q, index: i, timestamp: Date.now() }]);
    }
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

  // 统计未完成未删除任务数
  const getActiveCount = q => tasks[q].filter(t => !t.completed && !t.deleted).length;
  
  // 统计已完成任务数
  const getCompletedCount = q => tasks[q].filter(t => t.completed && !t.deleted).length;

  // 切换已完成任务显示状态
  const toggleCompletedVisibility = (q) => {
    setCompletedVisibility(prev => ({ ...prev, [q]: !prev[q] }));
  };

  // 获取所有任务（用于列表视图）
  const getAllTasks = () => {
    const allTasks = [];
    Object.keys(tasks).forEach(q => {
      tasks[q].forEach(task => {
        if (!task.deleted) {
          allTasks.push({ ...task, quadrant: q });
        }
      });
    });
    return allTasks;
  };

  if (loading) return <div style={{ padding: 24 }}>加载中...</div>;

  // 1. 修复统计按钮点开没东西
  if (showStats) {
    const allTasks = Object.values(tasks).flat();
    window.tasks = allTasks; // 兼容Stats.jsx
    return <Stats user={user} onBack={() => setShowStats(false)} darkMode={false} />;
  }

  // 列表视图
  if (viewMode === 'list') {
    const allTasks = getAllTasks();
    const activeTasks = allTasks.filter(t => !t.completed);
    const completedTasks = allTasks.filter(t => t.completed);
    
    return (
      <>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, margin: 0 }}>任务列表</h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setViewMode('quadrant')}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                四象限
              </button>
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
          </div>

          {/* 任务统计 */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px #0001', minWidth: 120 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{activeTasks.length}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>进行中</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px #0001', minWidth: 120 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{completedTasks.length}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>已完成</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px #0001', minWidth: 120 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{allTasks.length}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>总计</div>
            </div>
          </div>

          {/* 进行中的任务 */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px #0001' }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, color: '#1f2937' }}>进行中的任务</h2>
            {activeTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无进行中的任务</div>
            ) : (
              activeTasks.map((task, index) => (
                <div key={task.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 0',
                  borderBottom: index < activeTasks.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={(e) => handleComplete(task.quadrant, tasks[task.quadrant].findIndex(t => t.id === task.id), e.target.checked)}
                    style={{ marginRight: 12, width: 18, height: 18 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, color: '#374151', marginBottom: 4 }}>{task.text}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {quadrantLabels[task.quadrant]} • 进度: {task.progress || 0}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DDLCircle
                      createdAt={task.createdAt}
                      ddlDate={task.ddlDate}
                      daysToDDL={task.daysToDDL}
                      onClick={() => {
                        const taskIndex = tasks[task.quadrant].findIndex(t => t.id === task.id);
                        openDDLDialog(task.quadrant, taskIndex);
                      }}
                    />
                    <FaRegClock
                      color="#60a5fa"
                      style={{ cursor: 'pointer', fontSize: 18 }}
                      title="点击可计时"
                      onClick={() => {
                        const taskIndex = tasks[task.quadrant].findIndex(t => t.id === task.id);
                        openTimer(task.quadrant, taskIndex);
                      }}
                    />
                    <button
                      onClick={async () => {
                        const taskIndex = tasks[task.quadrant].findIndex(t => t.id === task.id);
                        await handleDelete(task.quadrant, taskIndex);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '4px 8px',
                        borderRadius: 4
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 已完成的任务 */}
          {completedTasks.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px #0001' }}>
              <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, color: '#1f2937' }}>已完成的任务</h2>
              {completedTasks.map((task, index) => (
                <div key={task.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 0',
                  borderBottom: index < completedTasks.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={(e) => handleComplete(task.quadrant, tasks[task.quadrant].findIndex(t => t.id === task.id), e.target.checked)}
                    style={{ marginRight: 12, width: 18, height: 18 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>{task.text}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {quadrantLabels[task.quadrant]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        const taskIndex = tasks[task.quadrant].findIndex(t => t.id === task.id);
                        handleComplete(task.quadrant, taskIndex, false);
                      }}
                      style={{
                        background: '#e0e7ef',
                        color: '#2563eb',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      恢复
                    </button>
                    <button
                      onClick={async () => {
                        const taskIndex = tasks[task.quadrant].findIndex(t => t.id === task.id);
                        await handleDelete(task.quadrant, taskIndex);
                      }}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
        <Footer />
      </>
    );
  }

  // 2. 统计按钮移到主面板右上角
  return (
    <>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 48 }} onClick={closeContextMenu}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>任务面板(面板标题可以自定义)</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 15
              }}
            >
              列表
            </button>
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
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {Object.keys(quadrantMeta).map(q => (
            <div key={q} style={{
              background: quadrantMeta[q].color,
              border: `2px solid ${quadrantMeta[q].border}`,
              borderRadius: 20,
              padding: 32,
              minHeight: 400,
              position: 'relative'
            }}>
              <h3 style={{
                textAlign: 'center',
                fontSize: 18,
                color: quadrantMeta[q].headerColor,
                borderBottom: `2px solid ${quadrantMeta[q].headerColor}`,
                paddingBottom: 8,
                marginTop: -10,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
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
                <span style={{ fontSize: 16, opacity: 0.7 }}>（{getActiveCount(q)}）</span>
              </h3>
              
              {/* Show/Hide按钮 - 放在面板右侧 */}
              <button 
                onClick={() => toggleCompletedVisibility(q)}
                style={{ 
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'none', 
                  border: 'none', 
                  color: '#495057', 
                  cursor: 'pointer', 
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {completedVisibility[q] ? 'Hide' : 'Show'}
              </button>
              
              {/* 已完成任务列表 - 根据显示状态切换 */}
              {completedVisibility[q] && (
                <div style={{ 
                  background: '#f8f9fa', 
                  borderRadius: 8, 
                  marginBottom: 16,
                  padding: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 8,
                    fontSize: 14,
                    color: '#6c757d'
                  }}>
                    <span>{getCompletedCount(q)} Completed</span>
                  </div>
                  {tasks[q].filter(t => t.completed && !t.deleted).length === 0 && (
                    <div style={{ color: '#adb5bd', fontSize: 13, textAlign: 'center', padding: '8px' }}>
                      暂无已完成任务
                    </div>
                  )}
                  {tasks[q].map((t, i) => t.completed && !t.deleted && (
                    <div key={i} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '6px 8px',
                      marginBottom: 4,
                      background: '#fff',
                      borderRadius: 4,
                      fontSize: 14
                    }}>
                      <span style={{ color: '#6c757d', textDecoration: 'line-through' }}>{t.text}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          onClick={() => handleComplete(q, i, false)}
                          style={{ 
                            background: '#e0e7ef', 
                            color: '#2563eb', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '2px 6px', 
                            fontSize: 12, 
                            cursor: 'pointer' 
                          }}
                        >
                          恢复
                        </button>
                        <button 
                          onClick={async () => { await handleDelete(q, i); }}
                          style={{ 
                            background: '#fee2e2', 
                            color: '#b91c1c', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '2px 6px', 
                            fontSize: 12, 
                            cursor: 'pointer' 
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
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
                      <div onClick={async ()=>{await handleDelete(q,i);closeContextMenu();}} style={{padding:'10px 10px',cursor:'pointer',color:'#ef4444',fontWeight:600,fontSize:12}}>
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
    {/* 页脚 */}
    <Footer />
  </>
);
}
