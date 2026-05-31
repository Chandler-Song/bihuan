/**
 * 测试 AI + 邮件功能
 * 用法: npx ts-node scripts/test-ai-mail.ts
 */
import { parseTaskByAI } from '../src/services/qwen';
import { sendMail } from '../src/services/mailer';
import { env } from '../src/config/env';

const TEST_EMAIL = '275737875@qq.com';

async function testAI() {
  console.log('🧪 测试 1：调用 Qwen AI 服务...');
  console.log(`   API Key: ${env.QWEN_API_KEY ? '✓ 已配置' : '✗ 未配置'}`);
  console.log(`   Model: ${env.QWEN_MODEL}`);
  console.log(`   Base URL: ${env.QWEN_BASE_URL}`);

  try {
    const result = await parseTaskByAI('明天下午三点开项目评审会，很重要 #工作 #紧急');
    console.log('\n✅ AI 解析成功：');
    console.log('   内容:', result.content);
    console.log('   优先级:', result.priority);
    console.log('   提醒天数:', result.remindDays);
    console.log('   标签:', result.tags.join(', ') || '(无)');
    return result;
  } catch (err) {
    console.error('❌ AI 调用失败:', err);
    throw err;
  }
}

async function testMail(aiResult: any) {
  console.log('\n📧 测试 2：发送邮件到', TEST_EMAIL);
  console.log(`   SMTP: ${env.MAIL_HOST}:${env.MAIL_PORT}`);
  console.log(`   User: ${env.MAIL_USER}`);

  const mailContent = `【闭环 BiHuan】AI + 邮件功能测试

✅ AI 解析测试成功！

原始输入：明天下午三点开项目评审会，很重要 #工作 #紧急

AI 解析结果：
• 任务内容：${aiResult.content}
• 优先级：${aiResult.priority}
• 提醒天数：${aiResult.remindDays} 天后
• 标签：${aiResult.tags.join(', ') || '(无)'}

---
这是一封自动测试邮件，来自闭环 BiHuan MVP 系统。
发送时间：${new Date().toLocaleString('zh-CN')}
`;

  try {
    await sendMail({
      to: TEST_EMAIL,
      subject: '【闭环】AI + 邮件功能测试成功 ✅',
      text: mailContent,
      html: `
        <h2>✅ 闭环 BiHuan - AI + 邮件功能测试成功</h2>
        <h3>AI 解析测试</h3>
        <p><b>原始输入：</b>明天下午三点开项目评审会，很重要 #工作 #紧急</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tr><td><b>任务内容</b></td><td>${aiResult.content}</td></tr>
          <tr><td><b>优先级</b></td><td>${aiResult.priority}</td></tr>
          <tr><td><b>提醒天数</b></td><td>${aiResult.remindDays} 天后</td></tr>
          <tr><td><b>标签</b></td><td>${aiResult.tags.join(', ') || '(无)'}</td></tr>
        </table>
        <hr/>
        <p><small>这是一封自动测试邮件，来自闭环 BiHuan MVP 系统。</small></p>
        <p><small>发送时间：${new Date().toLocaleString('zh-CN')}</small></p>
      `,
    });
    console.log('\n✅ 邮件发送成功！');
    console.log(`   请检查 ${TEST_EMAIL} 的收件箱（包括垃圾邮件文件夹）`);
  } catch (err) {
    console.error('\n❌ 邮件发送失败:', err);
    throw err;
  }
}

async function main() {
  console.log('========================================');
  console.log('  闭环 BiHuan - AI + 邮件功能测试');
  console.log('========================================\n');

  try {
    // 1) 测试 AI
    const aiResult = await testAI();

    // 2) 测试邮件
    await testMail(aiResult);

    console.log('\n========================================');
    console.log('  🎉 所有测试通过！');
    console.log('========================================');
  } catch (err) {
    console.error('\n========================================');
    console.error('  ❌ 测试失败');
    console.error('========================================');
    process.exit(1);
  }
}

main();
