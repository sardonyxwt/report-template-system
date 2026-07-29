import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
  ClinicReportResponse,
  ClinicReportsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { includeClinicReport, Prisma, ReportData } from 'platform/prisma';

/**
 * Manages clinic reports and enforces clinic-manager authorization.
 */
@Injectable()
export class ClinicReportService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  /**
   * Creates a report for an existing clinic patient with default block data.
   */
  async create(data: ClinicReportCreateRequest): Promise<ClinicReportResponse> {
    return this.prisma.run(async (tx) => {
      const patient = await tx.patient.findFirstOrThrow({
        where: {
          userId: data.patientId,
          clinicId: data.clinicId,
        },
        select: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
          clinic: {
            select: {
              managerId: true,
              name: true,
            },
          },
        },
      });

      this.session.abilityGuard('clinicReports', 'create', {
        managerId: patient.clinic.managerId,
      });

      const report = await tx.clinicReport.create({
        data: {
          ...data,
          data: createDefaultReportData(
            patient.user.fullName ?? patient.user.email,
            patient.clinic.name,
          ),
        },
        include: includeClinicReport,
      });

      this.logger.log('Clinic report created', ClinicReportService.name, {
        reportId: report.id,
        clinicId: report.clinicId,
        patientId: report.patientId,
      });

      return report;
    });
  }

  /**
   * Deletes a clinic report after checking access against its clinic manager.
   */
  async delete(id: number): Promise<ClinicReportResponse> {
    this.logger.log(
      'Delete clinic report requested',
      ClinicReportService.name,
      {
        reportId: id,
      },
    );

    return this.prisma.run(async (tx) => {
      const report = await tx.clinicReport.findFirstOrThrow({
        where: { id },
        select: { clinic: { select: { managerId: true } } },
      });

      this.session.abilityGuard('clinicReports', 'delete', {
        managerId: report.clinic.managerId,
      });

      const deletedReport = await tx.clinicReport.delete({
        where: { id },
        include: includeClinicReport,
      });

      this.logger.log('Clinic report deleted', ClinicReportService.name, {
        reportId: deletedReport.id,
      });

      return deletedReport;
    });
  }

  /**
   * Finds clinic reports and authorizes every returned row.
   */
  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: ClinicReportAggregateRequest): Promise<ClinicReportsResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.clinicReport.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.ClinicReportWhereUniqueInput | undefined,
            take,
            skip,
            include: includeClinicReport,
          }),
          tx.clinicReport.count({ where }),
        ] as const,
    );

    for (const report of items) {
      this.session.abilityGuard('clinicReports', 'read', {
        managerId: report.clinic.managerId,
      });
    }

    return {
      items,
      total,
      perPage: take ?? total,
    };
  }
}

