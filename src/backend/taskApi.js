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
export async function addTask(userId, quadrant, text) {
  const taskObj = {
    user_id: userId,
    quadrant,
    text,
    progress: 0,
    timeLeft: 0,
    daysToDDL: 1,
    createdAt: Date.now(),
    timeRecords: [],
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