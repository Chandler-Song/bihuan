import { useEffect, useState, useCallback } from 'react';
import { Segmented, Card, Row, Col, Statistic, Button, Typography, Spin, message, List } from 'antd';
import { ReloadOutlined, RobotOutlined } from '@ant-design/icons';
import { summaryApi, type SummaryStats } from '@/api';

type Period = 'week' | 'month';

export default function Summary() {
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await summaryApi.stats(period);
      setStats(r);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
    setAiText('');
  }, [loadStats]);

  async function generateAI() {
    setAiLoading(true);
    try {
      const r = await summaryApi.ai(period);
      setStats(r.stats);
      setAiText(r.text);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err?.response?.data?.message || err?.message || 'AI 生成失败');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>总结</Typography.Title>
        <Segmented
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { label: '本周', value: 'week' },
            { label: '本月', value: 'month' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={loadStats}>刷新统计</Button>
      </div>

      {loading || !stats ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="新增任务" value={stats.newCount} /></Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="闭环任务" value={stats.closedCount} /></Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="闭环率" value={stats.closeRate} suffix="%" /></Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="待处理" value={stats.pendingCount} /></Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="逾期任务" value={stats.overdueCount} valueStyle={{ color: stats.overdueCount > 0 ? '#cf1322' : undefined }} /></Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card><Statistic title="平均闭环天数" value={stats.avgClosedDays} suffix="天" /></Card>
            </Col>
          </Row>

          <Card
            style={{ marginTop: 16 }}
            title={<><RobotOutlined /> AI 总结</>}
            extra={
              <Button type="primary" loading={aiLoading} onClick={generateAI}>
                {aiText ? '重新生成' : '生成总结'}
              </Button>
            }
          >
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin tip="AI 思考中..." /></div>
            ) : aiText ? (
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                {aiText}
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary">点击右上角「生成总结」让 AI 为你点评本期表现。</Typography.Text>
            )}
          </Card>

          {stats.longPending && stats.longPending.length > 0 && (
            <Card style={{ marginTop: 16 }} title="长期搁置任务">
              <List
                size="small"
                dataSource={stats.longPending}
                renderItem={(item) => (
                  <List.Item>
                    <Typography.Text>{item.content}</Typography.Text>
                    <Typography.Text type="warning">已搁置 {item.days} 天</Typography.Text>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
