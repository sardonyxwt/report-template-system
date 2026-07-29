import { Injectable } from '@nestjs/common';
import type { LaunchOptions } from 'puppeteer';

/**
 * Converts trusted server-generated report HTML into an A4 PDF.
 *
 * JavaScript and outbound browser requests are disabled to keep rendering
 * deterministic and prevent template markup from loading external resources.
 */
@Injectable()
export class ReportPdfService {
  /**
   * Renders an HTML document and returns the generated PDF bytes.
   */
  async render(html: string): Promise<Buffer> {
    const { launch } = await import('puppeteer');
    const browser = await launch(this.launchOptions());

    try {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        void request.abort();
      });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdf = await page.pdf({
        format: 'A4',
        preferCSSPageSize: true,
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private launchOptions(): LaunchOptions {
    const configuredPath = process.env['PUPPETEER_EXECUTABLE_PATH'];

    return {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // Use Puppeteer's pinned browser unless an operator explicitly overrides it.
      ...(configuredPath ? { executablePath: configuredPath } : {}),
    };
  }
}
