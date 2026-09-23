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
import { useT } from '@/i18n/i18n-context';
import { plural, statusLabel } from '@/i18n/labels';
import type { StatusBreakdownEntry } from '@/lib/metrics';

/**
 * Applications grouped by status.
 *
 * Horizontal bars so each status keeps a readable, always-visible label — that
 * label, not the hue, is what identifies the bar. Counts are labelled directly
 * at the end of each bar, so there is no legend and no colour-only encoding.
 */
export function StatusChart({ data }: { data: StatusBreakdownEntry[] }) {
  const { resolved } = useTheme();
  const t = useT();
  const palette = paletteFor(resolved);
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(1, ...data.map((entry) => entry.count));
  const rows = data.map((entry) => ({ ...entry, label: statusLabel(t, entry.status) }));

  return (
    <Card>
      <CardHeader
        title={t('chart.byStatus')}
        description={t('chart.byStatusDesc')}
      />
      <div className="px-2 py-4">
        <div className="cf-chart h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
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
                  plural(t, value, 'chart.oneApplication', 'chart.nApplications'),
                  t('chart.count'),
                ]}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                name={t('nav.applications')}
              >
                {rows.map((entry) => (
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
        <caption>{t('chart.byStatusCaption', { total })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('chart.statusHeader')}</th>
            <th scope="col">{t('chart.applicationsHeader')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
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
