import { useState } from 'react';
import { supabase } from '../supabaseClient';

const emailProviders = [
  { name: 'Gmail', url: 'https://mail.google.com/' },
  { name: 'Outlook', url: 'https://outlook.live.com/' },
  { name: 'QQ邮箱', url: 'https://mail.qq.com/' },
  { name: '163邮箱', url: 'https://mail.163.com/' },
  { name: 'Yahoo', url: 'https://mail.yahoo.com/' },
];

export default function AuthForm({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuth(data.user);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setEmailSent(true);
    }
  };

  if (emailSent && !isLogin) {
    return (
      <div style={{maxWidth:340,margin:'80px auto',background:'#fff',padding:32,borderRadius:12,boxShadow:'0 2px 12px #0001'}}>
        <h2 style={{textAlign:'center',marginBottom:24}}>注册成功</h2>
        <div style={{color:'#2563eb',marginBottom:8}}>已发送验证邮件，请前往邮箱查收并激活账号。</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          {emailProviders.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{color:'#2563eb',fontSize:13}}>{p.name}</a>
          ))}
        </div>
        <div style={{color:'#888',fontSize:13}}>未收到邮件？请检查垃圾箱或稍等片刻。</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{maxWidth:340,margin:'80px auto',background:'#fff',padding:32,borderRadius:12,boxShadow:'0 2px 12px #0001'}}>
      <h2 style={{textAlign:'center',marginBottom:24}}>{isLogin ? '登录' : '注册'}</h2>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱" required style={{width:'100%',marginBottom:16,padding:10,borderRadius:6,border:'1px solid #ddd'}} />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" required style={{width:'100%',marginBottom:16,padding:10,borderRadius:6,border:'1px solid #ddd'}} />
      {error && <div style={{color:'#ef4444',marginBottom:12}}>{error}</div>}
      <button type="submit" style={{width:'100%',background:'#60a5fa',color:'#fff',border:'none',borderRadius:6,padding:12,fontWeight:600}}>{isLogin ? '登录' : '注册'}</button>
      <div style={{marginTop:16,textAlign:'center'}}>
        <span style={{color:'#888',fontSize:13}}>{isLogin ? '没有账号？' : '已有账号？'}</span>
        <button type="button" onClick={()=>setIsLogin(v=>!v)} style={{background:'none',border:'none',color:'#2563eb',marginLeft:8,cursor:'pointer',fontSize:13}}>{isLogin ? '注册' : '登录'}</button>
      </div>
    </form>
  );
} 