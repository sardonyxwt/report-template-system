import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import {
  ReportData,
  TemplateData,
  type ReportBlock,
  type TemplateBlock,
} from 'platform/prisma';

/**
 * Compiles report template blocks into a self-contained printable HTML page.
 *
 * Disabled blocks and blocks without corresponding report data are omitted.
 * The wrapper prevents scripts and external requests when the HTML is later
 * rendered by a browser.
 */
@Injectable()
export class ReportHtmlService {
  /**
   * Renders all enabled template blocks that have matching report data.
   */
  render(template: TemplateData, report: ReportData): string {
    const content = template.blocks
      .filter(({ enabled }) => enabled)
      .flatMap((templateBlock) =>
        report.blocks
          .filter((reportBlock) => reportBlock.type === templateBlock.type)
          .map((reportBlock) =>
            this.renderBlockContent(templateBlock, reportBlock.value),
          ),
      )
      .join('\n');

    return this.wrap(content);
  }

  /**
   * Renders one template block inside the same document shell used for PDFs.
   *
   * @throws {Error} When the preview report has no data for the block type.
   */
  renderBlock(
    templateBlock: Pick<TemplateBlock, 'type' | 'template'>,
    report: ReportData,
  ): string {
    const reportBlock = report.blocks.find(
      (block) => block.type === templateBlock.type,
    );

    if (!reportBlock) {
      throw new Error(`Preview data is missing for ${templateBlock.type}.`);
    }

    return this.wrap(this.renderBlockContent(templateBlock, reportBlock.value));
  }

  private renderBlockContent(
    templateBlock: Pick<TemplateBlock, 'type' | 'template'>,
    value: ReportBlock['value'],
  ): string {
    const renderBlock = Handlebars.compile(templateBlock.template);
    const blockHtml = renderBlock(value);

    return `<div class="report-block" data-report-block="${templateBlock.type}">${blockHtml}</div>`;
  }

  private wrap(content: string): string {
    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
          <title>Patient report</title>
          <style>
            @page {
              size: A4;
              margin: 18mm 16mm;
            }
      
            *,
            *::before,
            *::after {
              box-sizing: border-box;
            }
      
            html {
              color: #111827;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
            }
      
            body {
              margin: 0;
            }
      
            @media screen {
              html,
              body {
                width: 210mm;
                min-width: 210mm;
                min-height: 297mm;
              }
      
              .patient-report {
                width: 210mm;
                min-height: 297mm;
                padding: 18mm 16mm;
              }
            }
      
            .report-block {
              max-width: 100%;
              overflow-wrap: anywhere;
              break-inside: avoid;
            }
      
            .report-block + .report-block {
              margin-top: 10mm;
            }
      
            img,
            svg {
              max-width: 100%;
              height: auto;
            }
      
            table {
              width: 100%;
              border-collapse: collapse;
            }
      
            tr,
            img,
            blockquote {
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <main class="patient-report">
            ${content}
          </main>
        </body>
      </html>
    `;
  }
}
