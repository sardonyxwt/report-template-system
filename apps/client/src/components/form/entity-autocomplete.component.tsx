import { CheckIcon, SearchIcon, XIcon } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '../shadcn/lib/utils';
import { Button } from '../shadcn/ui/button';
import { Input } from '../shadcn/ui/input';

export const EntityAutocomplete = <Item,>({
  id,
  value,
  items,
  placeholder,
  emptyLabel = 'No matching options.',
  loading = false,
  disabled = false,
  invalid = false,
  getKey,
  getLabel,
  renderItem,
  onChange,
}: {
  id?: string;
  value?: Item;
  items: Item[];
  placeholder: string;
  emptyLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  getKey: (item: Item) => string;
  getLabel: (item: Item) => string;
  renderItem?: (item: Item) => ReactNode;
  onChange: (value?: Item) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value ? getLabel(value) : '');

  useEffect(() => {
    if (!open) {
      setInput(value ? getLabel(value) : '');
    }
  }, [getLabel, open, value]);

  const filteredItems = useMemo(() => {
    const search = input.trim().toLocaleLowerCase();
    if (!search || (value && input === getLabel(value))) {
      return items;
    }
    return items.filter((item) =>
      getLabel(item).toLocaleLowerCase().includes(search),
    );
  }, [getLabel, input, items, value]);

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setInput(value ? getLabel(value) : '');
        }
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        value={input}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        className="pr-8 pl-8"
        onFocus={(event) => {
          setOpen(true);
          event.currentTarget.select();
        }}
        onChange={(event) => {
          setInput(event.target.value);
          onChange(undefined);
          setOpen(true);
        }}
      />
      {!disabled && (value || input) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear selection"
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={() => {
            setInput('');
            onChange(undefined);
            setOpen(true);
          }}
        >
          <XIcon />
        </Button>
      )}
      {open && !disabled && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : filteredItems.length ? (
            filteredItems.map((item) => {
              const selected = value && getKey(value) === getKey(item);
              return (
                <button
                  key={getKey(item)}
                  type="button"
                  role="option"
                  aria-selected={Boolean(selected)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
                    selected && 'bg-accent',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item);
                    setInput(getLabel(item));
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    {renderItem?.(item) ?? getLabel(item)}
                  </span>
                  {selected && <CheckIcon className="size-4 shrink-0" />}
                </button>
              );
            })
          ) : (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
