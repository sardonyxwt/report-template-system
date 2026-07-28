import { z } from 'zod';

export const ReportBlockTypeSchema = z.enum([
  'cover',
  'summary',
  'story',
  'goals',
  'plan',
  'orders',
  'timeline',
  'coach',
  'healthDeepDive',
]);

export const ReportPersonSchema = z.object({
  name: z.string().trim().min(1),
  details: z.array(z.string().trim().min(1)).default([]),
});

export const ReportCoverValueSchema = z.object({
  title: z.string().trim().min(1),
  clinic: z.string().trim().min(1).optional(),
  assessmentDate: z.iso.date(),
  generatedAt: z.iso.datetime(),
  patient: ReportPersonSchema,
  preparedBy: ReportPersonSchema,
});

export const ReportSummaryValueSchema = z.object({
  content: z.string().trim().min(1),
  author: z.string().trim().min(1).optional(),
});

export const ReportStoryItemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

export const ReportStoryValueSchema = z.object({
  items: z.array(ReportStoryItemSchema).min(1),
});

export const ReportGoalMetricSchema = z.object({
  name: z.string().trim().min(1),
  currentValue: z.string().trim().min(1),
  targetValue: z.string().trim().min(1),
  timeframe: z.string().trim().min(1),
});

export const ReportGoalSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  reason: z.string().trim().min(1).optional(),
  categories: z.array(z.string().trim().min(1)).default([]),
  timeframe: z.string().trim().min(1).optional(),
  metrics: z.array(ReportGoalMetricSchema).default([]),
});

export const ReportGoalsValueSchema = z.object({
  goals: z.array(ReportGoalSchema).min(1),
});

export const ReportPlanCategorySchema = z.enum([
  'nutrition',
  'lifestyle',
  'medication',
  'supplement',
  'other',
]);

export const ReportPlanItemSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
});

export const ReportPlanGroupSchema = z.object({
  category: ReportPlanCategorySchema,
  label: z.string().trim().min(1),
  items: z.array(ReportPlanItemSchema).min(1),
});

export const ReportPlanValueSchema = z.object({
  description: z.string().trim().min(1).optional(),
  groups: z.array(ReportPlanGroupSchema).min(1),
});

export const ReportOrderGroupSchema = z.object({
  title: z.string().trim().min(1),
  items: z.array(z.string().trim().min(1)).min(1),
});

export const ReportOrdersValueSchema = z.object({
  groups: z.array(ReportOrderGroupSchema).min(1),
});

export const ReportTimelineUnitSchema = z.enum(['day', 'week', 'month']);

export const ReportTimelineItemSchema = z.object({
  planItemId: z.string().trim().min(1),
  planItemTitle: z.string().trim().min(1),
  milestone: z.string().trim().min(1),
});

export const ReportTimelineGroupSchema = z.object({
  offset: z.number().int().nonnegative(),
  unit: ReportTimelineUnitSchema,
  label: z.string().trim().min(1).optional(),
  items: z.array(ReportTimelineItemSchema).min(1),
});

export const ReportTimelineValueSchema = z.object({
  groups: z.array(ReportTimelineGroupSchema).min(1),
});

export const ReportCoachQuestionSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

export const ReportCoachSafetySchema = z.object({
  avoid: z.array(z.string().trim().min(1)).default([]),
  monitoring: z.array(z.string().trim().min(1)).default([]),
  dosing: z.array(z.string().trim().min(1)).default([]),
  callClinicianIf: z.array(z.string().trim().min(1)).default([]),
});

export const ReportCoachItemSchema = z.object({
  planItemId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1).optional(),
  whatToDo: z.string().trim().min(1),
  whyItMatters: z.string().trim().min(1),
  howItWorks: z.string().trim().min(1),
  weekOnePlan: z.string().trim().min(1),
  foodGuidance: z.string().trim().min(1).optional(),
  commonQuestions: z.array(ReportCoachQuestionSchema).default([]),
  tip: z.string().trim().min(1).optional(),
  safety: ReportCoachSafetySchema.optional(),
});

export const ReportCoachValueSchema = z.object({
  items: z.array(ReportCoachItemSchema).min(1),
});

export const ReportHealthStatusSchema = z.enum([
  'atRisk',
  'needsAttention',
  'optimal',
]);

export const ReportBiomarkerRelevancySchema = z.enum(['high', 'medium', 'low']);

export const ReportBiomarkerClassificationSchema = z.enum([
  'abnormal',
  'inRange',
  'optimal',
]);

export const ReportBiomarkerSchema = z.object({
  relevancy: ReportBiomarkerRelevancySchema,
  classification: ReportBiomarkerClassificationSchema,
  name: z.string().trim().min(1),
  value: z.string().trim().min(1),
  referenceRange: z.string().trim().min(1).optional(),
  optimalRange: z.string().trim().min(1).optional(),
  measuredAt: z.iso.date(),
});

export const ReportHealthStatusCountsSchema = z.object({
  abnormal: z.number().int().nonnegative(),
  inRange: z.number().int().nonnegative(),
  optimal: z.number().int().nonnegative(),
});

export const ReportHealthDomainSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  status: ReportHealthStatusSchema,
  summary: z.string().trim().min(1),
  statusCounts: ReportHealthStatusCountsSchema.optional(),
  biomarkers: z.array(ReportBiomarkerSchema).default([]),
});

export const ReportHealthDeepDiveValueSchema = z.object({
  biomarkerNote: z.string().trim().min(1).optional(),
  domains: z.array(ReportHealthDomainSchema).min(1),
});

export const ReportCoverBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.cover),
  value: ReportCoverValueSchema,
});

export const ReportSummaryBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.summary),
  value: ReportSummaryValueSchema,
});

export const ReportStoryBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.story),
  value: ReportStoryValueSchema,
});

export const ReportGoalsBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.goals),
  value: ReportGoalsValueSchema,
});

export const ReportPlanBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.plan),
  value: ReportPlanValueSchema,
});

export const ReportOrdersBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.orders),
  value: ReportOrdersValueSchema,
});

export const ReportTimelineBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.timeline),
  value: ReportTimelineValueSchema,
});

export const ReportCoachBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.coach),
  value: ReportCoachValueSchema,
});

export const ReportHealthDeepDiveBlockSchema = z.object({
  type: z.literal(ReportBlockTypeSchema.enum.healthDeepDive),
  value: ReportHealthDeepDiveValueSchema,
});

export const ReportBlockSchema = z.discriminatedUnion('type', [
  ReportCoverBlockSchema,
  ReportSummaryBlockSchema,
  ReportStoryBlockSchema,
  ReportGoalsBlockSchema,
  ReportPlanBlockSchema,
  ReportOrdersBlockSchema,
  ReportTimelineBlockSchema,
  ReportCoachBlockSchema,
  ReportHealthDeepDiveBlockSchema,
]);

export const ReportDataSchema = z.object({
  blocks: z.array(ReportBlockSchema).min(1),
});
