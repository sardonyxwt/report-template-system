import { type ReactNode } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../shadcn/ui/combobox';

export const EntityAutocomplete = <Item,>({
  id,
  value,
  items,
  placeholder,
  emptyLabel = 'No matching options.',
  loadingLabel = 'Loading…',
  loading = false,
  disabled = false,
  invalid = false,
  externalFiltering = false,
  clearValueOnInput = true,
  className = 'w-full',
  getKey,
  getLabel,
  renderItem,
  onOpenChange,
  onSearchChange,
  onChange,
}: {
  id?: string;
  value?: Item;
  items: Item[];
  placeholder: string;
  emptyLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  externalFiltering?: boolean;
  clearValueOnInput?: boolean;
  className?: string;
  getKey: (item: Item) => string;
  getLabel: (item: Item) => string;
  renderItem?: (item: Item) => ReactNode;
  onOpenChange?: (open: boolean) => void;
  onSearchChange?: (value: string) => void;
  onChange: (value?: Item) => void;
}) => (
  <Combobox
    items={items}
    filteredItems={externalFiltering ? items : undefined}
    value={value ?? null}
    disabled={disabled}
    autoHighlight
    itemToStringLabel={getLabel}
    itemToStringValue={getKey}
    isItemEqualToValue={(item, selected) => getKey(item) === getKey(selected)}
    onValueChange={(item) => onChange(item ?? undefined)}
    onOpenChange={onOpenChange}
    onInputValueChange={(inputValue, details) => {
      if (clearValueOnInput && details.reason === 'input-change') {
        onChange(undefined);
      }
      if (
        details.reason === 'input-change' ||
        details.reason === 'input-clear' ||
        details.reason === 'clear-press'
      ) {
        onSearchChange?.(inputValue);
      }
    }}
  >
    <ComboboxInput
      id={id}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={invalid}
      showClear={!disabled}
      className={className}
    />
    <ComboboxContent>
      {loading ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          {loadingLabel}
        </p>
      ) : (
        <>
          <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
          <ComboboxList>
            {(item: Item) => (
              <ComboboxItem key={getKey(item)} value={item}>
                <span className="min-w-0 flex-1">
                  {renderItem?.(item) ?? getLabel(item)}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </>
      )}
    </ComboboxContent>
  </Combobox>
);
