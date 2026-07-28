import { type ReactNode } from 'react';
import { Spinner } from '../shadcn/ui/spinner';

type SubmitLabelProps = {
  loading: boolean;
  children: ReactNode;
};

export const SubmitLabel = ({ loading, children }: SubmitLabelProps) => (
  <>
    {loading && <Spinner />}
    {children}
  </>
);
