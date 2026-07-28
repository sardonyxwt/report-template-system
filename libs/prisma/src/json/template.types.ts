export enum TemplateBlockType {
  Cover = 'Cover',
  Quote = 'Quote',
  Metrics = 'Metrics',
  List = 'List',
  Timeline = 'Timeline',
  Section = 'Section',
}

export interface TemplateModule {
  type: TemplateBlockType;
  template: string;
}

export interface TemplateDataJson {
  modules: TemplateModule[];
}
