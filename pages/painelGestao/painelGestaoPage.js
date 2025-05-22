import { expect } from '@playwright/test';
import { DataUtils } from 'automacao-core-playwright';

const XPATH_DETALHARNOTIFICACAO_BUTTON = 'xpath=//td[.//text()[normalize-space() = "Solicitação de férias"]]';
const FRAME = 'iframe[name="ci"]';

export class PainelGestaoPage {
  /**
   * Constructor da classe
   * @param {object} page - Contexto da página do Playwright.
   */
  constructor(page) {
    this.page = page;
    this.dataUtils = new DataUtils(page);
    this.frame = page.frameLocator(FRAME);
    this.locatorResponsavelAnaliseText = this.frame.getByText('Responsável pela análise:');
    this.locatorAceitarButton = this.frame.getByRole('button', { name: 'Aceitar' });
    this.locatorSolicitacaoColaboradorAceitaText = this.frame.getByText('A solicitação do colaborador foi aceita.');
    this.locatorSolicitacaoColaboradorAceitaToastButton = this.frame.locator('.toast-close-button-x');
  }
  /**
   * Função que acessa e assume as solicitações no RH - tela Avaliação de solicitações.
   * @param {string} tipoSolicitacao qual o tipo de solicitação deve ser acessada
   * @param {string} nomeColaborador nome do colaborador
   */
  async entrarEAssumirSolicitacao(tipoSolicitacao, nomeColaborador) {
    const frame = this.page.frameLocator(FRAME);
    const tipoRequisicao = '#filterModel-requestType-';

    await this.dataUtils.navegarParaPagina('Gestão de Pessoas | HCM', 'Painel de gestão', 'Solicitações');
    await expect(frame.getByRole('heading', { name: 'Avaliação de solicitações' })).toBeVisible();

    await this.selecionarTipoSolicitacao(tipoSolicitacao, tipoRequisicao);

    const selector = '[aria-label="Ocultar pesquisa"]';
    await this.ocultarPesquisa(selector);

    await this.procurarEVisualizarColaborador(nomeColaborador, frame);

    await expect(frame.getByRole('heading', { name: 'Solicitações dos colaboradores' })).toBeVisible();
    await frame.getByRole('button', { name: 'Assumir' }).click();
  }
  /**
   * Seleciona o tipo de solicitação na página.
   * @param {string} tipoSolicitacao - O tipo de solicitação a ser selecionado.
   * @param {string} tipoRequisicao - O seletor do tipo de solicitação.
   * @throws {Error} Se o tipo de solicitação não for reconhecido.
   */
  async selecionarTipoSolicitacao(tipoSolicitacao, tipoRequisicao) {
    const opcoes = {
      documento: 'DOCUMENT',
      endereco: 'ADDRESS',
      'dados pessoais': 'PERSONAL_DATA',
      'formacao academica': 'EDUCATION',
      contato: 'CONTACT',
      'ficha familiar': 'DEPENDENT_UPDATE',
      idiomas: 'LANGUAGE',
      'registro profissinal': 'PROFESSIONAL_REGISTER',
      treinamentos: 'EXTRA_EDUCATION',
      ferias: 'VACATION',
    };

    const tipo = tipoSolicitacao.toLowerCase();
    if (opcoes[tipo]) {
      await this.page.frameLocator(FRAME).locator(tipoRequisicao).selectOption(opcoes[tipo]);
    } else {
      throw new Error(`Tipo de solicitação '${tipoSolicitacao}' não reconhecido.`);
    }
  }
  /**
   * Oculta a pesquisa na página se o botão estiver visível.
   * @param {string} selector - O seletor do botão para ocultar a pesquisa.
   */
  async ocultarPesquisa(selector) {
    if ((await this.page.$(selector)) !== null) {
      await this.page.click(selector);
    }
  }
  /**
   * Procura o colaborador na tabela e visualiza a solicitação.
   * @param {string} nomeColaborador - Nome do colaborador a ser encontrado.
   * @param {object} frame - O frame onde a tabela está localizada.
   * @throws {Error} Se o nome do colaborador não aparecer após várias tentativas.
   */
  async procurarEVisualizarColaborador(nomeColaborador, frame) {
    let nomeApareceu = false;
    for (let tentativa = 1; tentativa <= 20; tentativa++) {
      const linhaColaborador = await this.dataUtils.encontrarValorNaTabela('table.table tbody tr', nomeColaborador);
      if (linhaColaborador !== null) {
        const buttonAcoes = await linhaColaborador.$('button:has(span:has-text("Ações"))');
        await buttonAcoes.evaluate((button) => button.click({ force: true }));

        const linkVisualizar = await linhaColaborador.$('a:has(span:has-text("Visualizar"))');
        await linkVisualizar.evaluate((button) => button.click({ force: true }));

        nomeApareceu = true;
        break;
      } else {
        await this.page.reload();
        await expect(frame.getByRole('heading', { name: 'Avaliação de solicitações' })).toBeVisible();
      }
    }
    if (!nomeApareceu) {
      throw new Error(`O nome do colaborador '${nomeColaborador}' não apareceu após várias tentativas.`);
    }
  }
  /**
   * Função que acessa as notificações da plataforma.
   * @param {string} textoNotificacao texto da notificação;
   * @param {string} linkNotificacao texto da notificação dentro do link;
   * @param {string} drilldown deve fazer o detalhamento da notificação;
   */
  async acessarNotificacaoFerias(textoNotificacao, linkNotificacao, drilldown) {
    const frame = this.page.frameLocator(FRAME);
    await this.page.locator('[id="menu-item-Notificações"]').click();
    await this.page.getByRole('link', { name: 'Visualizar todas as notificações ' }).click();
    await expect(frame.locator('tbody')).toContainText(textoNotificacao);

    const thead = await frame.locator('table thead.ui-table-thead').elementHandles();
    const cabecalho = await thead[0].$$('th');
    await cabecalho[0].click();
    await frame.getByRole('button', { name: 'Marcar como lida' }).click();
    await frame.getByText('As notificações foram marcadas como lidas').click();

    if (drilldown === true) {
      await frame.locator(XPATH_DETALHARNOTIFICACAO_BUTTON).click();
      await expect(frame.getByRole('link', { name: linkNotificacao })).toBeVisible();
      await expect(frame.getByText('Painel de gestão')).toBeVisible();
    }
    const linhaNotificacao = await this.page.dataUtils.encontrarLinhaDaNotificacaoNaTabela('Solicitação de férias', textoNotificacao);

    if (linhaNotificacao !== null) {
      const celulas = await linhaNotificacao.$$('td');
      await celulas[2].click();
    }
  }
  /**
   * Função que valida notificação de assinatura
   * @param { string } email email do solicitando
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async validarNotificacaoAssinaturaPage(email, request) {
    let i = 0;
    const contador = 20;
    let idResultado = null;

    while (i < contador && idResultado === null) {
      // Obter a lista de notificações
      const notificationResponse = await request.api.buscaNotificacao(email);
      // Verificar se a resposta contém notificações
      if (notificationResponse && notificationResponse.listInformation && notificationResponse.listInformation.totalElements) {
        idResultado = notificationResponse.listInformation.totalElements;
        console.log(`Notificação encontrada com ID: ${idResultado}`);
        return; // Notificação encontrada, sair da função
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`Notificação não localizada, tentativa ${i}`);
      i++;
    }

    // Se sair do loop sem encontrar a notificação, lançar um erro
    throw new Error(`Notificação do colaborador '${email}' não apareceu após várias tentativas.`);
  }

  /**
   * Função que aprova a solicitação das alterações por tela.
   * @param {string} employeeId employeeId id do RH que fará a aprovação
   * @param {string} tipoSolicitacao tipo de solicitação
   * @param {string} idEmploeeySolicitante informar o id do colaborador solicitante
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async aceitarSolicitacaoPorTela(employeeId, tipoSolicitacao, idEmploeeySolicitante, request) {
    const idSolicitacao = await request.painelGestaoApi.painelGestaoRequests(employeeId, tipoSolicitacao, idEmploeeySolicitante);
    await expect(this.locatorResponsavelAnaliseText).toBeVisible();
    await this.locatorAceitarButton.click();
    await expect(this.locatorSolicitacaoColaboradorAceitaText).toBeVisible();
    await this.locatorSolicitacaoColaboradorAceitaToastButton.click();
    await request.painelGestaoApi.validaIntegracaoSolicitacao(idSolicitacao);
  }
}
