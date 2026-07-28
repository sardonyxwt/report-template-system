import { Badge } from '../../components/shadcn/ui/badge';
import { formatReportField } from '../../utils/report-formatters.utils';

type PatientReportValueProps = {
  value: unknown;
};

export const PatientReportValue = ({ value }: PatientReportValueProps) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">Not provided</span>;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return <p className="leading-relaxed">{String(value)}</p>;
  }

  if (typeof value === 'boolean') {
    return <Badge variant="outline">{value ? 'Yes' : 'No'}</Badge>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="grid gap-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border bg-muted/30 p-3">
            <PatientReportValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <dl className="grid gap-4 sm:grid-cols-2">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="grid gap-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatReportField(key)}
            </dt>
            <dd>
              <PatientReportValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return null;
};
