import { CheckIcon, SearchIcon, XIcon } from 'lucide-react';
import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from './shadcn/lib/utils';
import { Button } from './shadcn/ui/button';
import { Input } from './shadcn/ui/input';

const SEARCH_DEBOUNCE_MS = 300;

export const ResourceSearchInput = ({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const nextValue = input.trim();

    if (nextValue === value) {
      return;
    }

    const timeout = window.setTimeout(
      () => onChange(nextValue),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [input, onChange, value]);

  return (
    <div className="relative w-full sm:w-80">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={input}
        placeholder={placeholder}
        className="pr-8 pl-8"
        onChange={(event) => setInput(event.target.value)}
      />
      {input && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={() => {
            setInput('');
            onChange('');
          }}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
};

export const AsyncAutocompleteFilter = <Item,>({
  value,
  placeholder,
  emptyLabel = 'No results found.',
  load,
  getKey,
  getLabel,
  renderItem,
  onChange,
}: {
  value?: Item;
  placeholder: string;
  emptyLabel?: string;
  load: (search: string) => Promise<Item[]>;
  getKey: (item: Item) => string;
  getLabel: (item: Item) => string;
  renderItem?: (item: Item) => ReactNode;
  onChange: (value?: Item) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value ? getLabel(value) : '');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) {
      setInput(value ? getLabel(value) : '');
    }
  }, [getLabel, open, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentRequestId = ++requestId.current;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void load(input.trim())
        .then((nextItems) => {
          if (requestId.current === currentRequestId) {
            setItems(nextItems);
          }
        })
        .catch(() => {
          if (requestId.current === currentRequestId) {
            setItems([]);
          }
        })
        .finally(() => {
          if (requestId.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [input, load, open]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setOpen(true);
  };

  return (
    <div
      className="relative w-full sm:w-80"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        value={input}
        placeholder={placeholder}
        className="pr-8 pl-8"
        onFocus={(event) => {
          setOpen(true);
          event.currentTarget.select();
        }}
        onChange={handleInputChange}
      />
      {(value || input) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear filter"
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={() => {
            setInput('');
            setItems([]);
            onChange(undefined);
            setOpen(true);
          }}
        >
          <XIcon />
        </Button>
      )}
      {open && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : items.length ? (
            items.map((item) => {
              const selected = value && getKey(value) === getKey(item);
              return (
                <button
                  key={getKey(item)}
                  type="button"
                  role="option"
                  aria-selected={Boolean(selected)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
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
