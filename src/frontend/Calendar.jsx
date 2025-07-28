import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';

export default function Calendar({ tasks, onDateClick, onTaskClick, onAddTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 获取当前月份的第一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // 获取日历开始日期（包括上个月的日期）
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  // 生成日历网格
  const calendarDays = [];
  const currentDay = new Date(startDate);
  
  for (let i = 0; i < 42; i++) { // 6周 x 7天
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // 获取指定日期的任务
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const allTasks = Object.values(tasks).flat();
    
    return allTasks.filter(task => {
      if (task.ddlDate) {
        return task.ddlDate === dateStr;
      }
      if (task.daysToDDL && task.createdAt) {
        const start = new Date(task.createdAt);
        const end = new Date(start.getTime() + task.daysToDDL * 86400000);
        return end.toISOString().split('T')[0] === dateStr;
      }
      return false;
    });
  };

  // 获取任务颜色
  const getTaskColor = (task) => {
    if (task.completed) return '#9ca3af';
    if (task.quadrant === 'q1') return '#ef4444'; // 重要且紧急 - 红色
    if (task.quadrant === 'q2') return '#f59e42'; // 重要不紧急 - 橙色
    if (task.quadrant === 'q3') return '#3b82f6'; // 不重要但紧急 - 蓝色
    if (task.quadrant === 'q4') return '#22c55e'; // 不重要不紧急 - 绿色
    return '#6b7280';
  };

  // 格式化日期
  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // 检查是否是今天
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 检查是否是当前月份
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 上个月
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 下个月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 点击日期
  const handleDateClick = (date) => {
    setSelectedDate(date);
    onDateClick(date);
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 16, 
      padding: 24, 
      boxShadow: '0 2px 12px #0001',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      {/* 日历头部 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 24 
      }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#1f2937' }}>
          {formatDate(currentDate)}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={prevMonth}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaChevronLeft size={16} color="#6b7280" />
          </button>
          <button
            onClick={nextMonth}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaChevronRight size={16} color="#6b7280" />
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: 1,
        marginBottom: 8
      }}>
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} style={{
            padding: '12px',
            textAlign: 'center',
            fontWeight: 600,
            color: '#6b7280',
            fontSize: 14
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: 1,
        background: '#f3f4f6',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        {calendarDays.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                background: isSelected ? '#dbeafe' : '#fff',
                minHeight: 120,
                padding: '8px',
                cursor: 'pointer',
                border: isTodayDate ? '2px solid #3b82f6' : 'none',
                borderRadius: isTodayDate ? 4 : 0,
                opacity: isCurrentMonthDay ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = '#fff';
              }}
            >
              {/* 日期数字 */}
              <div style={{
                fontSize: 14,
                fontWeight: isTodayDate ? 700 : 500,
                color: isTodayDate ? '#3b82f6' : '#374151',
                marginBottom: 4
              }}>
                {date.getDate()}
              </div>

              {/* 任务列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                 {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    style={{
                      background: getTaskColor(task),
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      opacity: task.completed ? 0.6 : 1
                    }}
                    title={task.text}
                  >
                    {task.text}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{
                    color: '#6b7280',
                    fontSize: 11,
                    textAlign: 'center'
                  }}>
                    +{dayTasks.length - 3} 更多
                  </div>
                )}
              </div>

              {/* 添加任务按钮 */}
              {isCurrentMonthDay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask(date);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    background: '#60a5fa',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <FaPlus size={10} color="#fff" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginTop: 16, 
        padding: '16px',
        background: '#f9fafb',
        borderRadius: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }}></div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>重要且紧急</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#f59e42', borderRadius: 2 }}></div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>重要不紧急</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: 2 }}></div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>不重要但紧急</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2 }}></div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>不重要不紧急</span>
        </div>
      </div>
    </div>
  );
} 