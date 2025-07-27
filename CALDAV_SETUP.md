# Apple Calendar 双向同步设置

## 概述

TickDone现在支持与Apple Calendar的双向同步：

1. **任务 → 日历**：有DDL的任务自动同步到Apple Calendar
2. **日历 → 任务**：从Apple Calendar读取事件，选择性地添加到任务列表

## 设置步骤

### 1. 启动CalDAV代理服务器

由于浏览器的CORS限制，我们需要一个代理服务器来访问Apple Calendar的CalDAV API。

```bash
# 启动代理服务器
npm run caldav-proxy
```

这将在端口3001启动代理服务器。

### 2. 配置Apple Calendar凭据

1. 访问 https://appleid.apple.com
2. 登录你的Apple ID
3. 进入"安全" > "应用专用密码"
4. 点击"生成密码"
5. 为应用起名（如"TickDone"）
6. 记录生成的密码（格式：xxxx-xxxx-xxxx-xxxx）

### 3. 在TickDone中连接Apple Calendar

1. 打开TickDone应用
2. 点击"集成"按钮
3. 在Apple Calendar部分点击"连接"
4. 输入你的iCloud邮箱和应用专用密码
5. 完成设置

## 使用方法

### 同步任务到日历

1. 确保Apple Calendar已连接
2. 创建有DDL的任务
3. 点击"同步"按钮
4. 任务将出现在Apple Calendar中

### 从日历添加事件到任务

1. 点击"📅 读取"按钮
2. 在弹出的窗口中选择要添加的事件
3. 点击"添加 X 个事件到任务"
4. 选中的事件将转换为任务

## 故障排除

### 代理服务器无法启动

```bash
# 手动安装依赖
cd server
npm install

# 启动服务器
npm start
```

### 无法读取Apple Calendar事件

1. 检查Apple ID和应用专用密码是否正确
2. 确保代理服务器正在运行（端口3001）
3. 检查网络连接
4. 查看浏览器控制台的错误信息

### 同步失败

1. 确保任务有DDL设置
2. 检查Apple Calendar凭据是否过期
3. 重新连接Apple Calendar

## 技术细节

- **CalDAV协议**：用于与Apple Calendar通信
- **代理服务器**：绕过浏览器CORS限制
- **iCalendar格式**：标准日历事件格式
- **应用专用密码**：安全的认证方式

## 安全说明

- 应用专用密码只保存在浏览器本地存储中
- 凭据不会发送到TickDone服务器
- 30天后凭据自动过期
- 可以随时通过"断开"按钮清除凭据 