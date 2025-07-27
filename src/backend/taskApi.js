import { supabase } from '../supabaseClient';

// 获取当前用户的所有任务
export async function getTasks(userId) {
  const { data, error } = await supabase
    .from('TickDone')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

// 新增任务
export async function addTask(userId, quadrant, text, section = null, quadrantTag = null, tag = null) {
  const taskObj = {
    user_id: userId,
    quadrant,
    text,
    progress: 0,
    timeLeft: 0,
    daysToDDL: null, // 不设置默认DDL
    ddlDate: null, // 不设置默认DDL日期
    createdAt: Date.now(),
    timeRecords: [],
    section,
    quadrant_tag: quadrantTag,
    tag
  };
  const { data, error } = await supabase
    .from('TickDone')
    .insert([taskObj])
    .select();
  if (error) throw error;
  return data[0];
}

// 删除任务
export async function removeTask(taskId) {
  const { error } = await supabase
    .from('TickDone')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
}

// 更新任务
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('TickDone')
    .update(updates)
    .eq('id', taskId)
    .select();
  if (error) throw error;
  return data[0];
}

// 获取用户的所有section
export async function getSections(userId) {
  const { data, error } = await supabase
    .from('TickDone')
    .select('section')
    .eq('user_id', userId)
    .not('section', 'is', null);
  
  if (error) throw error;
  
  // 去重并过滤空值
  const uniqueSections = [...new Set(data.map(item => item.section).filter(Boolean))];
  return uniqueSections;
}

// 更新任务的section
export async function updateTaskSection(taskId, section) {
  const { data, error } = await supabase
    .from('TickDone')
    .update({ section })
    .eq('id', taskId)
    .select();
  if (error) throw error;
  return data[0];
}

// 更新任务的象限标签
export async function updateTaskQuadrantTag(taskId, quadrantTag) {
  const { data, error } = await supabase
    .from('TickDone')
    .update({ quadrant_tag: quadrantTag })
    .eq('id', taskId)
    .select();
  if (error) throw error;
  return data[0];
}

// 更新任务的标签
export async function updateTaskTag(taskId, tag) {
  const { data, error } = await supabase
    .from('TickDone')
    .update({ tag })
    .eq('id', taskId)
    .select();
  if (error) throw error;
  return data[0];
}