const createDefaultReportData = (
  patientName: string,
  clinicName: string,
): ReportData => ({
  blocks: [
    {
      type: 'cover',
      value: {
        title: `${patientName}’s Health Report`,
        clinic: clinicName,
        assessmentDate: '2026-06-29',
        generatedAt: new Date().toISOString(),
        patient: {
          name: patientName,
          details: ['Male', '49 years'],
        },
        preparedBy: {
          name: 'Dr. Doron Owner',
          details: [clinicName],
        },
      },
    },
    {
      type: 'summary',
      value: {
        content:
          'Blood counts, thyroid screening, and liver chemistry are reassuring. The main priorities are insulin resistance, cardiovascular risk, blood pressure control, and clarification of kidney function.',
        author: 'Dr. Doron Owner',
      },
    },
    {
      type: 'story',
      value: {
        items: [
          {
            title: 'Kidney monitoring',
            description:
              'Understand whether the previous creatinine and eGFR pattern represents a stable mild issue.',
          },
          {
            title: 'Glycemic control',
            description:
              'Get a clearer picture of insulin resistance beyond the diabetes cutoff.',
          },
          {
            title: 'Blood pressure control',
            description:
              'Confirm whether home blood pressure is controlled and how it affects long-term risk.',
          },
        ],
      },
    },
    {
      type: 'goals',
      value: {
        goals: [
          {
            id: 'lower-insulin-and-triglycerides',
            title: 'Lower insulin and triglycerides',
            reason: 'Chronic insulin resistance',
            categories: [
              'Metabolic Health',
              'Liver Health',
              'Nutrition & Vitamins',
            ],
            timeframe: '24 weeks',
            metrics: [
              {
                name: 'Hemoglobin A1c',
                currentValue: '5.5 %',
                targetValue: '5.2 %',
                timeframe: '24 weeks',
              },
              {
                name: 'Insulin',
                currentValue: '27.8 uIU/mL',
                targetValue: '18 uIU/mL',
                timeframe: '12 weeks',
              },
              {
                name: 'Triglycerides',
                currentValue: '187 mg/dL',
                targetValue: '140 mg/dL',
                timeframe: '12 weeks',
              },
            ],
          },
          {
            id: 'protect-kidney-filtration',
            title: 'Protect kidney filtration',
            reason: 'Borderline renal function',
            categories: ['Kidney Health', 'Cardiovascular Health'],
            timeframe: '24 weeks',
            metrics: [
              {
                name: 'Creatinine',
                currentValue: '1.33 mg/dL',
                targetValue: '1.20 mg/dL',
                timeframe: '24 weeks',
              },
              {
                name: 'eGFR',
                currentValue: '66 mL/min/1.73m2',
                targetValue: '75 mL/min/1.73m2',
                timeframe: '24 weeks',
              },
            ],
          },
        ],
      },
    },
    {
      type: 'plan',
      value: {
        description:
          'The plan combines nutrition, lifestyle changes, and medication monitoring.',
        groups: [
          {
            category: 'nutrition',
            label: 'Nutrition',
            items: [
              {
                id: 'protein-fiber-meals',
                title: 'Build protein-fiber meals',
              },
            ],
          },
          {
            category: 'lifestyle',
            label: 'Lifestyle',
            items: [
              {
                id: 'cardio-and-lifting',
                title: 'Add cardio and lifting',
              },
              {
                id: 'home-blood-pressure',
                title: 'Track your home blood pressure',
              },
            ],
          },
          {
            category: 'medication',
            label: 'Medications',
            items: [
              {
                id: 'continue-enclomiphene',
                title: 'Continue enclomiphene as prescribed',
              },
            ],
          },
        ],
      },
    },
    {
      type: 'orders',
      value: {
        groups: [
          {
            title: 'Labs',
            items: [
              'Fasting metabolic follow-up panel',
              'Lipid risk refinement panel',
              'Kidney clarification panel',
            ],
          },
          {
            title: 'Imaging',
            items: [
              'Liver ultrasound with elastography',
              'DEXA body composition and bone density scan',
            ],
          },
          {
            title: 'Referrals',
            items: [
              'Sleep medicine evaluation',
              'Physical therapy for bilateral knee osteoarthritis',
            ],
          },
        ],
      },
    },
    {
      type: 'timeline',
      value: {
        groups: [
          {
            offset: 0,
            unit: 'week',
            label: 'Now',
            items: [
              {
                planItemId: 'protein-fiber-meals',
                planItemTitle: 'Build protein-fiber meals',
                milestone: 'Start meal structure and fiber ramp',
              },
              {
                planItemId: 'home-blood-pressure',
                planItemTitle: 'Track your home blood pressure',
                milestone: 'Set measurement technique and begin the log',
              },
            ],
          },
          {
            offset: 4,
            unit: 'week',
            items: [
              {
                planItemId: 'cardio-and-lifting',
                planItemTitle: 'Add cardio and lifting',
                milestone: 'Progress aerobic volume',
              },
            ],
          },
          {
            offset: 12,
            unit: 'week',
            items: [
              {
                planItemId: 'continue-enclomiphene',
                planItemTitle: 'Continue enclomiphene as prescribed',
                milestone: 'Review hormone surveillance results',
              },
            ],
          },
        ],
      },
    },
    {
      type: 'coach',
      value: {
        items: [
          {
            planItemId: 'protein-fiber-meals',
            title: 'Build protein-fiber meals',
            subtitle: 'Protein-Fiber Plate',
            whatToDo:
              'Build meals from protein first, then vegetables or other high-fiber foods.',
            whyItMatters:
              'The fasting pattern suggests excess insulin is required to keep glucose in range.',
            howItWorks:
              'Protein and fiber slow absorption, reduce glucose swings, and improve fullness.',
            weekOnePlan:
              'At two meals per day, make protein the anchor and add one fiber-rich food.',
            foodGuidance:
              'Prioritize fish, eggs, Greek yogurt, tofu, poultry, beans, vegetables, berries, nuts, and seeds.',
            commonQuestions: [
              {
                question: 'Do I need to go very low carb?',
                answer:
                  'No. The goal is a lower-insulin pattern, not a rigid diet label.',
              },
            ],
            tip: 'Change breakfast first because it often sets the insulin pattern for the rest of the day.',
          },
          {
            planItemId: 'continue-enclomiphene',
            title: 'Continue enclomiphene as prescribed',
            whatToDo:
              'Keep the current dose stable until the follow-up laboratory panel is reviewed.',
            whyItMatters:
              'Monitoring confirms that the treatment benefit remains balanced and safe.',
            howItWorks:
              'The medication increases the signal for testosterone production and may also raise estradiol.',
            weekOnePlan:
              'Keep morning dosing consistent and schedule the follow-up laboratory draw.',
            commonQuestions: [
              {
                question:
                  'Should I change the dose before the next laboratory test?',
                answer:
                  'No. A stable regimen makes the result easier to interpret.',
              },
            ],
            safety: {
              avoid: ['Do not increase the dose without clinician review.'],
              monitoring: [
                'Repeat estradiol, hematocrit, and liver chemistry on schedule.',
              ],
              dosing: [
                'Continue 25 mg each morning unless the prescribing clinician changes it.',
              ],
              callClinicianIf: [
                'Vision changes, chest pain, shortness of breath, or one-sided leg swelling occur.',
              ],
            },
          },
        ],
      },
    },
    {
      type: 'healthDeepDive',
      value: {
        biomarkerNote:
          'Relevancy reflects the impact of each biomarker on the clinical interpretation.',
        domains: [
          {
            id: 'cardiovascular-health',
            title: 'Cardiovascular Health',
            status: 'atRisk',
            summary:
              'Risk is driven by hypertension, insulin resistance, elevated triglycerides, and low HDL cholesterol.',
            statusCounts: {
              abnormal: 3,
              inRange: 1,
              optimal: 1,
            },
            biomarkers: [
              {
                relevancy: 'high',
                classification: 'abnormal',
                name: 'Triglycerides',
                value: '187 mg/dL',
                referenceRange: '< 150',
                optimalRange: '< 100',
                measuredAt: '2025-06-09',
              },
              {
                relevancy: 'medium',
                classification: 'abnormal',
                name: 'HDL Cholesterol',
                value: '39 mg/dL',
                referenceRange: '> 40',
                optimalRange: '60-90',
                measuredAt: '2025-06-09',
              },
            ],
          },
          {
            id: 'kidney-health',
            title: 'Kidney Health',
            status: 'needsAttention',
            summary:
              'Creatinine remains mildly elevated and should be clarified with repeat eGFR, cystatin C, and urine albumin testing.',
            statusCounts: {
              abnormal: 2,
              inRange: 1,
              optimal: 0,
            },
            biomarkers: [
              {
                relevancy: 'high',
                classification: 'abnormal',
                name: 'Creatinine',
                value: '1.33 mg/dL',
                referenceRange: '0.6-1.3',
                optimalRange: '0.8-1.0',
                measuredAt: '2025-06-09',
              },
              {
                relevancy: 'high',
                classification: 'abnormal',
                name: 'eGFR',
                value: '66 mL/min/1.73m2',
                referenceRange: '> 60',
                optimalRange: '> 90',
                measuredAt: '2025-06-09',
              },
            ],
          },
        ],
      },
    },
  ],
});
