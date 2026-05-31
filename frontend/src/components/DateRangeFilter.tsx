import { Segmented, DatePicker, Space } from 'antd';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export type DateField = 'created' | 'remind' | 'closed';

interface Props {
  dateField: DateField;
  onDateFieldChange: (v: DateField) => void;
  range: [Dayjs | null, Dayjs | null] | null;
  onRangeChange: (v: [Dayjs | null, Dayjs | null] | null) => void;
}

export default function DateRangeFilter({ dateField, onDateFieldChange, range, onRangeChange }: Props) {
  return (
    <Space wrap>
      <Segmented
        value={dateField}
        onChange={(v) => onDateFieldChange(v as DateField)}
        options={[
          { label: '按创建时间', value: 'created' },
          { label: '按提醒时间', value: 'remind' },
          { label: '按闭环时间', value: 'closed' },
        ]}
      />
      <RangePicker
        value={range as never}
        onChange={(v) => onRangeChange(v as [Dayjs | null, Dayjs | null] | null)}
        allowClear
      />
    </Space>
  );
}
