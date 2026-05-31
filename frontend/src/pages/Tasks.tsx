import { useEffect, useState, useCallback } from 'react';
import { Input, Segmented, Space, Empty, Spin, Pagination, Typography, Card, Select, Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { tasksApi, type Task } from '@/api';
import TaskCard from '@/components/TaskCard';
import TaskInputBar from '@/components/TaskInputBar';
import DateRangeFilter, { type DateField } from '@/components/DateRangeFilter';

type StatusFilter = 'all' | 'pending' | 'done';

export default function Tasks() {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [dateField, setDateField] = useState<DateField>('created');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [list, setList] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'created' | 'remind' | 'priority' | 'tag'>('remind');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // keyword 防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  // 加载用户标签
  useEffect(() => {
    tasksApi.getTags().then(r => setUserTags(r.tags)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { status, page, pageSize, sortBy, sortOrder };
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (selectedTag) params.tag = selectedTag;
      if (range && range[0] && range[1]) {
        params.dateField = dateField;
        params.startDate = range[0].format('YYYY-MM-DD');
        params.endDate = range[1].format('YYYY-MM-DD');
      }
      const r = await tasksApi.list(params);
      setList(r.list);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [status, page, pageSize, debouncedKeyword, dateField, range, selectedTag, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  // filter 变更时回到第一页
  useEffect(() => {
    setPage(1);
  }, [status, debouncedKeyword, dateField, range, selectedTag, sortBy, sortOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>全部任务</Typography.Title>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="搜索任务关键字"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 280 }}
            />
            <Segmented
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              options={[
                { label: '未闭环', value: 'pending' },
                { label: '已闭环', value: 'done' },
                { label: '全部', value: 'all' },
              ]}
            />
          </Space>
          <Space wrap>
            <DateRangeFilter
              dateField={dateField}
              onDateFieldChange={setDateField}
              range={range}
              onRangeChange={setRange}
            />
            <Select
              allowClear
              placeholder="按标签筛选"
              value={selectedTag}
              onChange={setSelectedTag}
              style={{ width: 160 }}
              options={userTags.map(t => ({ label: t, value: t }))}
            />
            <Segmented
              value={sortBy}
              onChange={(v) => setSortBy(v as typeof sortBy)}
              options={[
                { label: '按提醒时间', value: 'remind' },
                { label: '按创建时间', value: 'created' },
                { label: '按优先级', value: 'priority' },
                { label: '按标签数', value: 'tag' },
              ]}
            />
            <Button size="small" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
            </Button>
          </Space>
          {range && range[0] && range[1] && (
            <Typography.Text type="secondary">
              {dayjs(range[0]).format('YYYY-MM-DD')} ~ {dayjs(range[1]).format('YYYY-MM-DD')}
            </Typography.Text>
          )}
        </Space>
      </Card>
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : list.length === 0 ? (
          <Empty description="没有匹配的任务" style={{ padding: 48 }} />
        ) : (
          list.map((t) => <TaskCard key={t.id} task={t} onChange={load} />)
        )}
      </div>
      <div style={{ textAlign: 'right', padding: '12px 0' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={[10, 20, 50, 100]}
          onChange={(p, s) => {
            setPage(p);
            setPageSize(s);
          }}
          showTotal={(t) => `共 ${t} 条`}
        />
      </div>
      <TaskInputBar onCreated={load} />
    </div>
  );
}
