import { z } from 'zod';
import { ClinicReportSchema } from 'platform/prisma';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';

const validateClinicReport = (
  { data }: z.infer<typeof ClinicReportSchema>,
  context: z.RefinementCtx,
) => {
  const blockTypes = new Set<string>();

  data.blocks.forEach((block, index) => {
    if (blockTypes.has(block.type)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate report block type: ${block.type}`,
        path: ['data', 'blocks', index, 'type'],
      });
    }

    blockTypes.add(block.type);
  });
};

export const ClinicReportResponseSchema = z
  .object(ClinicReportSchema.shape)
  .superRefine(validateClinicReport)
  .meta({ name: 'ClinicReportResponseSchema' });

export const ClinicReportsResponseSchema = createManyResponseSchema(
  ClinicReportResponseSchema,
).meta({ name: 'ClinicReportsResponseSchema' });

export const ClinicReportCreateRequestSchema = z
  .object({
    patientId: ClinicReportSchema.shape.patientId,
    clinicId: ClinicReportSchema.shape.clinicId,
  })
  .meta({ name: 'ClinicReportCreateRequestSchema' });

export const ClinicReportAggregateRequestSchema = ArgsAggregateRequestSchema;
