import { Inject, Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import type { LaunchOptions } from 'puppeteer';
import { ReportData, TemplateData, type TemplateBlock } from 'platform/prisma';
import { ReportHtmlService } from './report-html.service';

/**
 * Captures a single rendered report block as a PNG for visual inspection.
 *
 * Browser JavaScript and all network requests are disabled during rendering.
 */
@Injectable()
export class ReportImageService {
  constructor(
    @Inject(ReportHtmlService)
    private readonly reportHtmlService: ReportHtmlService,
  ) {}

  /**
   * Renders the complete ordered template at the printable A4 viewport.
   */
  render(template: TemplateData, report: ReportData): Promise<Buffer> {
    return this.capture(
      this.reportHtmlService.render(template, report),
      '.patient-report',
    );
  }

  /**
   * Renders a block at the printable A4 viewport and returns its PNG bytes.
   */
  renderBlock(
    templateBlock: TemplateBlock,
    report: ReportData,
  ): Promise<Buffer> {
    return this.capture(
      this.reportHtmlService.renderBlock(templateBlock, report),
      `[data-report-block="${templateBlock.type}"]`,
    );
  }

  private async capture(html: string, selector: string): Promise<Buffer> {
    const { launch } = await import('puppeteer');
    const browser = await launch(this.launchOptions());

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        void request.abort();
      });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const element = await page.$(selector);

      if (!element) {
        throw new Error('Rendered report block could not be found.');
      }

      const image = await element.screenshot({
        type: 'png',
        omitBackground: false,
      });

      return Buffer.from(image);
    } finally {
      await browser.close();
    }
  }

  private launchOptions(): LaunchOptions {
    const configuredPath = process.env['PUPPETEER_EXECUTABLE_PATH'];
    const macOsChromePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const executablePath =
      configuredPath ??
      (process.platform === 'darwin' && existsSync(macOsChromePath)
        ? macOsChromePath
        : undefined);

    return {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(executablePath ? { executablePath } : {}),
    };
  }
}
