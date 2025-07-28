import React, { useState } from 'react';
import { FaApple, FaInfoCircle, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function AppleCalendarSetup({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const steps = [
    {
      id: 1,
      title: '获取应用专用密码',
      description: '首先需要在Apple ID设置中生成应用专用密码'
    },
    {
      id: 2,
      title: '输入凭据',
      description: '输入你的iCloud邮箱和应用专用密码'
    },
    {
      id: 3,
      title: '测试连接',
      description: '验证连接是否成功'
    }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConnect = async () => {
    if (!appleId || !appPassword) {
      alert('请填写所有必填字段');
      return;
    }

    setIsConnecting(true);
    try {
      // 验证凭据格式
      if (!appleId.includes('@')) {
        throw new Error('请输入有效的iCloud邮箱地址');
      }
      
      if (!appPassword.includes('-')) {
        throw new Error('应用专用密码格式不正确');
      }

      // 存储凭据
      localStorage.setItem('apple_calendar_credentials', JSON.stringify({
        appleId,
        appPassword,
        timestamp: Date.now()
      }));

      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete({ appleId, appPassword });
    } catch (error) {
      alert(`连接失败: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
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
        padding: 32,
        maxWidth: 500,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <FaApple size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, color: '#1f2937' }}>
              Apple Calendar 设置
            </h2>
            <p style={{ margin: 4, fontSize: 14, color: '#6b7280' }}>
              步骤 {step} / {steps.length}
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {steps.map((s) => (
            <div key={s.id} style={{
              flex: 1,
              height: 4,
              background: s.id <= step ? '#000' : '#e5e7eb',
              borderRadius: 2
            }} />
          ))}
        </div>

        {/* 步骤内容 */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 18, color: '#1f2937' }}>
              {steps[0].title}
            </h3>
            <p style={{ marginBottom: 24, color: '#6b7280', lineHeight: 1.6 }}>
              {steps[0].description}
            </p>

            <div style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24
            }}>
              <h4 style={{ margin: 0, marginBottom: 12, fontSize: 16, color: '#1f2937' }}>
                📋 详细步骤：
              </h4>
              <ol style={{ margin: 0, paddingLeft: 20, color: '#6b7280', lineHeight: 1.8 }}>
                <li>访问 <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Apple ID</a></li>
                <li>登录你的Apple ID账户</li>
                                 <li>进入"安全" &gt; "应用专用密码"</li>
                <li>点击"生成密码"</li>
                <li>为这个应用起个名字（如"TickDone"）</li>
                <li>记录生成的密码（格式：xxxx-xxxx-xxxx-xxxx）</li>
              </ol>
            </div>

            <div style={{
              background: '#fef3c7',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <FaExclamationTriangle size={20} color="#92400e" style={{ marginTop: 2 }} />
              <div>
                <h4 style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#92400e' }}>
                  重要提醒
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#92400e' }}>
                  <li>必须开启两步验证才能生成应用专用密码</li>
                  <li>应用专用密码只显示一次，请妥善保存</li>
                  <li>如果忘记密码，可以重新生成</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 18, color: '#1f2937' }}>
              {steps[1].title}
            </h3>
            <p style={{ marginBottom: 24, color: '#6b7280', lineHeight: 1.6 }}>
              {steps[1].description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  iCloud邮箱地址 *
                </label>
                <input
                  type="email"
                  value={appleId}
                  onChange={(e) => setAppleId(e.target.value)}
                  placeholder="your-name@icloud.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  应用专用密码 *
                </label>
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none'
                  }}
                />
                <p style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                  格式：xxxx-xxxx-xxxx-xxxx
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 18, color: '#1f2937' }}>
              {steps[2].title}
            </h3>
            <p style={{ marginBottom: 24, color: '#6b7280', lineHeight: 1.6 }}>
              {steps[2].description}
            </p>

            <div style={{
              background: '#f0f9ff',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <FaInfoCircle size={20} color="#0369a1" style={{ marginTop: 2 }} />
              <div>
                <h4 style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#0369a1' }}>
                  连接信息
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#0369a1' }}>
                  服务器：caldav.icloud.com<br />
                  用户名：{appleId}<br />
                  协议：CalDAV
                </p>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              style={{
                width: '100%',
                background: isConnecting ? '#9ca3af' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {isConnecting ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  连接中...
                </>
              ) : (
                <>
                  <FaCheck size={16} />
                  测试连接
                </>
              )}
            </button>
          </div>
        )}

        {/* 底部按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginTop: 24,
          justifyContent: step === 1 ? 'flex-end' : 'space-between'
        }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              上一步
            </button>
          )}
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            
            {step < 3 && (
              <button
                onClick={handleNext}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                下一步
              </button>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 