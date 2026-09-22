import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTheme } from '@/state/theme-context';
import { paletteFor } from '@/features/dashboard/chartTheme';
import type { ActivityBucket } from '@/lib/metrics';
import { formatDateOnly } from '@/lib/dates';
import { pluralize } from '@/lib/format';

/**
 * Applications submitted per week over the last 12 weeks.
 *
 * One series, so no legend: the card title names it. The screen-reader table
 * below carries the same numbers for anyone who cannot use the plot.
 */
export function ActivityChart({ data }: { data: ActivityBucket[] }) {
  const { resolved } = useTheme();
  const palette = paletteFor(resolved);
  const total = data.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Card>
      <CardHeader
        title="Application activity"
        description={`Applications by the week they were submitted, over the last 12 weeks. ${total} in total.`}
      />
      <div className="px-2 py-4">
        <div className="cf-chart h-56 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke={palette.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
                stroke={palette.axis}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
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
                labelFormatter={(label) => `Week of ${label}`}
                formatter={(value: number) => [
                  `${value} ${pluralize(value, 'application')}`,
                  'Submitted',
                ]}
              />
              <Bar
                dataKey="count"
                fill={palette.series}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
                name="Applications"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <table className="sr-only">
        <caption>Applications submitted per week over the last 12 weeks</caption>
        <thead>
          <tr>
            <th scope="col">Week beginning</th>
            <th scope="col">Applications submitted</th>
          </tr>
        </thead>
        <tbody>
          {data.map((bucket) => (
            <tr key={bucket.start}>
              <th scope="row">{formatDateOnly(bucket.start)}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
