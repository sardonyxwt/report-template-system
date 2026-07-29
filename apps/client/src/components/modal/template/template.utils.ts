import { type TemplateResponse } from 'platform/common-base';
import { TemplateBlockTypeSchema, type TemplateData } from 'platform/prisma';
import {
  TEMPLATE_BLOCK_PREVIEW_BOTTOM_PADDING_PX,
  TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX,
} from '../../../constants';
import { type TemplateForm } from './template.types';

/** Static starter markup for each report block. Created once. */
export const DEFAULT_TEMPLATE_DATA: TemplateData = {
  blocks: [
    {
      type: 'cover',
      enabled: true,
      template:
        '<header class="report-cover"><p>{{clinic}}</p><h1>{{title}}</h1><p>Assessment: {{assessmentDate}}<br>Generated: {{generatedAt}}</p><div class="people"><div><strong>Patient</strong><span style="margin-left: 8px">{{patient.name}}</span></div><div><strong>Prepared by</strong><span style="margin-left: 8px">{{preparedBy.name}}</span></div></div></header>',
    },
    {
      type: 'summary',
      enabled: true,
      template:
        '<section class="summary"><h2>Your Health Status</h2><blockquote style="margin-inline: 16px">{{content}}</blockquote>{{#if author}}<cite>— {{author}}</cite>{{/if}}</section>',
    },
    {
      type: 'story',
      enabled: true,
      template:
        '<section class="story"><h2>Your Story</h2><ul>{{#each items}}<li><strong>{{title}}:</strong> {{description}}</li>{{/each}}</ul></section>',
    },
    {
      type: 'goals',
      enabled: true,
      template:
        '<section class="goals"><h2>Your Goals</h2>{{#each goals}}<article><h3>{{title}}</h3><p>{{reason}} · {{timeframe}}</p><table><tbody>{{#each metrics}}<tr><td>{{name}}</td><td>{{currentValue}}</td><td>{{targetValue}}</td><td>{{timeframe}}</td></tr>{{/each}}</tbody></table></article>{{/each}}</section>',
    },
    {
      type: 'plan',
      enabled: true,
      template:
        '<section class="plan"><h2>Your Plan</h2><p>{{description}}</p>{{#each groups}}<h3>{{label}}</h3><ul>{{#each items}}<li>{{title}}</li>{{/each}}</ul>{{/each}}</section>',
    },
    {
      type: 'orders',
      enabled: true,
      template:
        '<section class="orders"><h2>Orders</h2><div class="columns">{{#each groups}}<div><h3>{{title}}</h3><ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul></div>{{/each}}</div></section>',
    },
    {
      type: 'timeline',
      enabled: true,
      template:
        '<section class="timeline"><h2>Timeline & Follow-up</h2>{{#each groups}}<article><h3>{{#if label}}{{label}}{{else}}{{offset}} {{unit}}{{/if}}</h3><ul>{{#each items}}<li><strong>{{planItemTitle}}:</strong> {{milestone}}</li>{{/each}}</ul></article>{{/each}}</section>',
    },
    {
      type: 'coach',
      enabled: false,
      template:
        '<section class="coach"><h2>Your Coach</h2>{{#each items}}<article><h3>{{title}}</h3><h4>What to do</h4><p>{{whatToDo}}</p><h4>Why it matters</h4><p>{{whyItMatters}}</p><h4>Week 1 plan</h4><p>{{weekOnePlan}}</p></article>{{/each}}</section>',
    },
    {
      type: 'healthDeepDive',
      enabled: true,
      template:
        '<section class="health-deep-dive"><style>.health-deep-dive .status-label[data-status="atRisk"]::before{content:"at Risk"}.health-deep-dive .status-label[data-status="needsAttention"]::before{content:"needs Attention"}.health-deep-dive .status-label[data-status="optimal"]::before{content:"optimal"}</style><h2>Health Deep Dive</h2>{{#each domains}}<article data-status="{{status}}"><h3>{{title}} <span class="status-label" data-status="{{status}}"></span></h3><p>{{summary}}</p><table><tbody>{{#each biomarkers}}<tr><td>{{name}}</td><td>{{relevancy}}</td><td>{{value}}</td><td>{{referenceRange}}</td><td>{{optimalRange}}</td><td>{{measuredAt}}</td></tr>{{/each}}</tbody></table></article>{{/each}}</section>',
    },
  ],
};

export const createDefaultValues = (
  template?: TemplateResponse,
): TemplateForm =>
  template
    ? {
        id: template.id,
        clinicId: template.clinicId,
        name: template.name,
        data: normalizeTemplateData(template.data),
      }
    : {
        clinicId: 0,
        name: '',
        data: DEFAULT_TEMPLATE_DATA,
      };

/** Fill missing block types while keeping the saved order. */
export const normalizeTemplateData = (data: TemplateData): TemplateData => {
  const blocksByType = new Map(data.blocks.map((block) => [block.type, block]));
  const defaultsByType = new Map(
    DEFAULT_TEMPLATE_DATA.blocks.map((block) => [block.type, block]),
  );
  const orderedTypes = [
    ...data.blocks.map(({ type }) => type),
    ...TemplateBlockTypeSchema.options.filter(
      (type) => !blocksByType.has(type),
    ),
  ];

  return {
    blocks: orderedTypes.map(
      (type) => blocksByType.get(type) ?? defaultsByType.get(type)!,
    ),
  };
};

export const formatBlockType = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());

export const getBlockPreviewHeight = (document: Document | null): number => {
  const block = document?.querySelector<HTMLElement>('[data-report-block]');

  if (!block) {
    return TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX;
  }

  return Math.ceil(
    block.getBoundingClientRect().bottom +
      TEMPLATE_BLOCK_PREVIEW_BOTTOM_PADDING_PX,
  );
};

/** Keep tab panels mounted so editor/prompt state survives tab switches. */
export const PRESERVED_TAB_CONTENT_CLASS = 'data-[state=inactive]:hidden';
