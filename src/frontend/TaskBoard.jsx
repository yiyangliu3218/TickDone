import React, { useEffect, useState, useRef } from 'react';
import { getTasks, addTask, updateTask, removeTask } from '../backend/taskApi';
import { FaPlus, FaRegClock } from 'react-icons/fa';
import Calendar from './Calendar';
import CalendarIntegration from './CalendarIntegration';
import Stats from './Stats';
import Footer from './Footer';

// 四象限元数据定义
const quadrantMeta = {
  q1: { title: '重要且紧急', color: '#fef2f2', border: '#fecaca', headerColor: '#b91c1c' },
  q2: { title: '重要不紧急', color: '#fefce8', border: '#fde68a', headerColor: '#92400e' },
  q3: { title: '不重要但紧急', color: '#ecfdf5', border: '#6ee7b7', headerColor: '#047857' },
  q4: { title: '不重要不紧急', color: '#f0f9ff', border: '#7dd3fc', headerColor: '#0369a1' },
};

// 样式常量
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

// DDL圆圈组件
function DDLCircle({ createdAt, ddlDate, daysToDDL, onClick }) {
  if (!ddlDate && !daysToDDL) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#6b7280',
          background: '#f9fafb',
          position: 'relative',
          zIndex: 2
        }}
        title="设置截止日期"
      >
        -
      </div>
    );
  }

  const now = new Date();
  const startDate = createdAt ? new Date(createdAt) : now;
  const endDate = ddlDate ? new Date(ddlDate) : new Date(startDate.getTime() + (daysToDDL || 0) * 24 * 60 * 60 * 1000);
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const progress = Math.max(0, Math.min(1, (totalDays - daysLeft) / totalDays));
  
  // 颜色判断：1天红色，3天黄色，7天蓝色，其他绿色
  let color = '#10b981'; // 默认绿色
  if (daysLeft <= 0) color = '#ef4444'; // 过期红色
  else if (daysLeft <= 1) color = '#ef4444'; // 1天红色
  else if (daysLeft <= 3) color = '#f59e0b'; // 3天黄色
  else if (daysLeft <= 7) color = '#3b82f6'; // 7天蓝色
  
  return (
    <div 
      onClick={onClick}
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '10px',
        color: color,
        fontWeight: 'bold',
        position: 'relative',
        zIndex: 2
      }}
      title={`剩余${daysLeft}天`}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '50%',
        background: `conic-gradient(${color} ${progress * 360}deg, transparent ${progress * 360}deg)`,
        opacity: 0.2
      }} />
      <span style={{ zIndex: 1 }}>{daysLeft}</span>
    </div>
  );
}

// 专注计时器模态框
function FocusTimerModal({ open, onClose, task, onStart, onPause, onStop, running, elapsed }) {
  if (!open) return null;

  const fmt = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>专注计时器</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>{task?.text}</p>
        
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '24px 0',
          fontFamily: 'monospace'
        }}>
          {fmt(elapsed)}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {!running ? (
            <button
              onClick={onStart}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              开始
            </button>
          ) : (
            <button
              onClick={onPause}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              暂停
            </button>
          )}
          
          <button
            onClick={onStop}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            停止
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
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

