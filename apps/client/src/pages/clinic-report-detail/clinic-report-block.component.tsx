import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  HeartPulseIcon,
  LightbulbIcon,
  ListChecksIcon,
  MessageCircleQuestionIcon,
  MicroscopeIcon,
  SparklesIcon,
  TargetIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { type ClinicReportResponse } from 'platform/common-base';
import { Badge } from '../../components/shadcn/ui/badge';
import { Card, CardContent } from '../../components/shadcn/ui/card';
import { Separator } from '../../components/shadcn/ui/separator';
import { formatReportField } from '../../utils/report-formatters.utils';

type ReportBlock = ClinicReportResponse['data']['blocks'][number];

type ReportSectionProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

const ReportSection = ({
  icon,
  eyebrow,
  title,
  description,
  children,
}: ReportSectionProps) => (
  <section className="min-w-0 scroll-mt-6">
    <div className="mb-4 flex items-start gap-3">
      <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:size-6">
        {icon}
      </div>
      <div className="min-w-0 pt-2">
        <p className="text-xs font-semibold uppercase leading-none tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-tight tracking-tight sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </section>
);

const Surface = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Card className={`min-w-0 border-0 shadow-sm ${className}`}>
    <CardContent className="min-w-0">{children}</CardContent>
  </Card>
);

