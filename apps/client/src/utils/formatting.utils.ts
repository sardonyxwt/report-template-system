export const formatDateTime = (value: Date | string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

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
