const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const toDate = (value: Date | string) =>
  new Date(
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  );

export const formatDate = (value: Date | string) =>
  dateFormatter.format(toDate(value));

export const formatDateTime = (value: Date | string) =>
  dateTimeFormatter.format(toDate(value));

export const formatOptionLabel = (
  primary?: string | null,
  secondary?: string | null,
) => [primary, secondary].filter(Boolean).join(' · ');

export const getInitials = (value: string) =>
  value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
