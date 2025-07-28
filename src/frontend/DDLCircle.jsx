import React from 'react';

export default function DDLCircle({ createdAt, ddlDate, daysToDDL, onClick }) {
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
    <div 
      onClick={onClick} 
      title={`剩余${daysLeft}天`} 
      style={{ 
        cursor: 'pointer', 
        position: 'relative', 
        width: 40, 
        height: 40 
      }}
    >
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle 
          cx={20} 
          cy={20} 
          r={r} 
          stroke="#eee" 
          strokeWidth={4} 
          fill="none" 
        />
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
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: 10, 
        textAlign: 'center',
        fontSize: 14, 
        color, 
        fontWeight: 700, 
        pointerEvents: 'none'
      }}>
        {daysLeft}
      </span>
    </div>
  );
} 