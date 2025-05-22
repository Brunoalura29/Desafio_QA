import { test, expect, frame } from '../../../helpers';
import { COLABORADOR01_AUTO01, COLABORADOR5_AUTO04, COLABORADOR8_AUTO04 } from '../../../helpers/ambiente';
import {
  PAINELGESTAO_FERIAPROGRAMADAS,
  PAINELGESTAO_AGURDANDOAPROVACAOFERIAS,
  PAINELGESTAO_CALENDARIOFERIAS,
  PAINELGESTAO_FERIASCALCULADAS,
  PAINELGESTAO_EMABERTO,
  PAINELGESTAO_PROGRAMARFERIAS,
  PAINELGESTAO_MINHASFERIAS,
  PAINELGESTAO_POLITICAFERIAS,
  PAINELGESTAO_CALENDARIOEQUIPE,
} from '../../../helpers/navegacao';

const ID_FIELD_FILTER = 's-dynamic-field';
const LABEL_PERIODOSABERTOS = 'Períodos em aberto';
const NAME_PROGRAMARFERIAS_BUTTON = 'Programar férias';
const TITULO_PERIODOABERTO_PAGINA = 'Períodos de férias em aberto';
const TITULO_PROGRAMACAOFERIAS_PAGINA = 'Minhas férias';

