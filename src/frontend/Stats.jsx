import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8', '#facc15'];

export default function Stats({ user, onBack, darkMode }) {
  const [mode, setMode] = useState('week'); // 'week' or 'day'
  const allTasks = window.tasks || [];
  // 统计区间
  const now = new Date();
  let days = mode === 'week' ? 7 : 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (mode === 'week' ? now.getDay() : 0));
  // X轴标签
  const dayLabels = mode === 'day'
    ? [{ day: 'Today' }]
    : ['S','M','T','W','T','F','S'].map((d, i) => ({ day: d }));
  // 任务名
  const taskNames = allTasks.map(t => t.text);
  // 构造堆叠数据
  const chartData = dayLabels.map((label, i) => {
    const obj = { day: label.day };
    allTasks.forEach((t, idx) => {
      obj[t.text] = 0;
      (t.timeRecords||[]).forEach(r => {
        if (r.start && r.end) {
          const d = new Date(r.start);
          if (mode === 'week') {
            const idxDay = d.getDay();
            if (idxDay === i) obj[t.text] += (r.end - r.start)/1000/60;
          } else {
            if (d.toDateString() === now.toDateString()) obj[t.text] += (r.end - r.start)/1000/60;
          }
        }
      });
    });
    return obj;
  });
  // 只显示有用时的任务
  const filteredTaskNames = taskNames.filter(name =>
    chartData.some(day => day[name] && day[name] > 0)
  );
  // 总专注时长
  function getTaskTime(task) {
    let total = 0;
    (task.timeRecords||[]).forEach(r => {
      if (r.start && r.end) {
        const d = new Date(r.start);
        if (mode === 'week') {
          if (d >= start && d <= now) total += (r.end - r.start)/1000/60;
        } else {
          if (d.toDateString() === now.toDateString()) total += (r.end - r.start)/1000/60;
        }
      }
    });
    return total;
  }
  const totalMinutes = allTasks.reduce((sum, t) => sum + getTaskTime(t), 0);
  // 支持自定义象限标题
  const defaultQuadrantLabels = {
    q1: '重要且紧急',
    q2: '重要不紧急',
    q3: '不重要但紧急',
    q4: '不重要不紧急',
  };
  const quadrantLabels = (window.quadrantLabels || defaultQuadrantLabels);
  const quadrantColors = {
    q1: '#fecaca',
    q2: '#fde68a',
    q3: '#6ee7b7',
    q4: '#7dd3fc',
  };
  const tasksByQuadrant = { q1: [], q2: [], q3: [], q4: [] };
  (allTasks || []).forEach(t => {
    if (tasksByQuadrant[t.quadrant]) tasksByQuadrant[t.quadrant].push(t);
  });
  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: 48,
      background: '#f8fafc',
      borderRadius: 24,
      boxShadow: '0 4px 24px #0001',
      minHeight: '80vh',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#222', marginBottom: 2 }}>
            {totalMinutes >= 60 ? (totalMinutes/60).toFixed(1)+'h' : Math.round(totalMinutes)+'min'}
          </div>
          <div style={{ fontSize: 16, color: '#888', fontWeight: 500 }}>Usage</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={()=>setMode('day')} style={{background:mode==='day'?'#60a5fa':'#e5e7eb',color:mode==='day'?'#fff':'#374151',border:'none',borderRadius:8,padding:'6px 24px',fontWeight:600,fontSize:15,boxShadow:mode==='day'?'0 2px 8px #60a5fa22':'none',cursor:'pointer'}}>Today</button>
          <button onClick={()=>setMode('week')} style={{background:mode==='week'?'#60a5fa':'#e5e7eb',color:mode==='week'?'#fff':'#374151',border:'none',borderRadius:8,padding:'6px 24px',fontWeight:600,fontSize:15,boxShadow:mode==='week'?'0 2px 8px #60a5fa22':'none',cursor:'pointer'}}>This Week</button>
        </div>
        <button onClick={onBack} style={{
          background: '#e0e7ef', color: '#374151', border: 'none', borderRadius: 12, padding: '8px 28px', fontWeight: 600, fontSize: 16, boxShadow: '0 2px 8px #e0e7ef22', cursor: 'pointer', transition: 'box-shadow 0.2s',
        }} onMouseOver={e => e.currentTarget.style.boxShadow='0 4px 16px #60a5fa33'} onMouseOut={e => e.currentTarget.style.boxShadow='0 2px 8px #e0e7ef22'}>返回</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: 32, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" />
            <YAxis
              tickFormatter={v => v >= 60 ? (v/60)+'h' : v+'m'}
              domain={[0, 240]}
              ticks={[0, 60, 120, 180, 240]}
              orientation="right"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Legend />
            {filteredTaskNames.map((name, idx) => (
              <Bar key={name} dataKey={name} stackId="a" fill={COLORS[idx % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{textAlign: 'center', color: '#888', marginTop: 8, fontSize: 14}}>单位：分钟</div>
      {/* 四象限任务列表 */}
      <div style={{ display: 'flex', gap: 24, marginTop: 32, justifyContent: 'space-between' }}>
        {['q1','q2','q3','q4'].map(q => (
          <div key={q} style={{ flex: 1, background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: 24, minWidth: 180, position: 'relative' }}>
            {/* 左上角小圆块，颜色和主面板一致 */}
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: quadrantColors[q], position: 'absolute', left: 18, top: 18 }} />
            {/* 标题可选：如不想显示象限名字可注释下一行 */}
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12, color: '#2563eb', letterSpacing: 1, marginLeft: 28 }}>{quadrantLabels[q]}</div>
            {(tasksByQuadrant[q].length === 0) && <div style={{ color: '#bbb', fontSize: 14, textAlign: 'center' }}>暂无任务</div>}
            {tasksByQuadrant[q].map(t => {
              const min = getTaskTime(t);
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 15 }}>
                  <span style={{ color: '#374151', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{min > 0 ? min.toFixed(1) : '0'} min</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
} 