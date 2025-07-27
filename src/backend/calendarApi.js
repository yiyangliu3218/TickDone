// 日历集成API服务
// 注意：这些是示例代码，实际使用时需要配置相应的API密钥和OAuth凭据

// Google Calendar API
export const googleCalendarApi = {
  // 初始化Google API客户端
  initClient: () => {
    return new Promise((resolve, reject) => {
      // 这里需要加载Google API客户端库
      if (typeof gapi === 'undefined') {
        reject(new Error('Google API not loaded'));
        return;
      }
      
      gapi.load('client:auth2', () => {
              gapi.client.init({
        apiKey: window.REACT_APP_GOOGLE_API_KEY || '',
        clientId: window.REACT_APP_GOOGLE_CLIENT_ID || '',
        scope: 'https://www.googleapis.com/auth/calendar',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
      }).then(() => {
          resolve(gapi.auth2.getAuthInstance());
        }).catch(reject);
      });
    });
  },

  // 认证用户
  authenticate: async () => {
    try {
      const auth = await googleCalendarApi.initClient();
      const user = await auth.signIn();
      return user;
    } catch (error) {
      console.error('Google Calendar authentication failed:', error);
      throw error;
    }
  },

  // 创建日历事件
  createEvent: async (event) => {
    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      return response.result;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  },

  // 批量创建事件
  createEvents: async (events) => {
    const results = [];
    for (const event of events) {
      try {
        const result = await googleCalendarApi.createEvent(event);
        results.push({ success: true, event: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
};

// Apple Calendar (CalDAV) API
export const appleCalendarApi = {
  // CalDAV连接配置
  config: {
    serverUrl: 'https://caldav.icloud.com',
    username: '', // 用户需要提供
    password: ''  // 用户需要提供
  },

  // 建立CalDAV连接
  connect: async (username, password) => {
    try {
      // 这里需要实际的CalDAV客户端实现
      // 可以使用类似dav-client.js的库
      console.log('Connecting to Apple Calendar via CalDAV...');
      
      // 模拟连接
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ connected: true });
        }, 1000);
      });
    } catch (error) {
      console.error('Apple Calendar connection failed:', error);
      throw error;
    }
  },

  // 创建CalDAV事件
  createEvent: async (event) => {
    try {
      // 将事件转换为iCal格式
      const icalEvent = appleCalendarApi.convertToICal(event);
      
      // 这里需要实际的CalDAV PUT请求
      console.log('Creating Apple Calendar event:', icalEvent);
      
      return { success: true, eventId: Date.now().toString() };
    } catch (error) {
      console.error('Failed to create Apple Calendar event:', error);
      throw error;
    }
  },

  // 转换为iCal格式
  convertToICal: (event) => {
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TickDone//Task Manager//EN
BEGIN:VEVENT
UID:${Date.now()}@tickdone.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;
  }
};

// Outlook Calendar API
export const outlookCalendarApi = {
  // Microsoft Graph API配置
  config: {
    clientId: window.REACT_APP_MICROSOFT_CLIENT_ID || '',
    tenantId: window.REACT_APP_MICROSOFT_TENANT_ID || '',
    redirectUri: window.location.origin
  },

  // 初始化MSAL
  initMsal: () => {
    // 这里需要MSAL.js库
    if (typeof msal === 'undefined') {
      throw new Error('MSAL library not loaded');
    }
    
    return new msal.PublicClientApplication({
      auth: {
        clientId: outlookCalendarApi.config.clientId,
        authority: `https://login.microsoftonline.com/${outlookCalendarApi.config.tenantId}`,
        redirectUri: outlookCalendarApi.config.redirectUri
      }
    });
  },

  // 认证用户
  authenticate: async () => {
    try {
      const msalInstance = outlookCalendarApi.initMsal();
      const loginRequest = {
        scopes: ['Calendars.ReadWrite']
      };
      
      const response = await msalInstance.loginPopup(loginRequest);
      return response;
    } catch (error) {
      console.error('Outlook Calendar authentication failed:', error);
      throw error;
    }
  },

  // 创建日历事件
  createEvent: async (event, accessToken) => {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create Outlook Calendar event:', error);
      throw error;
    }
  }
};

