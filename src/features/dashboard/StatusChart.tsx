import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTheme } from '@/state/theme-context';
import { paletteFor } from '@/features/dashboard/chartTheme';
import type { StatusBreakdownEntry } from '@/lib/metrics';
import { pluralize } from '@/lib/format';

/**
 * Applications grouped by status.
 *
 * Horizontal bars so each status keeps a readable, always-visible label — that
 * label, not the hue, is what identifies the bar. Counts are labelled directly
 * at the end of each bar, so there is no legend and no colour-only encoding.
 */
export function StatusChart({ data }: { data: StatusBreakdownEntry[] }) {
  const { resolved } = useTheme();
  const palette = paletteFor(resolved);
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <Card>
      <CardHeader
        title="Applications by status"
        description="Where every tracked role currently sits."
      />
      <div className="px-2 py-4">
        <div className="cf-chart h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 0, left: 8 }}
              barCategoryGap={6}
            >
              <XAxis type="number" hide domain={[0, max]} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={78}
                stroke={palette.axis}
              />
              <Tooltip
                cursor={{ fill: palette.grid, fillOpacity: 0.35 }}
                contentStyle={{
                  backgroundColor: palette.tooltipSurface,
                  border: `1px solid ${palette.tooltipBorder}`,
                  borderRadius: '0.75rem',
                  color: palette.tooltipInk,
                  fontSize: '0.8125rem',
                }}
                formatter={(value: number) => [
                  `${value} ${pluralize(value, 'application')}`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18} name="Applications">
                {data.map((entry) => (
                  <Cell key={entry.status} fill={palette.status[entry.status]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  className="fill-ink"
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <table className="sr-only">
        <caption>Applications grouped by status. {total} in total.</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Applications</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.status}>
              <th scope="row">{entry.label}</th>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
