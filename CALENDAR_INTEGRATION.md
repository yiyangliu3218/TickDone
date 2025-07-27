# 📅 日历集成配置指南

TickDone支持与外部日历系统集成，包括Google Calendar、Apple Calendar和Outlook Calendar。

## 🚀 快速开始

### 1. Google Calendar集成

#### 步骤1：创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用Google Calendar API

#### 步骤2：配置OAuth 2.0凭据
1. 在Google Cloud Console中，转到"凭据"页面
2. 点击"创建凭据" > "OAuth 2.0客户端ID"
3. 选择"Web应用程序"
4. 添加授权重定向URI：`http://localhost:3000`（开发环境）
5. 记录Client ID和Client Secret

#### 步骤3：配置环境变量
创建`.env`文件并添加：
```env
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Apple Calendar集成

#### 步骤1：获取iCloud凭据
1. 确保你有iCloud账户
2. 开启两步验证
3. 生成应用专用密码：
   - 访问 [Apple ID](https://appleid.apple.com/)
   - 安全 > 应用专用密码 > 生成密码

#### 步骤2：配置CalDAV
Apple Calendar使用CalDAV协议，需要以下信息：
- 服务器：`https://caldav.icloud.com`
- 用户名：你的iCloud邮箱
- 密码：应用专用密码

### 3. Outlook Calendar集成

#### 步骤1：注册Microsoft应用
1. 访问 [Azure Portal](https://portal.azure.com/)
2. 注册新应用程序
3. 配置重定向URI：`http://localhost:3000`
4. 记录Application (client) ID和Directory (tenant) ID

#### 步骤2：配置API权限
1. 在应用注册中，转到"API权限"
2. 添加Microsoft Graph权限：
   - `Calendars.ReadWrite`
   - `User.Read`

#### 步骤3：配置环境变量
```env
REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
REACT_APP_MICROSOFT_TENANT_ID=your_microsoft_tenant_id
```

## 🔧 技术实现

### Google Calendar API
```javascript
// 使用Google API客户端库
gapi.load('client:auth2', () => {
  gapi.client.init({
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar'
  });
});
```

### Apple Calendar (CalDAV)
```javascript
// 使用CalDAV协议
const caldavConfig = {
  serverUrl: 'https://caldav.icloud.com',
  username: 'your-apple-id@icloud.com',
  password: 'app-specific-password'
};
```

### Outlook Calendar (Microsoft Graph)
```javascript
// 使用Microsoft Graph API
const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MICROSOFT_TENANT_ID}`
  }
};
```

## 📋 功能特性

### 任务同步
- ✅ 自动将有DDL的任务转换为日历事件
- ✅ 支持四象限颜色编码
- ✅ 包含任务进度和状态信息
- ✅ 设置智能提醒（1天前和1小时前）

### 事件格式
```javascript
{
  summary: "任务标题",
  description: "任务类型: q1\n进度: 75%\n⏳ 进行中",
  start: {
    dateTime: "2024-01-15T09:00:00.000Z",
    timeZone: "Asia/Shanghai"
  },
  end: {
    dateTime: "2024-01-15T17:00:00.000Z",
    timeZone: "Asia/Shanghai"
  },
  colorId: "11", // 红色 - 重要且紧急
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 24 * 60 },
      { method: "popup", minutes: 60 }
    ]
  }
}
```

## 🛠️ 开发说明

### 依赖库
```bash
# Google Calendar
npm install gapi-script

# Microsoft Graph
npm install @azure/msal-browser

# CalDAV (可选)
npm install dav-client
```

### 环境变量
确保在`.env`文件中配置所有必要的API密钥：
```env
# Google Calendar
REACT_APP_GOOGLE_API_KEY=your_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_client_id

# Microsoft Outlook
REACT_APP_MICROSOFT_CLIENT_ID=your_client_id
REACT_APP_MICROSOFT_TENANT_ID=your_tenant_id

# Supabase
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
```

## 🔒 安全注意事项

1. **API密钥保护**：永远不要将API密钥提交到版本控制系统
2. **OAuth重定向**：确保重定向URI配置正确
3. **权限最小化**：只请求必要的API权限
4. **HTTPS**：生产环境必须使用HTTPS
5. **用户同意**：确保用户明确同意数据同步

## 🚨 故障排除

### 常见问题

1. **Google Calendar认证失败**
   - 检查API密钥和Client ID是否正确
   - 确认Google Calendar API已启用
   - 检查重定向URI配置

2. **Apple Calendar连接失败**
   - 确认iCloud账户有效
   - 检查应用专用密码是否正确
   - 验证CalDAV服务器地址

3. **Outlook Calendar同步失败**
   - 检查Azure应用注册配置
   - 确认API权限已正确设置
   - 验证Tenant ID是否正确

### 调试模式
在开发环境中，可以启用详细日志：
```javascript
// 在浏览器控制台中查看详细日志
localStorage.setItem('debug', 'calendar:*');
```

## 📞 支持

如果遇到问题，请：
1. 检查浏览器控制台错误信息
2. 确认所有环境变量已正确配置
3. 验证API密钥和权限设置
4. 查看网络请求状态

---

**注意**：这些集成功能需要相应的API密钥和OAuth配置。在生产环境中使用前，请确保所有安全措施都已到位。 