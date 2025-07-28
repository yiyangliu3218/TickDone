import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthForm from './frontend/AuthForm';
import TaskBoard from './frontend/TaskBoard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // eslint-disable-next-line no-unused-vars
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px'
        }}>
          <h2>出现错误</h2>
          <p>应用遇到了问题，请刷新页面重试。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
      setError(error.message);
    }
  };

  if (error) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px'
      }}>
        <h2>连接错误</h2>
        <p>错误信息: {error}</p>
        <button onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <AuthForm onAuth={(user) => setUser(user)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {/* 顶部用户信息栏 */}
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                {user.email}
              </div>
             
            </div>
          </div>

          {/* 登出按钮 */}
          <button 
            onClick={handleLogout}
            style={{
              background: '#60a5fa',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.background = '#60a5fa'}
          >
            登出
          </button>
        </div>

        {/* 主应用内容 */}
        <TaskBoard user={user} />
      </div>
    </ErrorBoundary>
  );
}