export const ClinicReportBlock = ({ block }: { block: ReportBlock }) => {
  switch (block.type) {
    case 'cover':
      return null;

    case 'summary':
      return (
        <ReportSection
          icon={<SparklesIcon />}
          eyebrow="At a glance"
          title="Clinical summary"
        >
          <Surface className="bg-gradient-to-br from-primary/[0.08] via-card to-card">
            <div className="border-l-2 border-primary pl-4 sm:pl-6">
              <p className="text-base leading-7 sm:text-lg sm:leading-8">
                {block.value.content}
              </p>
              {block.value.author && (
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  — {block.value.author}
                </p>
              )}
            </div>
          </Surface>
        </ReportSection>
      );

    case 'story':
      return (
        <ReportSection
          icon={<ActivityIcon />}
          eyebrow="Priorities"
          title="Your health story"
          description="The key areas that shape the next steps in care."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {block.value.items.map((item, index) => (
              <Surface key={`${item.title}-${index}`} className="h-full">
                <div className="mb-4 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="font-semibold leading-snug">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </Surface>
            ))}
          </div>
        </ReportSection>
      );

    case 'goals':
      return (
        <ReportSection
          icon={<TargetIcon />}
          eyebrow="Outcomes"
          title="Health goals"
          description="Measurable targets and the timeframe for reaching them."
        >
          <div className="grid gap-4">
            {block.value.goals.map((goal, index) => (
              <Surface key={goal.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Goal {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{goal.title}</h3>
                    {goal.reason && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {goal.reason}
                      </p>
                    )}
                  </div>
                  {goal.timeframe && (
                    <Badge variant="secondary" className="w-fit shrink-0">
                      <CalendarClockIcon />
                      {goal.timeframe}
                    </Badge>
                  )}
                </div>

                {goal.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {goal.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {goal.metrics.length > 0 && (
                  <>
                    <Separator className="my-5" />
                    <div className="grid gap-3 lg:grid-cols-3">
                      {goal.metrics.map((metric) => (
                        <div
                          key={metric.name}
                          className="min-w-0 rounded-xl bg-muted/55 p-4"
                        >
                          <p className="truncate text-sm font-medium">
                            {metric.name}
                          </p>
                          <div className="mt-3 flex min-w-0 items-center gap-2">
                            <span className="min-w-0 break-words text-sm text-muted-foreground">
                              {metric.currentValue}
                            </span>
                            <ArrowRightIcon className="size-4 shrink-0 text-primary" />
                            <span className="min-w-0 break-words font-semibold">
                              {metric.targetValue}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Target in {metric.timeframe}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Surface>
            ))}
          </div>
        </ReportSection>
      );

    case 'plan':
      return (
        <ReportSection
          icon={<ListChecksIcon />}
          eyebrow="Action plan"
          title="What to do next"
          description={block.value.description}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {block.value.groups.map((group) => (
              <Surface
                key={`${group.category}-${group.label}`}
                className="h-full"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{group.label}</h3>
                  <Badge variant="secondary">{group.category}</Badge>
                </div>
                <ul className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm leading-5">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            ))}
          </div>
        </ReportSection>
      );

    case 'orders':
      return (
        <ReportSection
          icon={<ClipboardListIcon />}
          eyebrow="Clinical follow-up"
          title="Orders and referrals"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {block.value.groups.map((group) => (
              <Surface key={group.title} className="h-full">
                <h3 className="font-semibold">{group.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-5"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Surface>
            ))}
          </div>
        </ReportSection>
      );

    case 'timeline':
      return (
        <ReportSection
          icon={<CalendarClockIcon />}
          eyebrow="Roadmap"
          title="Care timeline"
          description="A practical sequence for putting the plan into motion."
        >
          <Surface>
            <div className="grid">
              {block.value.groups.map((group, index) => (
                <div
                  key={`${group.offset}-${group.unit}-${index}`}
                  className="relative grid gap-3 border-l-2 border-primary/20 pb-7 pl-6 last:border-transparent last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
                >
                  <span className="absolute -left-[7px] top-0 size-3 rounded-full border-2 border-background bg-primary" />
                  <div>
                    <p className="font-semibold text-primary">
                      {group.label ??
                        `${group.offset} ${group.unit}${group.offset === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <div
                        key={`${item.planItemId}-${item.milestone}`}
                        className="rounded-xl bg-muted/55 p-4"
                      >
                        <p className="font-medium">{item.planItemTitle}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {item.milestone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </ReportSection>
      );

    case 'coach':
      return (
        <ReportSection
          icon={<LightbulbIcon />}
          eyebrow="Practical guidance"
          title="Your health coach"
          description="Clear guidance for turning recommendations into daily habits."
        >
          <div className="grid gap-4">
            {block.value.items.map((item, index) => (
              <Surface key={`${item.planItemId}-${index}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Coaching note {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-sm text-muted-foreground">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    ['What to do', item.whatToDo],
                    ['Why it matters', item.whyItMatters],
                    ['How it works', item.howItWorks],
                    ['Week one', item.weekOnePlan],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-muted/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 text-sm leading-6">{value}</p>
                    </div>
                  ))}
                </div>

                {item.foodGuidance && (
                  <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Food guidance
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {item.foodGuidance}
                    </p>
                  </div>
                )}

                {item.commonQuestions.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center gap-2 font-medium">
                      <MessageCircleQuestionIcon className="size-4 text-primary" />
                      Common questions
                    </div>
                    <div className="grid gap-3">
                      {item.commonQuestions.map((question) => (
                        <div
                          key={question.question}
                          className="rounded-xl border p-4"
                        >
                          <p className="font-medium">{question.question}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {question.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.tip && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm">
                    <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="leading-6">{item.tip}</p>
                  </div>
                )}

                {item.safety &&
                  Object.entries(item.safety).some(
                    ([, values]) => values.length > 0,
                  ) && (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {Object.entries(item.safety).map(([key, values]) =>
                        values.length > 0 ? (
                          <div key={key} className="rounded-xl border p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {formatReportField(key)}
                            </p>
                            <ul className="mt-3 grid gap-2">
                              {values.map((value) => (
                                <li
                                  key={value}
                                  className="flex items-start gap-2 text-sm leading-5"
                                >
                                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                                  {value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}
              </Surface>
            ))}
          </div>
        </ReportSection>
      );

    case 'healthDeepDive':
      return (
        <ReportSection
          icon={<MicroscopeIcon />}
          eyebrow="Clinical detail"
          title="Health deep dive"
          description={block.value.biomarkerNote}
        >
          <div className="grid gap-4">
            {block.value.domains.map((domain) => {
              const statusStyle = {
                atRisk:
                  'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
                needsAttention:
                  'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                optimal:
                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              }[domain.status];

              return (
                <Surface key={domain.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{domain.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {domain.summary}
                      </p>
                    </div>
                    <Badge variant="outline" className={`w-fit ${statusStyle}`}>
                      <HeartPulseIcon />
                      {formatReportField(domain.status)}
                    </Badge>
                  </div>

                  {domain.statusCounts && (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {Object.entries(domain.statusCounts).map(
                        ([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl bg-muted/55 p-3 text-center"
                          >
                            <p className="text-lg font-semibold">{value}</p>
                            <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                              {formatReportField(label)}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {domain.biomarkers.length > 0 && (
                    <>
                      <Separator className="my-5" />
                      <div className="grid gap-3 lg:grid-cols-2">
                        {domain.biomarkers.map((biomarker) => (
                          <div
                            key={`${biomarker.name}-${biomarker.measuredAt}`}
                            className="min-w-0 rounded-xl border p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium">{biomarker.name}</p>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary">
                                  {biomarker.relevancy}
                                </Badge>
                                <Badge variant="outline">
                                  {formatReportField(biomarker.classification)}
                                </Badge>
                              </div>
                            </div>
                            <p className="mt-3 break-words text-xl font-semibold">
                              {biomarker.value}
                            </p>
                            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                              {biomarker.referenceRange && (
                                <p>Reference: {biomarker.referenceRange}</p>
                              )}
                              {biomarker.optimalRange && (
                                <p>Optimal: {biomarker.optimalRange}</p>
                              )}
                              <p>Measured: {biomarker.measuredAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Surface>
              );
            })}
          </div>
        </ReportSection>
      );
  }
};
