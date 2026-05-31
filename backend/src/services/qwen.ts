import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface ParsedTask {
  content: string;
  priority: 'high' | 'normal' | 'low';
  remindDays: number;
  tags: string[];
}

const SYSTEM_PROMPT = `你是任务解析助手。用户输入一段中文自然语言任务描述，
请仅以 JSON 格式输出，不要任何额外文字、解释或代码块标记。
JSON Schema：{"content": string, "priority": "high"|"normal"|"low", "remindDays": number, "tags": string[]}
规则：
1) content：提取任务核心内容，去掉时间词与情绪词。
2) priority：含「重要/紧急/务必/马上」→ high；含「随便/有空」→ low；否则 normal。
3) remindDays：解析提醒间隔天数。常见映射：今天=0，明天=1，后天=2，下周=7，下个月=30，未提及默认=1。
4) tags：从输入中提取 #标签，如「明天开会 #工作 #重要」→ ["工作", "重要"]。不含 # 则为空数组 []。`;

export async function parseTaskByAI(input: string): Promise<ParsedTask> {
  if (!env.QWEN_API_KEY) {
    logger.warn('QWEN_API_KEY missing, fallback to rule parser');
    return ruleParser(input);
  }
  try {
    const resp = await axios.post(
      `${env.QWEN_BASE_URL}/chat/completions`,
      {
        model: env.QWEN_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    const text: string = resp.data?.choices?.[0]?.message?.content ?? '';
    const json = JSON.parse(text);
    return normalize(json, input);
  } catch (err) {
    logger.error({ err }, 'qwen parse failed, fallback to rule parser');
    return ruleParser(input);
  }
}

function normalize(json: Record<string, unknown>, raw: string): ParsedTask {
  const content = typeof json.content === 'string' && json.content.trim() ? json.content.trim() : raw.trim();
  const p = json.priority;
  const priority: ParsedTask['priority'] = p === 'high' || p === 'low' ? p : 'normal';
  const d = Number(json.remindDays);
  const remindDays = Number.isFinite(d) && d >= 0 ? d : 1;
  const tags = Array.isArray(json.tags)
    ? json.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map(t => t.trim())
    : [];
  return { content, priority, remindDays, tags };
}

export function ruleParser(input: string): ParsedTask {
  const text = input.trim();
  let priority: ParsedTask['priority'] = 'normal';
  if (/重要|紧急|务必|马上|立刻/.test(text)) priority = 'high';
  else if (/随便|有空|空了|不急/.test(text)) priority = 'low';

  let remindDays = 1;
  if (/今天|今日/.test(text)) remindDays = 0;
  else if (/明天|明日/.test(text)) remindDays = 1;
  else if (/后天/.test(text)) remindDays = 2;
  else if (/下周|下星期/.test(text)) remindDays = 7;
  else if (/两周|2周/.test(text)) remindDays = 14;
  else if (/下个月|下月/.test(text)) remindDays = 30;
  const m = text.match(/(\d+)\s*天后/);
  if (m) remindDays = parseInt(m[1], 10);

  // 提取 #标签
  const tags = (text.match(/#([^\s#]+)/g) || []).map(t => t.slice(1));

  return { content: text, priority, remindDays, tags };
}

export interface SummaryStats {
  newCount: number;
  closedCount: number;
  closeRate: number;
  pendingCount: number;
  overdueCount: number;
  avgClosedDays: number;
  longPending?: { content: string; days: number }[];
}

export async function generateAISummary(
  period: 'week' | 'month',
  stats: SummaryStats
): Promise<string> {
  const periodCN = period === 'week' ? '本周' : '本月';
  const fallback = `${periodCN}新增 ${stats.newCount} 个任务，闭环 ${stats.closedCount} 个，闭环率 ${(stats.closeRate * 100).toFixed(0)}%。继续保持！`;
  if (!env.QWEN_API_KEY) return fallback;
  try {
    const prompt = `你是任务管理教练，请基于以下数据生成详细的中文总结报告：

## 数据概览
- 统计周期：${periodCN}
- 新增任务：${stats.newCount} 个
- 闭环任务：${stats.closedCount} 个
- 闭环率：${(stats.closeRate * 100).toFixed(1)}%
- 当前待办：${stats.pendingCount} 个
- 逾期任务：${stats.overdueCount} 个
- 平均闭环耗时：${stats.avgClosedDays} 天

## 长期搁置任务（超过14天未闭环）
${stats.longPending && stats.longPending.length > 0 
  ? stats.longPending.map(t => `-「${t.content}」（已搁置 ${Math.round(t.days)} 天）`).join('\n')
  : '无长期搁置任务'}

## 输出要求
请按以下结构输出（控制在 300 字以内）：

1. **数据点评**：分析本周期的关键数据，指出亮点与不足
2. **内容统计**：总结完成了哪些类型的任务，设置了哪些待办，有哪些趋势
3. **长期任务提醒**：针对搁置超过 14 天的任务给出具体建议
4. **鼓励语**：一句简洁有力的鼓励

语气友好、专业，避免空洞的套话。`;
    const resp = await axios.post(
      `${env.QWEN_BASE_URL}/chat/completions`,
      {
        model: env.QWEN_MODEL,
        messages: [
          { role: 'system', content: '你是个性化任务管理教练，输出简洁、有深度、数据驱动的中文总结报告。善用emoji提升可读性。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    const text: string = resp.data?.choices?.[0]?.message?.content ?? '';
    return text.trim() || fallback;
  } catch (err) {
    logger.error({ err }, 'qwen summary failed');
    return fallback;
  }
}