// 通用日历服务
export const calendarService = {
  // 将任务转换为日历事件格式
  convertTaskToEvent: (task) => {
    let startDate;
    
    if (task.ddlDate) {
      // 如果有具体日期，使用该日期
      startDate = new Date(task.ddlDate + 'T09:00:00');
    } else if (task.createdAt && task.daysToDDL) {
      // 如果有创建时间和天数，计算截止日期
      startDate = new Date(new Date(task.createdAt).getTime() + task.daysToDDL * 86400000);
    } else {
      // 默认使用明天
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      startDate = new Date(tomorrow.getTime() + 9 * 3600000); // 明天上午9点
    }
    
    const endDate = new Date(startDate.getTime() + 8 * 3600000); // 8小时后
    
    console.log('转换任务到事件:', {
      taskText: task.text,
      ddlDate: task.ddlDate,
      daysToDDL: task.daysToDDL,
      createdAt: task.createdAt,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    return {
      summary: task.text,
      description: `任务类型: ${task.quadrant || '未分类'}\n进度: ${task.progress || 0}%\n${task.completed ? '✅ 已完成' : '⏳ 进行中'}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Shanghai'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Shanghai'
      },
      colorId: calendarService.getColorId(task.quadrant),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1天前
          { method: 'popup', minutes: 60 }        // 1小时前
        ]
      }
    };
  },

  // 获取颜色ID
  getColorId: (quadrant) => {
    const colorMap = {
      q1: '11', // 红色 - 重要且紧急
      q2: '6',  // 橙色 - 重要不紧急
      q3: '9',  // 蓝色 - 不重要但紧急
      q4: '10'  // 绿色 - 不重要不紧急
    };
    return colorMap[quadrant] || '1';
  },

  // 同步任务到Google Calendar
  syncToGoogle: async (tasks) => {
    try {
      await googleCalendarApi.authenticate();
      const events = tasks.map(calendarService.convertTaskToEvent);
      return await googleCalendarApi.createEvents(events);
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      throw error;
    }
  },

  // 同步任务到Apple Calendar
  syncToApple: async (tasks, username, password) => {
    try {
      await appleCalendarApi.connect(username, password);
      const events = tasks.map(calendarService.convertTaskToEvent);
      
      const results = [];
      for (const event of events) {
        try {
          const result = await appleCalendarApi.createEvent(event);
          results.push({ success: true, event: result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      console.error('Apple Calendar sync failed:', error);
      throw error;
    }
  },

  // 从Apple Calendar读取事件
  readFromApple: async (username, password, startDate = null, endDate = null) => {
    console.log('Reading events from Apple Calendar via CalDAV proxy...');
    
    // 如果没有指定日期范围，默认读取未来30天的事件
    if (!startDate) {
      startDate = new Date();
    }
    if (!endDate) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    
    try {
      // 使用CalDAV代理服务器
      const proxyUrl = 'http://localhost:3001/api/caldav/read-events';
      
      console.log('发送请求到CalDAV代理:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`成功读取 ${result.count} 个Apple Calendar事件`);
        return {
          success: true,
          events: result.events
        };
      } else {
        throw new Error(result.error || '读取失败');
      }
      
    } catch (error) {
      console.error('Failed to read from Apple Calendar:', error);
      
      // 如果代理服务器不可用，返回提示信息
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'CalDAV代理服务器未运行。请确保代理服务器已启动：npm run caldav-proxy',
          events: []
        };
      }
      
      return {
        success: false,
        error: error.message,
        events: []
      };
    }
  },

  // 同步任务到Outlook Calendar
  syncToOutlook: async (tasks) => {
    try {
      const authResponse = await outlookCalendarApi.authenticate();
      const events = tasks.map(calendarService.convertTaskToEvent);
      
      const results = [];
      for (const event of events) {
        try {
          const result = await outlookCalendarApi.createEvent(event, authResponse.accessToken);
          results.push({ success: true, event: result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      console.error('Outlook Calendar sync failed:', error);
      throw error;
    }
  }
};

// 导出默认服务
export default calendarService; 