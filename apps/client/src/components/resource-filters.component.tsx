import { SearchIcon, XIcon } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SEARCH_DEBOUNCE_DELAY_MS } from '../constants';
import { EntityAutocomplete } from './form/entity-autocomplete.component';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './shadcn/ui/input-group';

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
  const changeSearch = useDebouncedCallback(
    (nextValue: string) => onChange(nextValue),
    SEARCH_DEBOUNCE_DELAY_MS,
  );

  useEffect(() => {
    changeSearch.cancel();
    setInput(value);
  }, [changeSearch, value]);

  return (
    <InputGroup className="w-full sm:w-80">
      <InputGroupInput
        value={input}
        placeholder={placeholder}
        onChange={(event) => {
          setInput(event.target.value);
          changeSearch(event.target.value.trim());
        }}
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      {input && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              changeSearch.cancel();
              setInput('');
              onChange('');
            }}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const loadItems = useDebouncedCallback(
    async (search: string, currentRequestId: number) => {
      setLoading(true);

      try {
        const nextItems = await load(search);
        if (requestId.current === currentRequestId) {
          setItems(nextItems);
        }
      } catch {
        if (requestId.current === currentRequestId) {
          setItems([]);
        }
      } finally {
        if (requestId.current === currentRequestId) {
          setLoading(false);
        }
      }
    },
    SEARCH_DEBOUNCE_DELAY_MS,
  );
  const queueLoad = (search: string) => {
    const currentRequestId = ++requestId.current;
    void loadItems(search.trim(), currentRequestId);
  };

  return (
    <EntityAutocomplete
      items={items}
      value={value}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      loadingLabel="Searching…"
      loading={loading}
      externalFiltering
      clearValueOnInput={false}
      className="w-full sm:w-80"
      getKey={getKey}
      getLabel={getLabel}
      renderItem={renderItem}
      onOpenChange={(open) => {
        if (open) {
          queueLoad(value ? getLabel(value) : '');
        } else {
          loadItems.cancel();
          requestId.current++;
          setLoading(false);
        }
      }}
      onSearchChange={queueLoad}
      onChange={onChange}
    />
  );
};
