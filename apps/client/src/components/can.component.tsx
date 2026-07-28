import { type PropsWithChildren } from 'react';

type CanProps = PropsWithChildren<{ granted: boolean }>;

export const Can = ({ granted, children }: CanProps) =>
  granted ? <>{children}</> : null;