export default function StyledTaskBoard({ user }) {
  const [tasks, setTasks] = useState({ q1: [], q2: [], q3: [], q4: [] });
  const [newTask, setNewTask] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState('quadrant');
  const [quadrantLabels, setQuadrantLabels] = useState({
    q1: '重要且紧急',
    q2: '重要不紧急',
    q3: '不重要但紧急',
    q4: '不重要不紧急',
  });
  const [editing, setEditing] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [tempTaskText, setTempTaskText] = useState('');
  const [originalTaskText, setOriginalTaskText] = useState('');
  const [tempLabel, setTempLabel] = useState('');
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, quadrant: '', index: -1 });
  const [showCompleted, setShowCompleted] = useState({ q1: false, q2: false, q3: false, q4: false });
  const [completedVisibility, setCompletedVisibility] = useState({ q1: false, q2: false, q3: false, q4: false });
  const [listShowCompleted, setListShowCompleted] = useState(false);
  const [editingQuadrantTitle, setEditingQuadrantTitle] = useState(null);
  const [tempQuadrantTitle, setTempQuadrantTitle] = useState('');
  const [ddlModal, setDDLModal] = useState({ open: false, quadrant: '', index: -1 });
  
  // 列表任务编辑状态
  const [editingListTask, setEditingListTask] = useState(null);
  const [tempListTaskText, setTempListTaskText] = useState('');

  // 计时器相关状态
  const [focusTimer, setFocusTimer] = useState({ open: false, quadrant: '', index: -1 });
  const [timerState, setTimerState] = useState({ running: false, start: null, elapsed: 0 });
  const timerRef = useRef();

  // DDL编辑状态
  const [ddlEdit, setDDLEdit] = useState({ open: false, quadrant: '', index: -1 });
  const [ddlMode, setDDLMode] = useState('date');
  const [ddlDate, setDDLDate] = useState('');
  const [ddlDays, setDDLDays] = useState('');

  // 撤销功能状态
  const [deletedHistory, setDeletedHistory] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTasks(user.id).then(data => {
      const grouped = { q1: [], q2: [], q3: [], q4: [] };
      data.filter(t => !t.deleted).forEach(t => grouped[t.quadrant].push(t));
      setTasks(grouped);
      setLoading(false);
    }).catch(error => {
      console.error('加载任务失败:', error);
      setLoading(false);
    });
  }, [user]);

  const handleAdd = async (q) => {
    if (!newTask[q].trim()) return;
    try {
      const task = await addTask(user.id, q, newTask[q]);
      setTasks(prev => ({ ...prev, [q]: [...prev[q], task] }));
      setNewTask(prev => ({ ...prev, [q]: '' }));
    } catch (error) {
      console.error('添加任务失败:', error);
    }
  };

  const handleComplete = async (q, i, checked) => {
    try {
      const task = tasks[q][i];
      if (checked) {
        // 保存到撤销历史
        setCompletedHistory(prev => [...prev, { task, quadrant: q, index: i, timestamp: Date.now() }]);
      }
      const updatedTasks = [...tasks[q]];
      updatedTasks[i] = { ...updatedTasks[i], completed: checked };
      setTasks(prev => ({ ...prev, [q]: updatedTasks }));
      await updateTask(task.id, { completed: checked });
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleProgressChange = (q, i, value) => {
    const updatedTasks = [...tasks[q]];
    updatedTasks[i] = { ...updatedTasks[i], progress: parseInt(value) };
    setTasks(prev => ({ ...prev, [q]: updatedTasks }));
    updateTask(updatedTasks[i].id, { progress: parseInt(value) });
  };

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

  // 右键菜单关闭
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleCompletedVisibility = (q) => {
    setCompletedVisibility(prev => ({ ...prev, [q]: !prev[q] }));
  };

  // 四象限显示/隐藏功能
  const [quadrantShowCompleted, setQuadrantShowCompleted] = useState({ q1: false, q2: false, q3: false, q4: false });

  const getAllTasks = () => {
    return Object.values(tasks).flat();
  };

  // 统计未完成未删除任务数
  const getActiveCount = q => tasks[q].filter(t => !t.completed && !t.deleted).length;
  
  // 统计已完成任务数
  const getCompletedCount = q => tasks[q].filter(t => t.completed && !t.deleted).length;

  // 任务名称编辑函数
  const handleTaskNameEdit = async (q, i, newText) => {
    if (newText.trim()) {
      const task = tasks[q][i];
      await updateTask(task.id, { text: newText.trim() });
      setTasks(prev => ({
        ...prev,
        [q]: prev[q].map((t, j) => j === i ? { ...t, text: newText.trim() } : t)
      }));
    }
  };

  // 四象限标题编辑函数
  const startEdit = (q) => {
    setEditing(q);
    setTempLabel(quadrantLabels[q]);
  };

  const saveEdit = (q) => {
    setQuadrantLabels(prev => ({ ...prev, [q]: tempLabel }));
    setEditing(null);
  };

  // 计时器相关逻辑
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

  // 任务编辑相关
  const startEditTask = (q, i) => {
    setEditingTask(`${q}-${i}`);
    setTempTaskText(tasks[q][i].text);
    setOriginalTaskText(tasks[q][i].text);
  };

  const saveEditTask = async (q, i) => {
    if (tempTaskText.trim()) {
      const task = tasks[q][i];
      await updateTask(task.id, { text: tempTaskText.trim() });
      setTasks(prev => ({
        ...prev,
        [q]: prev[q].map((t, j) => j === i ? { ...t, text: tempTaskText.trim() } : t)
      }));
    }
    setEditingTask(null);
    setTempTaskText('');
  };

  // 列表任务编辑相关
  const startEditListTask = (taskId) => {
    setEditingListTask(taskId);
    const task = getAllTasks().find(t => t.id === taskId);
    setTempListTaskText(task ? task.text : '');
  };

  const saveEditListTask = async (taskId) => {
    if (tempListTaskText.trim()) {
      const task = getAllTasks().find(t => t.id === taskId);
      if (task) {
        await updateTask(task.id, { text: tempListTaskText.trim() });
        setTasks(prev => ({
          ...prev,
          [task.quadrant]: prev[task.quadrant].map((t, j) => 
            t.id === taskId ? { ...t, text: tempListTaskText.trim() } : t
          )
        }));
      }
    }
    setEditingListTask(null);
    setTempListTaskText('');
  };

  const startEditQuadrantTitle = (q) => {
    setEditingQuadrantTitle(q);
    setTempQuadrantTitle(quadrantLabels[q]);
  };

  const saveEditQuadrantTitle = (q) => {
    if (tempQuadrantTitle.trim() === '') return;
    setQuadrantLabels(prev => ({ ...prev, [q]: tempQuadrantTitle.trim() }));
    setEditingQuadrantTitle(null);
    setTempQuadrantTitle('');
  };

  const handleContextMenu = (e, q, i) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, quadrant: q, index: i });
  };

  const closeContextMenu = () => {
    setContextMenu({ open: false, x: 0, y: 0, quadrant: '', index: -1 });
  };

  const openDDLModal = (q, i) => {
    const task = tasks[q][i];
    setDDLModal({ open: true, quadrant: q, index: i });
    setDDLDate(task.ddlDate || '');
    setDDLDays(task.daysToDDL || '');
  };

  const closeDDLModal = () => {
    setDDLModal({ open: false, quadrant: '', index: -1 });
    setDDLDate('');
    setDDLDays('');
  };

  const saveDDL = async () => {
    const { quadrant, index } = ddlModal;
    const task = tasks[quadrant][index];
    
    try {
      const updates = {};
      if (ddlMode === 'date' && ddlDate) {
        updates.ddlDate = ddlDate;
        updates.daysToDDL = null;
      } else if (ddlMode === 'days' && ddlDays) {
        updates.daysToDDL = parseInt(ddlDays);
        updates.ddlDate = null;
      }
      
      await updateTask(task.id, updates);
      setTasks(prev => ({
        ...prev,
        [quadrant]: prev[quadrant].map((t, j) => j === index ? { ...t, ...updates } : t)
      }));
      closeDDLModal();
    } catch (error) {
      console.error('更新DDL失败:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (viewMode === 'stats') {
    return (
      <>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              margin: 0,
              color: '#1f2937'
            }}>统计</h1>
            <div style={{ 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setViewMode('quadrant')}
                style={{
                  background: viewMode === 'quadrant' ? '#60a5fa' : '#e5e7eb',
                  color: viewMode === 'quadrant' ? '#fff' : '#374151',
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
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? '#60a5fa' : '#e5e7eb',
                  color: viewMode === 'list' ? '#fff' : '#374151',
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
                onClick={() => setViewMode('calendar')}
                style={{
                  background: viewMode === 'calendar' ? '#60a5fa' : '#e5e7eb',
                  color: viewMode === 'calendar' ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                日历
              </button>
              <button
                onClick={() => setViewMode('integration')}
                style={{
                  background: viewMode === 'integration' ? '#60a5fa' : '#e5e7eb',
                  color: viewMode === 'integration' ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                集成
              </button>
              <button
                onClick={() => setViewMode('stats')}
                style={{
                  background: viewMode === 'stats' ? '#60a5fa' : '#e5e7eb',
                  color: viewMode === 'stats' ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                统计
              </button>
            </div>
          </div>
          
          <Stats user={user} onBack={() => setShowStats(false)} darkMode={false} />
        </div>
        <Footer />
      </>
    );
  }

  // 四象限视图
  if (viewMode === 'quadrant') {
    return (
      <>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ 
              fontSize: 24, 
              margin: 0, 
              fontWeight: 600,
              color: '#1f2937',
              letterSpacing: '0.5px'
            }}>任务面板(面板标题可以自定义)</h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setViewMode('quadrant')} style={{ background: viewMode==='quadrant' ? '#60a5fa' : '#e5e7eb', color: viewMode==='quadrant' ? '#fff' : '#374151', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15 }}>四象限</button>
              <button onClick={() => setViewMode('list')} style={{ background: viewMode==='list' ? '#60a5fa' : '#e5e7eb', color: viewMode==='list' ? '#fff' : '#374151', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15 }}>列表</button>
              <button onClick={() => setViewMode('calendar')} style={{ background: viewMode==='calendar' ? '#60a5fa' : '#e5e7eb', color: viewMode==='calendar' ? '#fff' : '#374151', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15 }}>日历</button>
              <button onClick={() => setViewMode('integration')} style={{ background: viewMode==='integration' ? '#60a5fa' : '#e5e7eb', color: viewMode==='integration' ? '#fff' : '#374151', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15 }}>集成</button>
              <button onClick={() => setViewMode('stats')} style={{ background: viewMode==='stats' ? '#60a5fa' : '#e5e7eb', color: viewMode==='stats' ? '#fff' : '#374151', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15 }}>统计</button>
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
                position: 'relative',
                boxShadow: '0 4px 24px #0001'
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
                }} onDoubleClick={() => startEdit(q)}>
                  {editing === q ? (
                    <input
                      value={tempLabel}
                      onChange={e => setTempLabel(e.target.value)}
                      onBlur={() => saveEdit(q)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(q);
                        if ((e.ctrlKey || e.metaKey) && e.key === 'z') setTempLabel(quadrantLabels[q]);
                      }}
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
                {/* 未完成任务卡片 */}
                {tasks[q].map((t, i) => !t.deleted && !t.completed && (
                  <div key={t.id} style={{ ...taskCardStyle, padding: '10px 15px', fontSize: 15, marginBottom: 12 }} onContextMenu={e => handleContextMenu(e, q, i)}>
                    <input type="checkbox" checked={t.completed} onChange={e => handleComplete(q, i, e.target.checked)} style={{ width: 15, height: 15 }} />
                    <span
                      onDoubleClick={() => {
                        setEditing(`${q}-${i}`);
                        setTempLabel(t.text);
                      }}
                      style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#999' : '#333', fontSize: 15, cursor: 'pointer'}}
                    >
                      {editing === `${q}-${i}` ? (
                        <input
                          value={tempLabel}
                          onChange={e => setTempLabel(e.target.value)}
                          onBlur={() => { setEditing(null); setTempLabel(''); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleTaskNameEdit(q, i, tempLabel);
                              setEditing(null);
                            }
                            if ((e.ctrlKey || e.metaKey) && e.key === 'z') setTempLabel(t.text);
                          }}
                          autoFocus
                          style={{fontSize:15, padding:4, borderRadius:6, border:'1px solid #ddd', width:'80%'}}
                        />
                      ) : t.text}
                    </span>
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
                      onClick={() => openDDLModal(q, i)}
                    />
                    <FaRegClock
                      color="#60a5fa"
                      style={{ cursor: 'pointer', fontSize: 22 }}
                      title="点击可计时"
                      onClick={() => openTimer(q, i)}
                    />
                  </div>
                ))}
                {/* 添加任务输入框 */}
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
        </div>
        <Footer />
        <FocusTimerModal
          open={focusTimer.open}
          onClose={closeTimer}
          task={focusTimer.open ? tasks[focusTimer.quadrant]?.[focusTimer.index] : null}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          running={timerState.running}
          elapsed={timerState.elapsed}
        />
        {/* DDL编辑模态框 */}
        {ddlModal.open && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>
                设置截止日期
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ddlMode"
                      value="date"
                      checked={ddlMode === 'date'}
                      onChange={(e) => setDDLMode(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>选择日期</span>
                  </label>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ddlMode"
                      value="days"
                      checked={ddlMode === 'days'}
                      onChange={(e) => setDDLMode(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>剩余天数</span>
                  </label>
                </div>
              </div>

              {ddlMode === 'date' ? (
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="date"
                    value={ddlDate}
                    onChange={(e) => setDDLDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="number"
                    value={ddlDays}
                    onChange={(e) => setDDLDays(e.target.value)}
                    placeholder="输入天数"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeDDLModal}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={saveDDL}
                  style={{
                    background: '#60a5fa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 右键菜单 */}
        {contextMenu.open && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '120px'
            }}
          >
            <button
              onClick={() => {
                handleDelete(contextMenu.quadrant, contextMenu.index);
                closeContextMenu();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ef4444'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              删除任务
            </button>
          </div>
        )}
      </>
    );
  }

  // 列表视图
  if (viewMode === 'list') {
    const allTasks = getAllTasks();
    const completedTasks = allTasks.filter(task => task.completed);
    const pendingTasks = allTasks.filter(task => !task.completed);

    return (
      <>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              margin: 0,
              color: '#1f2937'
            }}>任务列表</h1>
            <div style={{ 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
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
                onClick={() => setViewMode('list')}
                style={{
                  background: '#60a5fa',
                  color: '#fff',
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
                onClick={() => setViewMode('calendar')}
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
                日历
              </button>
              <button
                onClick={() => setViewMode('integration')}
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
                集成
              </button>
              <button
                onClick={() => setViewMode('stats')}
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
                统计
              </button>
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            {/* 标题栏 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                进行中的任务 ({pendingTasks.length})
              </h2>
              <button
                onClick={() => setListShowCompleted(!listShowCompleted)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                {listShowCompleted ? '隐藏' : '显示'}
              </button>
            </div>

            {/* 已完成任务区域 */}
            {completedTasks.length > 0 && listShowCompleted && (
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {completedTasks.length} Completed
              </div>
            )}

            {/* 已完成任务列表 */}
            {listShowCompleted && completedTasks.map((task, index) => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderBottom: '1px solid #f3f4f6',
                opacity: 0.7,
                background: '#f9fafb'
              }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleComplete(q, i, e.target.checked);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span 
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: '#6b7280',
                    textDecoration: 'line-through',
                    cursor: 'pointer'
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditListTask(task.id);
                  }}
                >
                  {editingListTask === task.id ? (
                    <input
                      value={tempListTaskText}
                      onChange={(e) => setTempListTaskText(e.target.value)}
                      onBlur={() => saveEditListTask(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEditListTask(task.id);
                        } else if (e.key === 'Escape') {
                          setEditingListTask(null);
                          setTempListTaskText('');
                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                          e.preventDefault();
                          setTempListTaskText(task.text);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        border: '1px solid #60a5fa',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                        textDecoration: 'none'
                      }}
                      autoFocus
                    />
                  ) : (
                    task.text
                  )}
                </span>
                <button
                  onClick={() => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleComplete(q, i, false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                  title="恢复任务"
                >
                  恢复
                </button>
                <button
                  onClick={() => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleDelete(q, i);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                  title="删除任务"
                >
                  删除
                </button>
              </div>
            ))}

            {/* 待完成任务列表 */}
            {pendingTasks.map((task, index) => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleComplete(q, i, e.target.checked);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span 
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: '#1f2937',
                    cursor: 'pointer'
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditListTask(task.id);
                  }}
                >
                  {editingListTask === task.id ? (
                    <input
                      value={tempListTaskText}
                      onChange={(e) => setTempListTaskText(e.target.value)}
                      onBlur={() => saveEditListTask(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEditListTask(task.id);
                        } else if (e.key === 'Escape') {
                          setEditingListTask(null);
                          setTempListTaskText('');
                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                          e.preventDefault();
                          setTempListTaskText(task.text);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        border: '1px solid #60a5fa',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                  ) : (
                    task.text
                  )}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={task.progress || 0}
                  onChange={(e) => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleProgressChange(q, i, e.target.value);
                  }}
                  style={{
                    width: '100px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <DDLCircle
                    createdAt={task.createdAt}
                    ddlDate={task.ddlDate}
                    daysToDDL={task.daysToDDL}
                    onClick={(e) => {
                      e.stopPropagation();
                      const q = task.quadrant;
                      const i = tasks[q].findIndex(t => t.id === task.id);
                      openDDLModal(q, i);
                    }}
                  />
                </div>
                <FaRegClock
                  style={{
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    openTimer(q, i);
                  }}
                />
                <button
                  onClick={() => {
                    const q = task.quadrant;
                    const i = tasks[q].findIndex(t => t.id === task.id);
                    handleDelete(q, i);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                  title="删除任务"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
        <Footer />
        <FocusTimerModal
          open={focusTimer.open}
          onClose={closeTimer}
          task={focusTimer.open ? tasks[focusTimer.quadrant]?.[focusTimer.index] : null}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          running={timerState.running}
          elapsed={timerState.elapsed}
        />
      </>
    );
  }

  // 日历视图
  if (viewMode === 'calendar') {
    return (
      <>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              margin: 0,
              color: '#1f2937'
            }}>日历</h1>
            <div style={{ 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
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
                onClick={() => setViewMode('calendar')}
                style={{
                  background: '#60a5fa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                日历
              </button>
              <button
                onClick={() => setViewMode('integration')}
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
                集成
              </button>
              <button
                onClick={() => setViewMode('stats')}
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
                统计
              </button>
            </div>
          </div>
          
          <Calendar 
            tasks={getAllTasks()}
          />
        </div>
        <Footer />
      </>
    );
  }

  // 集成视图
  if (viewMode === 'integration') {
    return (
      <>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '20px',
          minHeight: '100vh'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              margin: 0,
              color: '#1f2937'
            }}>日历集成</h1>
            <div style={{ 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
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
                onClick={() => setViewMode('calendar')}
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
                日历
              </button>
              <button
                onClick={() => setViewMode('integration')}
                style={{
                  background: '#60a5fa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                集成
              </button>
              <button
                onClick={() => setViewMode('stats')}
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
                统计
              </button>
            </div>
          </div>
          
          <CalendarIntegration user={user} />
        </div>
        <Footer />
      </>
    );
  }

  return null;
}
 