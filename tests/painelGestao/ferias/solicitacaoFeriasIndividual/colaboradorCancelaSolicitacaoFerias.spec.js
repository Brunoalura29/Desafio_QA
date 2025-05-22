import { FormatDate } from 'automacao-core-playwright';
import { request as playwrightRequest } from 'playwright';

import { Api } from '../../../../api';
import { JSON_INSERIRFERIAS } from '../../../../data/painelGestao/feriasJson';
import {
  contarValoresColaboradorG7,
  inserirPeriodosFeriasG5,
  excluirPeriodosFeriasG5,
  validarPeriodoInexistente,
} from '../../../../db/painelGestao/feriasDb';
import { test, expect, frame } from '../../../../helpers';
import { COLABORADOR56_AUTO02, TENANT_AUTO02 } from '../../../../helpers/ambiente';

test.describe('valida o cancelamento de uma solicitação de férias pelo colaborador', { tag: '@PARALELO_FERIAS_HCM' }, () => {
  let fimPeriodoCol56, inicioPeriodoCol56, limiteVencidasFeriasCol56, quantAntigaCol56;
  let api, context, page, requestContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    const formatDate = new FormatDate(page);

    requestContext = await playwrightRequest.newContext();
    api = new Api(requestContext);

    await excluirPeriodosFeriasG5(TENANT_AUTO02, 1, 1, 56);
    await validarPeriodoInexistente('nhcm', TENANT_AUTO02, 'vacationperiod', COLABORADOR56_AUTO02.employeeId);

    await api.setToken(COLABORADOR56_AUTO02);

    quantAntigaCol56 = await contarValoresColaboradorG7('nhcm', TENANT_AUTO02, 'vacationperiod', COLABORADOR56_AUTO02.employeeId);
    inicioPeriodoCol56 = formatDate.pegaDataComBarras(0, 0, -1, true) + ' 00:00:00';
    fimPeriodoCol56 = formatDate.pegaDataComBarras(0, +1, 0, true) + ' 00:00:00';
    limiteVencidasFeriasCol56 = formatDate.pegaDataComBarras(-1, -1, +1, true) + ' 00:00:00';

    await inserirPeriodosFeriasG5(TENANT_AUTO02, 1, {
      tipcol: '1',
      numcad: 56,
      iniper: inicioPeriodoCol56,
      fimper: fimPeriodoCol56,
      limcon: limiteVencidasFeriasCol56,
      qtdDir: 30,
      qtdSld: 30,
      sitPer: '0',
    });
  });

  test.beforeEach(async ({ page }) => {
    console.log(`Executando teste: ${test.info().title}`);
    await page.dataUtils.login(COLABORADOR56_AUTO02);
  });

  test.afterAll(async () => {
    console.log(`Finalizado teste: ${test.info().title} Status ${test.info().status}`);

    await context.close();
    await requestContext.dispose();
  });

  test('001 - Cancelar solicitação de férias - Colaborador.', { tag: '@SOLICITACAOFERIAS' }, async ({ request, page }) => {
    await page.feriasPage.validarIntegracaoPeriodosFeriasG7(
      TENANT_AUTO02,
      'vacationperiod',
      COLABORADOR56_AUTO02.employeeId,
      quantAntigaCol56,
      COLABORADOR56_AUTO02.name,
      50,
    );

    const idPeriodoFerias = await request.feriasApi.localizarIdPeriodoFerias(COLABORADOR56_AUTO02.employeeId);
    const dataSolicitarFerias = page.formatDate.pegaDataComBarras(1, 6, 0);
    const iniciarFerias = await page.feriasPage.calcularDataFerias(dataSolicitarFerias);
    const iniciarFeriasEng = await page.dataUtils.formataDataAmericano(iniciarFerias);

    JSON_INSERIRFERIAS.startDate = iniciarFeriasEng;
    JSON_INSERIRFERIAS.vacationDays = 20;
    JSON_INSERIRFERIAS.vacationBonusDays = 0;
    JSON_INSERIRFERIAS.has13thSalaryAdvance = false;
    JSON_INSERIRFERIAS.vacationPeriodId = idPeriodoFerias;
    JSON_INSERIRFERIAS.employeeId = COLABORADOR56_AUTO02.employeeId;

    await request.feriasApi.inserirFeriasColaborador(COLABORADOR56_AUTO02.employeeId, JSON_INSERIRFERIAS);
    await page.feriasPage.cancelarRequisicaoFerias();
    await expect(frame.getByText('Dados das férias')).toBeHidden();
  });
});
