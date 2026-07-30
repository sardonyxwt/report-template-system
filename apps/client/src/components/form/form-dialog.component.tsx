import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import { Button } from '../shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../shadcn/ui/dialog';
import { Spinner } from '../shadcn/ui/spinner';

export const useFormDialog = ({ onSaved }: { onSaved: () => void }) => {
  const [open, setOpen] = useState(false);

  const closeAndSave = () => {
    setOpen(false);
    onSaved();
  };

  return { open, setOpen, closeAndSave };
};

/**
 * Resets a form each time a dialog opens.
 *
 * `getResetValues` and `onOpen` are stored in refs so callers can pass inline
 * lambdas without re-running this effect on every parent render while open.
 */
export const useDialogReset = <T,>({
  open,
  reset,
  getResetValues,
  onOpen,
}: {
  open: boolean;
  reset: (values: T) => void;
  getResetValues: () => T;
  onOpen?: () => void;
}) => {
  const getResetValuesRef = useRef(getResetValues);
  const onOpenRef = useRef(onOpen);
  getResetValuesRef.current = getResetValues;
  onOpenRef.current = onOpen;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getResetValuesRef.current());
    onOpenRef.current?.();
  }, [open, reset]);
};

type FormDialogProps<FormValues extends FieldValues> = {
  trigger: ReactNode;
  title: string;
  description: string;
  submitLabel: string;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => void;
  children: ReactNode;
};

export const FormDialog = <FormValues extends FieldValues>({
  trigger,
  title,
  description,
  submitLabel,
  loading = false,
  open,
  onOpenChange,
  form,
  onSubmit,
  children,
}: FormDialogProps<FormValues>) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {children}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);
