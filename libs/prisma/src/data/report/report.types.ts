import { z } from 'zod';
import {
  ReportBiomarkerClassificationSchema,
  ReportBiomarkerRelevancySchema,
  ReportBiomarkerSchema,
  ReportBlockSchema,
  ReportBlockTypeSchema,
  ReportCoachBlockSchema,
  ReportCoachItemSchema,
  ReportCoachQuestionSchema,
  ReportCoachSafetySchema,
  ReportCoachValueSchema,
  ReportCoverBlockSchema,
  ReportCoverValueSchema,
  ReportDataSchema,
  ReportGoalMetricSchema,
  ReportGoalSchema,
  ReportGoalsBlockSchema,
  ReportGoalsValueSchema,
  ReportHealthDeepDiveBlockSchema,
  ReportHealthDeepDiveValueSchema,
  ReportHealthDomainSchema,
  ReportHealthStatusCountsSchema,
  ReportHealthStatusSchema,
  ReportOrderGroupSchema,
  ReportOrdersBlockSchema,
  ReportOrdersValueSchema,
  ReportPersonSchema,
  ReportPlanBlockSchema,
  ReportPlanCategorySchema,
  ReportPlanGroupSchema,
  ReportPlanItemSchema,
  ReportPlanValueSchema,
  ReportStoryBlockSchema,
  ReportStoryItemSchema,
  ReportStoryValueSchema,
  ReportSummaryBlockSchema,
  ReportSummaryValueSchema,
  ReportTimelineBlockSchema,
  ReportTimelineGroupSchema,
  ReportTimelineItemSchema,
  ReportTimelineUnitSchema,
  ReportTimelineValueSchema,
} from './report.data';

export type ReportBlockType = z.infer<typeof ReportBlockTypeSchema>;
export type ReportPerson = z.infer<typeof ReportPersonSchema>;
export type ReportCoverValue = z.infer<typeof ReportCoverValueSchema>;
export type ReportSummaryValue = z.infer<typeof ReportSummaryValueSchema>;
export type ReportStoryItem = z.infer<typeof ReportStoryItemSchema>;
export type ReportStoryValue = z.infer<typeof ReportStoryValueSchema>;
export type ReportGoalMetric = z.infer<typeof ReportGoalMetricSchema>;
export type ReportGoal = z.infer<typeof ReportGoalSchema>;
export type ReportGoalsValue = z.infer<typeof ReportGoalsValueSchema>;
export type ReportPlanCategory = z.infer<typeof ReportPlanCategorySchema>;
export type ReportPlanItem = z.infer<typeof ReportPlanItemSchema>;
export type ReportPlanGroup = z.infer<typeof ReportPlanGroupSchema>;
export type ReportPlanValue = z.infer<typeof ReportPlanValueSchema>;
export type ReportOrderGroup = z.infer<typeof ReportOrderGroupSchema>;
export type ReportOrdersValue = z.infer<typeof ReportOrdersValueSchema>;
export type ReportTimelineUnit = z.infer<typeof ReportTimelineUnitSchema>;
export type ReportTimelineItem = z.infer<typeof ReportTimelineItemSchema>;
export type ReportTimelineGroup = z.infer<typeof ReportTimelineGroupSchema>;
export type ReportTimelineValue = z.infer<typeof ReportTimelineValueSchema>;
export type ReportCoachQuestion = z.infer<typeof ReportCoachQuestionSchema>;
export type ReportCoachSafety = z.infer<typeof ReportCoachSafetySchema>;
export type ReportCoachItem = z.infer<typeof ReportCoachItemSchema>;
export type ReportCoachValue = z.infer<typeof ReportCoachValueSchema>;
export type ReportHealthStatus = z.infer<typeof ReportHealthStatusSchema>;
export type ReportBiomarkerRelevancy = z.infer<
  typeof ReportBiomarkerRelevancySchema
>;
export type ReportBiomarkerClassification = z.infer<
  typeof ReportBiomarkerClassificationSchema
>;
export type ReportBiomarker = z.infer<typeof ReportBiomarkerSchema>;
export type ReportHealthStatusCounts = z.infer<
  typeof ReportHealthStatusCountsSchema
>;
export type ReportHealthDomain = z.infer<typeof ReportHealthDomainSchema>;
export type ReportHealthDeepDiveValue = z.infer<
  typeof ReportHealthDeepDiveValueSchema
>;
export type ReportCoverBlock = z.infer<typeof ReportCoverBlockSchema>;
export type ReportSummaryBlock = z.infer<typeof ReportSummaryBlockSchema>;
export type ReportStoryBlock = z.infer<typeof ReportStoryBlockSchema>;
export type ReportGoalsBlock = z.infer<typeof ReportGoalsBlockSchema>;
export type ReportPlanBlock = z.infer<typeof ReportPlanBlockSchema>;
export type ReportOrdersBlock = z.infer<typeof ReportOrdersBlockSchema>;
export type ReportTimelineBlock = z.infer<typeof ReportTimelineBlockSchema>;
export type ReportCoachBlock = z.infer<typeof ReportCoachBlockSchema>;
export type ReportHealthDeepDiveBlock = z.infer<
  typeof ReportHealthDeepDiveBlockSchema
>;
export type ReportBlock = z.infer<typeof ReportBlockSchema>;
export type ReportData = z.infer<typeof ReportDataSchema>;
