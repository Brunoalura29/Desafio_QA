import { test as base, expect, chromium } from '@playwright/test';
import { DataUtils, FormatDate } from 'automacao-core-playwright';

import { Api } from '../api';
import { FeriasApi } from '../api/painelGestao/feriasApi';
import { FeriasPage } from '../pages/painelGestao/ferias/feriasPage';
import { PainelGestaoPage } from '../pages/painelGestao/painelGestaoPage';

let frame;

const test = base.extend({
  /**
   * Estende o contexto da página para incluir objetos personalizados (Page Objects).
   * @param {object} root0 - Objeto de contexto do Playwright.
   * @param {object} root0.page - Contexto da página do Playwright.
   * @param {Function} use Função fornecida pelo Playwright para passar o contexto estendido.
   */
  page: async ({ page }, use) => {
    const context = page;

    context['dataUtils'] = new DataUtils(page);
    context['formatDate'] = new FormatDate(page);
    context['painelGestaoPage'] = new PainelGestaoPage(page);
    context['feriasPage'] = new FeriasPage(page);

    frame = page.frameLocator('iframe[name="ci"]');

    await use(context);
  },
  /**
   * Estende o contexto de requisição para incluir APIs personalizadas.
   * @param {object} root0 - Objeto de contexto do Playwright.
   * @param {object} root0.request - Contexto de requisição do Playwright.
   * @param {Function} use Função fornecida pelo Playwright para passar o contexto estendido.
   */
  request: async ({ request }, use) => {
    const context = request;
    context['api'] = new Api(request);
    context['feriasApi'] = new FeriasApi(request);

    await use(context);
  },
  /**
   * Gerencia o ciclo de vida do navegador.
   * @param {Function} use Função fornecida pelo Playwright para passar o navegador.
   */
  browser: async ({}, use) => {
    const browser = await chromium.launch();
    await use(browser);
    await browser.close();
  },
});

export { test, expect, frame };
