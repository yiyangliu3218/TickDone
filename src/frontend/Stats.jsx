import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Footer from './Footer';

export default function Stats({ tasks: tasksProp }) {
  const [mode, setMode] = useState('week'); // 'week' or 'day'
  // 优先使用传入的 tasks prop，否则使用 window.tasks
  const allTasks = tasksProp || window.tasks || [];
  // 统计区间
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (mode === 'week' ? now.getDay() : 0));
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
  // 总专注时长（根据mode计算）
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
  
  // 按象限分组任务
  const tasksByQuadrant = { q1: [], q2: [], q3: [], q4: [] };
  (allTasks || []).forEach(t => {
    if (tasksByQuadrant[t.quadrant]) tasksByQuadrant[t.quadrant].push(t);
  });
  
  // X轴标签：周日到周一
  const dayLabels = mode === 'day'
    ? [{ day: 'Today', dayIndex: now.getDay() }]
    : ['S','M','T','W','T','F','S'].map((d, i) => ({ day: d, dayIndex: i }));
  
  // 构造按天和象限分组的数据
  const chartData = dayLabels.map((label) => {
    const obj = { day: label.day, dayIndex: label.dayIndex };
    
    // 为每个象限计算当天的时长
    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
      const quadrantKey = `quadrant_${q}`;
      obj[quadrantKey] = 0;
      
      const tasks = tasksByQuadrant[q] || [];
      tasks.forEach(t => {
        (t.timeRecords||[]).forEach(r => {
          if (r.start && r.end) {
            const d = new Date(r.start);
            if (mode === 'week') {
              const idxDay = d.getDay();
              if (idxDay === label.dayIndex) {
                obj[quadrantKey] += (r.end - r.start)/1000/60;
              }
            } else {
              if (d.toDateString() === now.toDateString()) {
                obj[quadrantKey] += (r.end - r.start)/1000/60;
              }
            }
          }
        });
      });
    });
    
    return obj;
  });
  
  // 自定义Tooltip，显示象限内的任务列表
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      const dayTasks = {};
      
      // 收集当天所有象限的任务，聚合同一任务的多个记录
      ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        const tasks = tasksByQuadrant[q] || [];
        const taskTimeMap = {}; // 用map来聚合同一任务的多个记录
        
        tasks.forEach(t => {
          (t.timeRecords||[]).forEach(r => {
            if (r.start && r.end) {
              const d = new Date(r.start);
              let shouldInclude = false;
              
              if (mode === 'week') {
                if (d.getDay() === dayData.dayIndex) shouldInclude = true;
              } else {
                if (d.toDateString() === now.toDateString()) shouldInclude = true;
              }
              
              if (shouldInclude) {
                const time = (r.end - r.start)/1000/60;
                if (time > 0) {
                  // 聚合同一任务的多个记录
                  if (!taskTimeMap[t.text]) {
                    taskTimeMap[t.text] = 0;
                  }
                  taskTimeMap[t.text] += time;
                }
              }
            }
          });
        });
        
        // 转换为数组，每个任务显示总时长
        const dayTaskList = Object.entries(taskTimeMap).map(([name, time]) => ({
          name,
          time
        }));
        
        if (dayTaskList.length > 0) {
          dayTasks[q] = {
            label: quadrantLabels[q],
            color: quadrantColors[q],
            tasks: dayTaskList,
            total: dayTaskList.reduce((sum, t) => sum + t.time, 0)
          };
        }
      });
      
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minWidth: '200px'
        }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '12px',
            color: '#1f2937',
            fontSize: '14px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '8px'
          }}>
            {label}
          </div>
          {Object.keys(dayTasks).length > 0 ? (
            Object.values(dayTasks).map((quadrant, idx) => (
              <div key={idx} style={{ marginBottom: idx < Object.keys(dayTasks).length - 1 ? '12px' : '0' }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '6px',
                  color: quadrant.color,
                  fontSize: '13px'
                }}>
                  {quadrant.label}: {quadrant.total >= 60 ? (quadrant.total/60).toFixed(1)+'h' : quadrant.total.toFixed(1)+'min'}
                </div>
                <div style={{ paddingLeft: '8px' }}>
                  {quadrant.tasks.map((task, taskIdx) => (
                    <div key={taskIdx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#374151', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.name}
                      </span>
                      <span style={{ color: '#60a5fa', fontWeight: 600, marginLeft: '8px' }}>
                        {task.time.toFixed(1)}min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>暂无任务</div>
          )}
        </div>
      );
    }
    return null;
  };
  return (
    <>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 48,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column'
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
      </div>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: 32, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 14, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => v >= 60 ? (v/60).toFixed(1)+'h' : v.toFixed(0)+'m'}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quadrant_q1" stackId="a" fill={quadrantColors.q1} radius={[0, 0, 0, 0]} />
            <Bar dataKey="quadrant_q2" stackId="a" fill={quadrantColors.q2} radius={[0, 0, 0, 0]} />
            <Bar dataKey="quadrant_q3" stackId="a" fill={quadrantColors.q3} radius={[0, 0, 0, 0]} />
            <Bar dataKey="quadrant_q4" stackId="a" fill={quadrantColors.q4} radius={[8, 8, 0, 0]} />
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
            {(() => {
              // 过滤出有时长的任务
              const tasksWithTime = tasksByQuadrant[q].filter(t => {
                const min = getTaskTime(t);
                return min > 0;
              });
              
              if (tasksWithTime.length === 0) {
                return <div style={{ color: '#bbb', fontSize: 14, textAlign: 'center' }}>暂无任务</div>;
              }
              
              return tasksWithTime.map(t => {
                const min = getTaskTime(t);
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 15 }}>
                    <span style={{ color: '#374151', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{min.toFixed(1)} min</span>
                  </div>
                );
              });
            })()}
          </div>
        ))}
      </div>
      <Footer />
    </div>
    </>
  );
} 