test.describe('testes de abre telas do módulo férias', { tag: ['@PARALELO_FERIAS_HCM', '@ABRETELASFERIASPARALELO'] }, () => {
  test.beforeEach(async () => {
    console.log(`Executando teste: ${test.info().title}`);
  });

  test('001 - Férias - Política de Férias.', { tag: '@ABRETELASFERIASPOLITICAFERIAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_POLITICAFERIAS.DIRETORIO);

    await expect(frame.getByRole('heading', { name: 'Política de Férias' })).toBeVisible();
    await expect(frame.getByText('Políticas')).toBeVisible();
    await frame.locator('#ui-panel-0 div').filter({ hasText: 'Filtros' }).click();

    await page.dataUtils.validaSemMsgErroEmTela();

    await frame.getByText('Filtros').click();
    await expect(frame.locator(ID_FIELD_FILTER)).toContainText('Nome da Política');
    await expect(frame.locator(ID_FIELD_FILTER)).toContainText('Empresa');
    await expect(frame.locator(ID_FIELD_FILTER)).toContainText('Filial');

    await page.dataUtils.validaSemMsgErroEmTela();

    await frame.getByRole('button', { name: 'Nova política' }).click();
    await expect(frame.getByText('Nome da Política')).toBeVisible();
    await expect(frame.getByRole('group', { name: 'Programação de férias' }).locator('a')).toBeVisible();
    await expect(frame.getByRole('group', { name: 'Abono de férias' }).locator('a')).toBeVisible();
    await expect(frame.getByRole('group', { name: 'Saldo de férias' }).locator('a')).toBeVisible();
    await expect(frame.getByRole('group', { name: '13º Salário' }).locator('a')).toBeVisible();
    await frame.getByRole('link', { name: 'Política de Férias' }).click();
    await frame.getByRole('button', { name: 'Ações' }).click();
    await frame.locator('a').filter({ hasText: 'Editar' }).click();

    await page.dataUtils.validaSemMsgErroEmTela();

    await frame.getByRole('button', { name: 'Selecionar empresas' }).click();
    await expect(frame.locator('p-header')).toContainText('Escolha uma ou mais empresas e filiais');
    await page.dataUtils.validaSemMsgErroEmTela();
    await frame.getByRole('button', { name: 'Salvar' }).click();
    await expect(frame.getByRole('button', { name: 'Nova política' })).toBeVisible();

    await page.dataUtils.validaSemMsgErroEmTela();
  });

  test('002 - Férias - Calendário.', { tag: '@ABRETELASFERIASCALENDARIOFERIAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_CALENDARIOFERIAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: 'Calendário' })).toBeVisible();
    await expect(frame.getByText('Pendentes com o gestor')).toBeVisible();
    await expect(frame.getByText('Pendentes com o RH')).toBeVisible();
    await expect(frame.getByText('Programadas')).toBeVisible();
    await expect(frame.getByText('Calculadas')).toBeVisible();
  });

  test('003 - Férias da equipe - Calculadas.', { tag: '@ABRETELASFERIASFERIASCALCULADAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_FERIASCALCULADAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByText('Nenhum recibo foi encontrado')).toBeVisible();
    await expect(frame.getByText('Filtros')).toBeVisible();
  });

  test('004 - Férias da equipe - Calendário.', { tag: '@ABRETELASFERIASCALENDARIOFERIASEQUIPE' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_CALENDARIOEQUIPE.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();
    await expect(frame.getByRole('heading', { name: 'Calendário' })).toBeVisible();
    await expect(frame.getByText('Minhas pendências')).toBeVisible();
    await expect(frame.getByText('Pendentes com o RH')).toBeVisible();
    await expect(frame.getByText('Programadas')).toBeVisible();
    await expect(frame.getByText('Calculadas')).toBeVisible();
    await expect(frame.getByRole('button', { name: NAME_PROGRAMARFERIAS_BUTTON })).toBeVisible();
    await frame.getByRole('button', { name: NAME_PROGRAMARFERIAS_BUTTON }).click();

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading')).toContainText('Solicitar férias para a equipe');
    await expect(frame.getByText('Dados das férias')).toBeVisible();
    await expect(frame.getByText('Colaborador', { exact: true })).toBeVisible();
    await expect(frame.getByText('Dias de férias', { exact: true })).toBeVisible();
    await expect(frame.getByText('Período aquisitivo', { exact: true })).toBeVisible();
    await expect(frame.getByText('Adiantamento de décimo terceiro salário', { exact: true })).toBeVisible();
  });

  test('005 - Férias da equipe - Em aberto.', { tag: '@ABRETELASFERIASFERIASEMABERTO' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_EMABERTO.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: TITULO_PERIODOABERTO_PAGINA })).toBeVisible();
    await expect(frame.getByRole('tab', { name: 'Período concessivo vencido' })).toBeVisible();
    await expect(frame.getByRole('tab', { name: 'Período concessivo a vencer nos próximos 90 dias' })).toBeVisible();
    await expect(frame.getByRole('tab', { name: 'Período concessivo a vencer a partir de 90 dias e até 180 dias' })).toBeVisible();
    await expect(frame.getByText('Filtros')).toBeVisible();
    await frame.locator('xpath=//tr[1]/td[7]/button').click();
    await expect(frame.getByRole('cell', { name: 'Saldo (dias)' })).toBeVisible();
    await expect(frame.locator('tbody', { name: 'Colaborador' })).toBeVisible();

    await frame.getByRole('link', { name: TITULO_PERIODOABERTO_PAGINA }).click();
    await frame.getByRole('button', { name: NAME_PROGRAMARFERIAS_BUTTON }).click();

    await expect(frame.getByText('Dados das férias')).toBeVisible();
    await expect(frame.getByText('INFORMAÇÕES COLETIVAS')).toBeVisible();

    await frame.getByRole('link', { name: TITULO_PERIODOABERTO_PAGINA }).click();
    await expect(frame.getByRole('heading', { name: TITULO_PERIODOABERTO_PAGINA })).toBeVisible();
  });

  test('006 - Férias da equipe - Programar férias.', { tag: '@ABRETELASFERIASPROGRAMARFERIAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_PROGRAMARFERIAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: 'Solicitar férias para a equipe' })).toBeVisible();

    await expect(frame.getByText('Colaborador', { exact: true })).toBeVisible();
    await expect(frame.getByText('Dias de férias')).toBeVisible();
    await expect(frame.getByText('Período aquisitivo', { exact: true })).toBeVisible();
    await expect(frame.getByText('Adiantamento de décimo terceiro salário')).toBeVisible();
    await frame.locator('#uniform-vacation-team-request-showBonusDays span').click();

    await page.dataUtils.validaSemMsgErroEmTela();
  });

  test('007 - Minhas férias.', { tag: '@ABRETELASFERIASMINHASFERIAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR8_AUTO04);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_MINHASFERIAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: TITULO_PROGRAMACAOFERIAS_PAGINA })).toBeVisible();

    await expect(frame.getByRole('body')).toBeHidden('{{"hcm.hcm.Periodo_aquisitivo" | translate}}');
    await expect(frame.getByText(LABEL_PERIODOSABERTOS)).toBeVisible();
    await expect(frame.getByText('Períodos quitados')).toBeVisible();

    await frame.getByRole('link', { name: 'Solicitar férias' }).click();
    await expect(frame.getByText('DADOS DAS FÉRIAS')).toBeVisible();
    await expect(frame.getByText('Gostaria de iniciar as férias em:')).toBeVisible();
    await expect(frame.getByText('COMPROVANTES')).toBeVisible();
    await frame.getByRole('link', { name: TITULO_PROGRAMACAOFERIAS_PAGINA }).click();
    await expect(frame.getByText(LABEL_PERIODOSABERTOS)).toBeVisible();

    await frame.locator('[id="_vacation-period-botoes-sub-item-00"]').click();
    await expect(frame.getByText('Não existe comprovante na solicitação.')).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Cancelar a solicitação' })).toBeVisible();

    await frame.getByRole('link', { name: TITULO_PROGRAMACAOFERIAS_PAGINA }).click();
    await expect(frame.getByText(LABEL_PERIODOSABERTOS)).toBeVisible();
  });

  test('008 - Férias da equipe - Aguardando aprovação.', { tag: '@ABRETELASFERIASAGUARDARAPROVACAOFERIAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR5_AUTO04);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_AGURDANDOAPROVACAOFERIAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: 'Férias aguardando aprovação' })).toBeVisible();

    await expect(frame.getByRole('link', { name: 'Visualizar' })).toBeVisible();
    await expect(frame.getByText('Filtros')).toBeVisible();
    await expect(frame.getByRole('tab', { name: 'Minhas pendências' })).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Colaborador' })).toBeVisible();
    await frame.getByRole('link', { name: 'Visualizar' }).click();
    await expect(frame.getByRole('heading', { name: 'Solicitação de programação de férias do liderado' })).toBeVisible();
  });

  test('009 - Férias da equipe - Programadas.', { tag: '@ABRETELASFERIASFERIASPROGRAMADAS' }, async ({ page }) => {
    await page.dataUtils.login(COLABORADOR01_AUTO01);
    await page.dataUtils.navegarParaPagina(...PAINELGESTAO_FERIAPROGRAMADAS.DIRETORIO);

    await page.dataUtils.validaSemMsgErroEmTela();

    await expect(frame.getByRole('heading', { name: 'Férias programadas' })).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await frame.locator('[id="_filter-1499435294916"]').click({ force: true });
    await expect(frame.locator('[id="filter-jobPosition"]')).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Filtrar' })).toBeVisible();
  });
});
