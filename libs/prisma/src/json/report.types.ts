export type ScalarValue = string | number | boolean | null;

export interface NamedValue {
  name: string;
  value?: ScalarValue;
  unit?: string;
  details?: NamedValue[];
}

export interface StatusValue {
  code: string;
  label?: string;
}

export interface CoverBlockValue {
  title: string;
  subtitle?: string;
  details?: NamedValue[];
}

export interface HeadingBlockValue {
  text: string;
  level: number;
}

export interface TextBlockValue {
  title?: string;
  paragraphs: string[];
}

export interface QuoteBlockValue {
  text: string;
  attribution?: string;
}

export interface KeyValueBlockValue {
  title?: string;
  items: NamedValue[];
}

export interface ListItemValue {
  name: string;
  value?: ScalarValue;
  details?: ListItemValue[];
}

export interface ListBlockValue {
  title?: string;
  ordered?: boolean;
  items: ListItemValue[];
}

export interface MetricValue {
  name: string;
  current?: ScalarValue;
  target?: ScalarValue;
  unit?: string;
  timeframe?: string;
  status?: StatusValue;
  details?: NamedValue[];
}

export interface MetricsBlockValue {
  title?: string;
  description?: string;
  items: MetricValue[];
}

export interface TableColumnValue {
  key: string;
  name: string;
}

export interface TableCellValue {
  value: ScalarValue;
  unit?: string;
  status?: StatusValue;
  details?: NamedValue[];
}

export interface TableBlockValue {
  title?: string;
  description?: string;
  columns: TableColumnValue[];
  rows: Array<Record<string, TableCellValue>>;
}

export interface TimelineEntryValue {
  name: string;
  date?: string;
  details: NamedValue[];
}

export interface TimelineBlockValue {
  title?: string;
  entries: TimelineEntryValue[];
}

export interface CardValue {
  name: string;
  subtitle?: string;
  status?: StatusValue;
  details: NamedValue[];
}

export interface CardsBlockValue {
  title?: string;
  cards: CardValue[];
}

export interface ImageBlockValue {
  src: string;
  alt: string;
  caption?: string;
}

export interface SectionBlockValue {
  title?: string;
  description?: string;
  blocks: ReportBlock[];
}

/**
 * Registry of supported block types.
 *
 * The key becomes `block.type`.
 * The associated interface becomes `block.value`.
 *
 * Add a future block by adding one entry here:
 *
 *   labPanel: LabPanelBlockValue;
 */
export interface ReportBlockValueMap {
  cover: CoverBlockValue;
  heading: HeadingBlockValue;
  text: TextBlockValue;
  quote: QuoteBlockValue;
  keyValue: KeyValueBlockValue;
  list: ListBlockValue;
  metrics: MetricsBlockValue;
  table: TableBlockValue;
  timeline: TimelineBlockValue;
  cards: CardsBlockValue;
  image: ImageBlockValue;
  section: SectionBlockValue;
}

export type ReportBlockType = keyof ReportBlockValueMap;

/**
 * Discriminated union generated from ReportBlockValueMap.
 *
 * TypeScript automatically narrows `block.value` after checking `block.type`.
 */
export type ReportBlock = {
  [Type in ReportBlockType]: {
    type: Type;
    value: ReportBlockValueMap[Type];
  };
}[ReportBlockType];

export interface ReportDataJson {
  schemaVersion: 1;
  blocks: ReportBlock[];
}
