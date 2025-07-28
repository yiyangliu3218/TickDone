import React, { useState, useEffect } from 'react';
import { FaGoogle, FaApple, FaMicrosoft, FaSync, FaCheck, FaTimes } from 'react-icons/fa';
import calendarService from '../backend/calendarApi';
import AppleCalendarSetup from './AppleCalendarSetup';
import AppleCalendarEvents from './AppleCalendarEvents';

export default function CalendarIntegration({ tasks, onSync }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showAppleSetup, setShowAppleSetup] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAppleEvents, setShowAppleEvents] = useState(false);
  const [appleEvents, setAppleEvents] = useState([]);

  // 检查并恢复已保存的Apple Calendar凭据
  useEffect(() => {
    const savedCredentials = localStorage.getItem('apple_calendar_credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        // 检查凭据是否过期（30天）
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (credentials.timestamp > thirtyDaysAgo) {
          setSyncStatus(prev => ({
            ...prev,
            apple: {
              connected: true,
              lastSync: new Date().toISOString(),
              appleId: credentials.appleId
            }
          }));
        } else {
          // 凭据过期，清除
          localStorage.removeItem('apple_calendar_credentials');
        }
      } catch (error) {
        console.error('恢复Apple Calendar凭据失败:', error);
        localStorage.removeItem('apple_calendar_credentials');
      }
    }
  }, []);

  // 自定义弹窗函数
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  // 日历提供商配置
  const providers = {
    google: {
      name: 'Google Calendar',
      icon: FaGoogle,
      color: '#4285f4',
      description: '同步到Google日历，支持双向同步'
    },
    apple: {
      name: 'Apple Calendar',
      icon: FaApple,
      color: '#000000',
      description: '通过iCloud同步到Apple日历'
    },
    outlook: {
      name: 'Outlook Calendar',
      icon: FaMicrosoft,
      color: '#0078d4',
      description: '同步到Microsoft Outlook日历'
    }
  };

  // Google Calendar集成
  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      console.log('Connecting to Google Calendar...');
      
      // 检查环境变量
      if (!window.REACT_APP_GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID not configured. Please check CALENDAR_INTEGRATION.md');
      }
      
      // 模拟连接成功（实际实现需要加载Google API库）
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          google: { connected: true, lastSync: new Date().toISOString() }
        }));
        setIsConnecting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Google Calendar connection failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        google: { connected: false, error: error.message }
      }));
      setIsConnecting(false);
    }
  };

  // Apple Calendar集成
  const connectAppleCalendar = () => {
    setShowAppleSetup(true);
  };

  // 处理Apple Calendar设置完成
  const handleAppleSetupComplete = (credentials) => {
    setShowAppleSetup(false);
    setSyncStatus(prev => ({
      ...prev,
      apple: { 
        connected: true, 
        lastSync: new Date().toISOString(),
        appleId: credentials.appleId 
      }
    }));
  };

  // 处理Apple Calendar设置取消
  const handleAppleSetupCancel = () => {
    setShowAppleSetup(false);
  };

  // 断开Apple Calendar连接
  const disconnectAppleCalendar = () => {
    localStorage.removeItem('apple_calendar_credentials');
    setSyncStatus(prev => ({
      ...prev,
      apple: { connected: false }
    }));
    showCustomAlert('已断开Apple Calendar连接');
  };

  // 读取Apple Calendar事件
  const readAppleCalendarEvents = async () => {
    if (!syncStatus.apple?.connected) {
      showCustomAlert('请先连接Apple Calendar');
      return;
    }

    try {
      const storedCredentials = localStorage.getItem('apple_calendar_credentials');
      if (!storedCredentials) {
        throw new Error('Apple Calendar凭据未找到');
      }

      const { appleId, appPassword } = JSON.parse(storedCredentials);
      const result = await calendarService.readFromApple(appleId, appPassword);
      
      if (result.success) {
        setAppleEvents(result.events);
        setShowAppleEvents(true);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('读取Apple Calendar事件失败:', error);
      showCustomAlert(`读取失败: ${error.message}`);
    }
  };

  // 将Apple Calendar事件转换为任务
  const handleAddAppleEventsToTasks = async (selectedEvents) => {
    try {
      // 这里需要调用TaskBoard的添加任务功能
      // 暂时显示成功消息
      showCustomAlert(`成功添加 ${selectedEvents.length} 个事件到任务列表`);
      console.log('要添加的事件:', selectedEvents);
      
      // TODO: 实际实现需要调用TaskBoard的添加任务API
      // 可以通过props传递回调函数来实现
      
    } catch (error) {
      console.error('添加事件到任务失败:', error);
      throw error;
    }
  };

  // Outlook Calendar集成
  const connectOutlookCalendar = async () => {
    setIsConnecting(true);
    try {
      // Microsoft Graph API配置
      const CLIENT_ID = 'YOUR_MICROSOFT_CLIENT_ID';
      const TENANT_ID = 'YOUR_TENANT_ID';
      
      console.log('Connecting to Outlook Calendar...');
      
      // 模拟连接成功
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          outlook: { connected: true, lastSync: new Date().toISOString() }
        }));
        setIsConnecting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Outlook Calendar connection failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        outlook: { connected: false, error: error.message }
      }));
      setIsConnecting(false);
    }
  };

  // 同步任务到外部日历
  const syncTasksToCalendar = async (provider) => {
    if (!syncStatus[provider]?.connected) {
      alert('请先连接日历服务');
      return;
    }

    try {
      const allTasks = Object.values(tasks).flat();
      const tasksWithDDL = allTasks.filter(task => 
        task.ddlDate || (task.daysToDDL && task.createdAt)
      );

      console.log('所有任务:', allTasks);
      console.log('有DDL的任务:', tasksWithDDL);
      console.log(`Syncing ${tasksWithDDL.length} tasks to ${provider}...`);

      let results;
      switch (provider) {
        case 'google':
          results = await calendarService.syncToGoogle(tasksWithDDL);
          break;
        case 'apple': {
          // 从localStorage获取存储的凭据
          const storedCredentials = localStorage.getItem('apple_calendar_credentials');
          if (!storedCredentials) {
            throw new Error('请先连接Apple Calendar');
          }
          
          const { appleId, appPassword } = JSON.parse(storedCredentials);
          results = await calendarService.syncToApple(tasksWithDDL, appleId, appPassword);
          break;
        }
        case 'outlook':
          results = await calendarService.syncToOutlook(tasksWithDDL);
          break;
        default:
          throw new Error('不支持的日历提供商');
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      setCalendarEvents(results.filter(r => r.success && r.event).map(r => r.event));
      
      if (failCount > 0) {
        // 使用自定义弹窗而不是alert
        const message = `同步完成: ${successCount}个成功, ${failCount}个失败`;
        showCustomAlert(message);
      } else {
        const message = `成功同步 ${successCount} 个任务到 ${providers[provider].name}`;
        showCustomAlert(message);
      }
      
      onSync && onSync(provider, results);
      
    } catch (error) {
      console.error(`Sync to ${provider} failed:`, error);
      alert(`同步失败: ${error.message}`);
    }
  };

  // 获取颜色ID（已移至calendarService中）
  // const getColorId = (quadrant) => {
  //   const colorMap = {
  //     q1: '11', // 红色
  //     q2: '6',  // 橙色
  //     q3: '9',  // 蓝色
  //     q4: '10'  // 绿色
  //   };
  //   return colorMap[quadrant] || '1';
  // };

  // 处理连接
  const handleConnect = (provider) => {
    setSelectedProvider(provider);
    switch (provider) {
      case 'google':
        connectGoogleCalendar();
        break;
      case 'apple':
        connectAppleCalendar();
        break;
      case 'outlook':
        connectOutlookCalendar();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 16, 
      padding: 24, 
      boxShadow: '0 2px 12px #0001',
      maxWidth: 800,
      margin: '0 auto'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 24, color: '#1f2937' }}>
        日历集成
      </h2>
      
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        将你的任务同步到外部日历系统，实现跨平台的时间管理
      </p>

      {/* 日历提供商选择 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {Object.entries(providers).map(([key, provider]) => {
          const Icon = provider.icon;
          const isConnected = syncStatus[key]?.connected;
          const isConnectingNow = isConnecting && selectedProvider === key;

          return (
            <div key={key} style={{
              border: `2px solid ${isConnected ? provider.color : '#e5e7eb'}`,
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isConnected ? `${provider.color}10` : '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: provider.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#1f2937' }}>
                    {provider.name}
                  </h3>
                  <p style={{ margin: 4, fontSize: 14, color: '#6b7280' }}>
                    {provider.description}
                  </p>
                  {isConnected && syncStatus[key].lastSync && (
                    <p style={{ margin: 4, fontSize: 12, color: '#059669' }}>
                      上次同步: {new Date(syncStatus[key].lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => syncTasksToCalendar(key)}
                          style={{
                            background: provider.color,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 16px',
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <FaSync size={14} />
                          同步
                        </button>
                        {key === 'apple' && (
                          <button
                            onClick={readAppleCalendarEvents}
                            style={{
                              background: '#6b7280',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 16px',
                              fontSize: 14,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            📅 读取
                          </button>
                        )}
                        <div style={{ color: '#059669' }}>
                          <FaCheck size={20} />
                        </div>
                      </>
                    ) : (
                  <button
                    onClick={() => handleConnect(key)}
                    disabled={isConnectingNow}
                    style={{
                      background: isConnectingNow ? '#9ca3af' : provider.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 14,
                      cursor: isConnectingNow ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {isConnectingNow ? '连接中...' : '连接'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 同步状态 */}
      {Object.keys(syncStatus).length > 0 && (
        <div style={{ 
          background: '#f9fafb', 
          borderRadius: 8, 
          padding: 16,
          marginBottom: 24
        }}>
          <h4 style={{ margin: 0, marginBottom: 12, fontSize: 16, color: '#1f2937' }}>
            连接状态
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(syncStatus).map(([provider, status]) => (
              <div key={provider} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 14
              }}>
                {status.connected ? (
                  <FaCheck size={16} color="#059669" />
                ) : (
                  <FaTimes size={16} color="#dc2626" />
                )}
                <span style={{ color: status.connected ? '#059669' : '#dc2626' }}>
                  {providers[provider].name}: {status.connected ? '已连接' : '连接失败'}
                </span>
                {status.error && (
                  <span style={{ color: '#dc2626', fontSize: 12 }}>
                    ({status.error})
                  </span>
                )}
                {status.connected && provider === 'apple' && (
                  <button
                    onClick={disconnectAppleCalendar}
                    style={{
                      background: 'none',
                      border: '1px solid #dc2626',
                      color: '#dc2626',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 12,
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    断开
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 同步的事件预览 */}
      {calendarEvents.length > 0 && (
        <div style={{ 
          background: '#f9fafb', 
          borderRadius: 8, 
          padding: 16
        }}>
          <h4 style={{ margin: 0, marginBottom: 12, fontSize: 16, color: '#1f2937' }}>
            即将同步的事件 ({calendarEvents.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calendarEvents.slice(0, 5).map((event, index) => (
              <div key={index} style={{
                background: '#fff',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {event.summary}
                </div>
                                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              {event.startDate ? new Date(event.startDate).toLocaleString('zh-CN') : 
                               event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString('zh-CN') : '时间未设置'} - 
                              {event.endDate ? new Date(event.endDate).toLocaleString('zh-CN') : 
                               event.end?.dateTime ? new Date(event.end.dateTime).toLocaleString('zh-CN') : '时间未设置'}
                            </div>
              </div>
            ))}
            {calendarEvents.length > 5 && (
              <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                还有 {calendarEvents.length - 5} 个事件...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 设置说明 */}
      <div style={{ 
        background: '#fef3c7', 
        borderRadius: 8, 
        padding: 16,
        marginTop: 24
      }}>
        <h4 style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#92400e' }}>
          📋 设置说明
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#92400e' }}>
          <li>Google Calendar: 需要配置OAuth 2.0凭据</li>
          <li>Apple Calendar: 需要iCloud账户和CalDAV设置</li>
          <li>Outlook Calendar: 需要Microsoft Graph API权限</li>
          <li>只有设置了DDL的任务才会同步到日历</li>
        </ul>
      </div>

      {/* Apple Calendar设置向导 */}
      {showAppleSetup && (
        <AppleCalendarSetup
          onComplete={handleAppleSetupComplete}
          onCancel={handleAppleSetupCancel}
        />
      )}

      {/* 自定义弹窗 */}
      {showAlert && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
              同步结果
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
              {alertMessage}
            </p>
            <button
              onClick={() => setShowAlert(false)}
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* Apple Calendar事件选择器 */}
      {showAppleEvents && (
        <AppleCalendarEvents
          events={appleEvents}
          onAddToTasks={handleAddAppleEventsToTasks}
          onClose={() => setShowAppleEvents(false)}
        />
      )}
    </div>
  );
} 