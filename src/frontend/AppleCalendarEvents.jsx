import React, { useState } from 'react';
import { FaPlus, FaCalendar, FaClock, FaCheck } from 'react-icons/fa';

export default function AppleCalendarEvents({ events, onAddToTasks, onClose }) {
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const handleEventSelect = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleAddSelectedToTasks = async () => {
    if (selectedEvents.size === 0) {
      alert('请选择要添加的事件');
      return;
    }

    setIsAdding(true);
    try {
      const selectedEventObjects = events.filter(event => selectedEvents.has(event.id));
      await onAddToTasks(selectedEventObjects);
      onClose();
    } catch (error) {
      console.error('添加事件到任务失败:', error);
      alert('添加失败: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <FaCalendar size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>
                Apple Calendar 事件
              </h2>
              <p style={{ margin: 4, fontSize: 14, color: '#6b7280' }}>
                选择要添加到任务列表的事件
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* 事件列表 */}
        <div style={{ marginBottom: 24 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <FaCalendar size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>没有找到Apple Calendar事件</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    border: selectedEvents.has(event.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    background: selectedEvents.has(event.id) ? '#f0f9ff' : '#fff',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleEventSelect(event.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => handleEventSelect(event.id)}
                      style={{ marginTop: 2 }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, color: '#1f2937' }}>
                        {event.summary}
                      </h3>
                      {event.description && (
                        <p style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#6b7280' }}>
                          {event.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
                        <FaClock size={12} />
                        <span>
                          {formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}
                        </span>
                      </div>
                    </div>
                    {selectedEvents.has(event.id) && (
                      <FaCheck size={16} color="#3b82f6" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleAddSelectedToTasks}
            disabled={selectedEvents.size === 0 || isAdding}
            style={{
              background: selectedEvents.size === 0 || isAdding ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              cursor: selectedEvents.size === 0 || isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaPlus size={14} />
            {isAdding ? '添加中...' : `添加 ${selectedEvents.size} 个事件到任务`}
          </button>
        </div>
      </div>
    </div>
  );
} 