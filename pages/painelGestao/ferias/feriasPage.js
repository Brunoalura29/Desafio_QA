import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';
import { DataUtils, FormatDate } from 'automacao-core-playwright';
import { differenceInCalendarMonths, parse, isSameDay, addDays } from 'date-fns';
import { format } from 'date-fns';

import { JSON_ACEITASOLICITACAO, JSON_FILTROVAZIO, JSON_APROVACAOSOLICITACAO } from '../../../data/painelGestao/feriasJson';
import { contarValoresColaboradorG7, contarValoresScheduleG7 } from '../../../db/painelGestao/feriasDb';
import {
  PAINELGESTAO_SOLICITACOES,
  PAINELGESTAO_PROGRAMARFERIAS,
  PAINELGESTAO_MINHASFERIAS,
  PAINELGESTAO_FERIAPROGRAMADAS,
  PAINELGESTAO_AGURDANDOAPROVACAOFERIAS,
} from '../../../helpers/navegacao.js';

const FRAME = 'iframe[name="ci"]';
const ID_DETALHEFERIAS = '[id="_vacation-period-botoes-sub-item-00"]';
const ID_MENSAGEMCANCELARFERIAS = '[id="_messages-1499435368622"]';
const CLASS_TOSATMESSAGE = '.toast-message';
const ID_INICIARASFERIASEM_INPUT = '[id="vacation-employee-startDate"]';
const ID_INICIARASFERIASEMEQUIPE_INPUT = '[id="vacation-team-request-startDate"]';
const ID_AQUISITIVOEQUIPE_INPUT = '[id="index-1499435453370"]';
const ID_DIASDEFERIASGESTRO_INPUT = '[id="vacation-team-request-vacationDays"]';
const ID_ABONO_CHECKBOX = '#uniform-vacation-employee-showBonusDays span';
const CLASS_AVANCARCALENDARIO_BUTTON = '.fc-icon-right-single-arrow';
const ID_CORPOCALENDARIO_BODY = '[id="index-1499435453678"]';
const ID_PERIODOAQUISITIVO_SPAN = '[id="ui-select-choices-row-1-0"]';
const ID_QTDPARCELAS_DIV = '[id="vacation-employee-vacationDiscountInstallments"]';
const ID_PARCELASFERIAS_BUTTON = '#uniform-vacation-employee-wantInstallmentOfVacationDiscount span';
const CSS_LINHA_TABELA = 'table.table tbody tr';
const CSS_SELECTBOX = 'Select box';
const STRING_FERIASPROGRAMADAS_TITLEPAGE = 'Férias programadas';
const STRING_AGUARDANDOAPROVACAO_TITLEPAGE = 'Aguardando aprovação de férias';
const STRING_DIASABONO_INFOGRID = 'Dias de abono';

const feriados = [
  { dia: '01/01', ajuste: 3 },
  { dia: '21/04', ajuste: 3 },
  { dia: '01/05', ajuste: 3 },
  { dia: '30/05', ajuste: 3 },
  { dia: '02/09', ajuste: 3 },
  { dia: '07/09', ajuste: 3 },
  { dia: '12/10', ajuste: 3 },
  { dia: '02/11', ajuste: 3 },
  { dia: '15/11', ajuste: 3 },
  { dia: '25/12', ajuste: 3 },
];

export class FeriasPage {
  /**
   * Constructor da classe
   * @param {object} page - Contexto da página do Playwright.
   */
  constructor(page) {
    this.page = page;
    this.dataUtils = new DataUtils(page);
    this.formatDate = new FormatDate(page);
    this.frame = page.frameLocator(FRAME);
    this.locatorNenhumaProgramacaoEncontrada = this.frame.getByText('Nenhuma programação foi encontrada.');
  }
  /**
   * Função prenhe todos os campos da tela "Solicitar férias" - Colaborador.
   * @param {number} diasFerias quantidade de dias de férias
   * @param {number} diasAbono quantidade de dias de abono
   * @param {data} iniciarFerias data para o inicio das férias - 15/01/2021; calcularDataFerias()
   * @param {boolean} feriasParceladas true para parcelar férias
   */
  async solicitarFeriasColaborador(diasFerias, diasAbono, iniciarFerias, feriasParceladas) {
    const frame = this.page.frameLocator(FRAME);
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_MINHASFERIAS.DIRETORIO);
    await expect(frame.getByText('Você não possui solicitação de férias para esse período.')).toBeVisible();
    await expect(frame.getByRole('cell', { name: 'Período aquisitivo' })).toBeVisible();
    await expect(frame.getByRole('cell', { name: 'Saldo de férias' })).toBeVisible();
    await frame.getByText('Solicitar férias').click();
    await expect(frame.getByText('Período aquisitivo', { exact: true })).toBeVisible();
    await frame.locator('#vacation-employee-vacationDays').fill(diasFerias.toString());
    await frame.locator(ID_INICIARASFERIASEM_INPUT).fill(iniciarFerias);
    await frame.locator(ID_INICIARASFERIASEM_INPUT).press('Enter');
    if (diasAbono > 0) {
      await frame.locator(ID_ABONO_CHECKBOX).click();
      await frame.getByLabel(STRING_DIASABONO_INFOGRID).fill(diasAbono.toString());
    }
    if (feriasParceladas) {
      const Parcelas = faker.number.int({ min: 2, max: 5 });
      await frame.locator(ID_PARCELASFERIAS_BUTTON).click();
      await frame.locator(ID_QTDPARCELAS_DIV).getByLabel('Select box activate').click();
      await frame.getByRole('searchbox', { name: CSS_SELECTBOX }).fill(Parcelas.toString());
      await frame.locator('span').filter({ hasText: 'parcelas' }).click();
    }
  }
  /**
   * Função prenhe todos os campos da tela "Solicitar férias para a equipe" - férias individuais - Gestor.
   * @param {number} diasFerias quantidade de dias de férias
   * @param {number} diasAbono quantidade de dias de abono
   * @param {string} nomeColaborador nome do colaborador;
   * @param {data} dataInicioFerias data para o inicio das férias - 15/01/2021;
   * @param {data} dataInicialPeriodo data do inicio do período de férias - 15/01/2021;
   */
  async solicitarFeriasGestorIndividual(diasFerias, diasAbono, nomeColaborador, dataInicioFerias, dataInicialPeriodo) {
    const frame = this.page.frameLocator(FRAME);
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_PROGRAMARFERIAS.DIRETORIO);
    await expect(frame.getByRole('heading', { name: 'Solicitar férias para a equipe' })).toBeVisible();

    await frame.locator('[id="_observation-1499435453550"]').click();
    await frame.locator('#commentary').fill('Solicitação Indiviadual - ' + this.formatDate.pegaDataComBarras());

    await frame.getByText('Informe um colaborador').click();
    await frame.getByRole('searchbox', { name: CSS_SELECTBOX }).fill(nomeColaborador);
    await frame.getByText(nomeColaborador).click();

    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).fill(dataInicioFerias);
    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).press('Enter');

    await frame.locator(ID_DIASDEFERIASGESTRO_INPUT).fill(diasFerias.toString());

    if (diasAbono > 0) {
      await frame.locator(ID_ABONO_CHECKBOX).click();
      await frame.getByLabel(STRING_DIASABONO_INFOGRID).fill(diasAbono.toString());
    }

    const periodoAquisitivo = await frame.locator(ID_AQUISITIVOEQUIPE_INPUT).elementHandle();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await periodoAquisitivo.click({ force: true });
    await frame.getByText(dataInicialPeriodo).click();
  }
  /**
   * Função que prenhe apenas os campos "Colaborador" e  Período aquisitivo da tela "Solicitar férias para a equipe" - férias coletivas - Gestor.
   * @param {string} nomeColaborador nome do colaborador que será dolicitado férias;
   */
  async adicionarColaboradoresFerias(nomeColaborador) {
    const frame = this.page.frameLocator(FRAME);
    // Seleciona colaborador
    await frame.getByText('Informe um colaborador').click();
    await frame.getByRole('searchbox', { name: CSS_SELECTBOX }).fill(nomeColaborador);
    await frame.getByText(nomeColaborador).click();
    await this.selecionaPeriodoAquisitivo();
  }
  /** Função que seleciona um periodo aquisitivo na tela 'Solicitar férias'.*/
  async selecionaPeriodoAquisitivo() {
    const frame = this.page.frameLocator(FRAME);

    const periodoAquisitivo = await frame.locator(ID_AQUISITIVOEQUIPE_INPUT).elementHandle();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await periodoAquisitivo.click({ force: true });
    await frame.locator(ID_PERIODOAQUISITIVO_SPAN).click();
  }
  /**
   * Função exclui as informações do campo informado e valida se o botão "Salvar e Enviar" está desabilitado na tela: "Solicitar férias" - Colaborador.
   * @param {string} elementoCampo elemento correspondente ao campo onde deve ser clicado;
   * @param {string} elementoDesabilitado elemento a ser validado desabilitado;
   * @param {string} mensagem mensagem de erro que deve ser validada na tela;
   */
  async excluiInformacaoSolicitarFerias(elementoCampo, elementoDesabilitado, mensagem) {
    const frame = this.page.frameLocator(FRAME);
    await this.page.dataUtils.limparCampo(elementoCampo);
    await frame.getByText('Dados das férias').click();
    await this.verificaElementoDesabilitado(elementoDesabilitado, true);
    await expect(frame.getByText(mensagem)).toBeVisible();
  }
  /**
   * Função que prenhe todos os campos da tela "Solicitar férias para a equipe" - férias coletivas - Gestor.
   * @param {number} diasFerias quantidade de dias de férias
   * @param {number} diasAbono quantidade de dias de abono
   * @param {data} dataInicioFerias data para o inicio das férias - 15/01/2021;
   */
  async solicitarFeriasGestorColetivas(diasFerias, diasAbono, dataInicioFerias) {
    const frame = this.page.frameLocator(FRAME);

    const iniciarFerias = await this.calcularDataFerias(dataInicioFerias);

    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).fill(iniciarFerias);
    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).press('Enter');

    await frame.locator(ID_DIASDEFERIASGESTRO_INPUT).fill(diasFerias.toString());

    if (diasAbono > 0) {
      await frame.locator(ID_ABONO_CHECKBOX).click();
      await frame.getByLabel(STRING_DIASABONO_INFOGRID).fill(diasAbono.toString());
    }
  }
  /**
   * Função que preenche os campos da tela "Solicitar férias para a equipe" - férias coletivas - Gestor.
   */
  async cancelarRequisicaoFerias() {
    const frame = this.page.frameLocator(FRAME);

    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_MINHASFERIAS.DIRETORIO);
    await frame.locator(ID_DETALHEFERIAS).click();
    await frame.getByRole('button', { name: 'Cancelar a solicitação' }).click();
    await expect(frame.locator(ID_MENSAGEMCANCELARFERIAS)).toHaveText('Você tem certeza que deseja cancelar essa solicitação?');
    await frame.getByRole('button', { name: 'Sim, quero cancelar' }).click();
    await expect(frame.locator(CLASS_TOSATMESSAGE)).toHaveText('A solicitação de programação de férias foi cancelada.');
  }
  /**
   * Monitora a integração G5/G7 do período de férias.
   * @param {string} tenant - Nome do tenant para consulta (G7).
   * @param {string} tabela - Nome da tabela para consulta (G7).
   * @param {string} idemployee - ID do colaborador na G7.
   * @param {string} quantAntiga - Quantidade anterior.
   * @param {string} nomeColaboradorIntegrado - Nome do colaborador integrado para a G7.
   * @param {number} qauntRepeticao - Quantidade de vezes do laço de repetição.
   */
  async validarIntegracaoPeriodosFeriasG7(tenant, tabela, idemployee, quantAntiga, nomeColaboradorIntegrado, qauntRepeticao) {
    let contador = 1;
    let quantAtual = 0;

    do {
      quantAtual = await contarValoresColaboradorG7('nhcm', tenant, tabela, idemployee);
      console.log(`Integração não localizada, tentativa ${contador}`);
      contador++;
    } while (quantAtual <= quantAntiga && contador <= qauntRepeticao);

    if (quantAtual > quantAntiga) {
      console.log(`O período de férias do colaborador: ${nomeColaboradorIntegrado}, foi integrado com sucesso na G7`);
    } else {
      throw new Error(`Não foi integrado o período de férias para: ${nomeColaboradorIntegrado}, após ${qauntRepeticao} tentativas`);
    }
  }
  /**
   * Função que monitora se a solicitação já está visível para o Gestor.
   * @param {string} idGestor employeeId id do Gestor que fará a aprovação
   * @param {number} quantRepeticao quantidade de vezes do laço de repetição
   * @param {string} idColaborador employeeId do liderado que fez a solicitação de férias
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async validarPendenciaAprovacaoExistenteGestor(idGestor, quantRepeticao, idColaborador, request) {
    const frame = this.page.frameLocator(FRAME);
    let contador = 1;
    let valor = false;

    // Repetir a requisição até o máximo de tentativas ou até encontrar o valor esperado
    while (!valor && contador <= quantRepeticao) {
      try {
        // Tentativa de encontrar a pendência via API
        valor = await request.feriasApi.pendenciaAprovacaoFeriasGestor(idGestor, idColaborador);

        if (valor) {
          console.log(`Pendência localizada na tentativa ${contador}`);
          break; // Sai do loop se encontrar o valor
        } else {
          console.log(`Pendência não localizada, tentativa ${contador}`);
        }
      } catch (error) {
        throw new Error(`Erro ao consultar a pendência na tentativa ${contador}:`, error.message);
      }

      // Espera incremental (exponencial backoff)
      const tempoEspera = Math.min(500 * Math.pow(2, contador), 15000);
      await new Promise((resolve) => setTimeout(resolve, tempoEspera));
      contador++;
    }

    // Se o valor foi encontrado, prosseguir com a navegação na interface do usuário
    if (valor) {
      await this.dataUtils.navegarParaPagina(...PAINELGESTAO_AGURDANDOAPROVACAOFERIAS.DIRETORIO);

      // Verifica se o título correto da página está visível
      await expect(frame.getByRole('heading', { name: STRING_AGUARDANDOAPROVACAO_TITLEPAGE })).toBeVisible();
    } else {
      // Se não foi encontrado após as tentativas, lança erro
      throw new Error(`Não foi localizada a pendência de solicitação de férias do colaborador após ${quantRepeticao} tentativas.`);
    }
  }
  /**
   * Função que monitora se a solicitação já está visível para o Gestor Delegado
   * @param {string} idGestorDelegado id do Gestor Delegado que fará a aprovação
   * @param {string} idGestor id do Gestor Titular
   * @param {number} quantRepeticao quantidade de vezes do laço de repetição
   * @param {string} nomeLiderado nome do liderado que fez a solicitação de férias
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async validarPendenciaAprovacaoExistenteGestorDelegado(idGestorDelegado, idGestor, quantRepeticao, nomeLiderado, request) {
    const frame = this.page.frameLocator(FRAME);
    JSON_FILTROVAZIO.employeeId = idGestorDelegado;
    let contador = 1;
    let valor = await request.feriasApi.pendenciaAprovacaoFeriasGestorDelegado(idGestorDelegado, idGestor, JSON_FILTROVAZIO, nomeLiderado);

    while (!valor && contador <= quantRepeticao) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      valor = await request.feriasApi.pendenciaAprovacaoFeriasGestorDelegado(idGestorDelegado, idGestor, JSON_FILTROVAZIO, nomeLiderado);
      if (!valor) {
        console.log(`ID não localizada, tentativa ${contador}`);
        contador++;
      }
    }
    if (valor) {
      await this.dataUtils.navegarParaPagina(...PAINELGESTAO_AGURDANDOAPROVACAOFERIAS.DIRETORIO);
      await expect(frame.getByRole('heading', { name: STRING_AGUARDANDOAPROVACAO_TITLEPAGE })).toBeVisible();
    }
    if (contador >= quantRepeticao) {
      throw new Error(
        `Não está sendo demonstrada a pendência de solicitação de férias, feita pelo liderado: ${nomeLiderado}, após ${quantRepeticao} tentativas`,
      );
    }
  }
  /**
   * Função que monitora se a solicitação já está visível para o Gestor.
   * @param {string} idGestor employeeId id do Gestor que fará a aprovação
   * @param {number} quantRepeticao quantidade de vezes do laço de repetição
   * @param {string} nomeLiderado nome do liderado que fez a solicitação de férias
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async validarFeriasProgramadasGestor(idGestor, quantRepeticao, nomeLiderado, request) {
    const frame = this.page.frameLocator(FRAME);

    let contador = 1;
    let valor = await request.feriasApi.feriasProgramadasGestor(idGestor);

    while (!valor && contador <= quantRepeticao) {
      valor = await request.feriasApi.feriasProgramadasGestor(idGestor);

      const delay = Math.min(500 * Math.pow(2, contador), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!valor) {
        console.log(`Pendência não localizada, tentativa ${contador}`);
        contador++;
      }
    }
    if (valor) {
      await this.dataUtils.navegarParaPagina(...PAINELGESTAO_FERIAPROGRAMADAS.DIRETORIO);
      await expect(frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();
    }
    if (contador >= quantRepeticao) {
      throw new Error(
        `Não está sendo demonstrada a pendência de solicitação de férias, feita pelo liderado: ${nomeLiderado}, após ${quantRepeticao} tentativas`,
      );
    }
  }
  /**
   * Função que aprova as solicitçoes de férias pela tela de "Aguardando aprovação de férias/Solicitação de programação de férias".
   * @param {string} nomeColaborador nome do colaborador a ser aprovado
   */
  async aceitarSolicitacaoFeriasGestor(nomeColaborador) {
    const frame = this.page.frameLocator(FRAME);
    let nomeApareceu = false;
    try {
      for (let tentativa = 1; tentativa <= 15; tentativa++) {
        const linhaColaborador = await this.dataUtils.encontrarValorNaTabela(CSS_LINHA_TABELA, nomeColaborador);
        if (linhaColaborador !== null) {
          nomeApareceu = true;
          break;
        } else {
          await this.page.reload();
          await this.page.waitForLoadState();
        }
      }
      if (!nomeApareceu) {
        throw new Error(`O nome do colaborador '${nomeColaborador}' não apareceu após várias tentativas.`);
      }
      await frame.getByRole('link', { name: nomeColaborador }).click();
      await expect(frame.getByText('Solicitação de programação de férias', { exact: true })).toBeVisible();
      await frame.getByRole('button', { name: 'Aceitar' }).click();
      await expect(frame.getByText('A solicitação do colaborador foi aceita.')).toBeVisible();
    } catch (error) {
      throw new Error(`Ocorreu um erro: ${error.message}`);
    }
  }
  /**
   * Função que aprova as solicitações de férias pela tela de "Aguardando aprovação de férias" via API
   * @param {string} idGestorDelegado employeeID do Gestor Delegado
   * @param {string} idGestor employeeID do Gestor Titular
   * @param {string} employeeId id do colaborador
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async aprovarSolicitacaoFeriasGestorDelegado(idGestorDelegado, idGestor, employeeId, request) {
    const idUpdateVacation = await request.feriasApi.validarPendenciaAprovacaoGestorDelegado(idGestorDelegado, idGestor, employeeId);
    JSON_APROVACAOSOLICITACAO.vacationRequestUpdateId = idUpdateVacation;
    await request.feriasApi.aprovacaoSolicitacaoFeriasGestorDelegado(idGestorDelegado, idGestor, JSON_APROVACAOSOLICITACAO);
  }
  /**
   * Função que monitora as pendências de solicitação de férias RH.
   * @param {string} employeeId employeeId id do RH que fará a aprovação
   * @param {string} nomeColaborador nome do liderado que fez a solicitação de férias
   * @param {number} maxTentativas quantidade de vezes do laço de repetição
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   */
  async validarPendenciaAprovacaoExistenteRh(employeeId, nomeColaborador, maxTentativas, request) {
    const frame = this.page.frameLocator(FRAME);
    let contador = 1;
    let valor = await request.feriasApi.pendenciasSolicitacaoRH(employeeId, nomeColaborador);

    // Realiza o monitoramento inicial apenas pela API
    while (valor <= 0 && contador <= maxTentativas) {
      const delay = Math.min(500 * Math.pow(2, contador), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      valor = await request.feriasApi.pendenciasSolicitacaoRH(employeeId, nomeColaborador);
      console.log(`Pendência não localizada, tentativa ${contador}`);
      contador++;
    }
    // Validação adicional pela interface do usuário, se a pendência for encontrada pela API
    if (valor >= 1) {
      await this.dataUtils.navegarParaPagina(...PAINELGESTAO_SOLICITACOES.DIRETORIO);
      await expect(frame.getByRole('heading', { name: 'Avaliação de solicitações' })).toBeVisible();
    } else {
      throw new Error(
        `Não está sendo demonstrada a pendência de solicitação de férias, feita pelo colaborador: ${nomeColaborador}, após ${maxTentativas} tentativas`,
      );
    }
  }
  /**
   * Função que aceita uma solicitação via API.
   * @param {string} employeeId employeeId id do RH que fará a aprovação
   * @param {string} tipoSolicitacao tipo de solicitação
   * @param {string} nomeColaborador informar o nome do colaborador em que deseja aprovar a solicitação
   * @param {object} request - Objeto responsável por fazer solicitações HTTP.
   * ex: ADDRESS, PROFESSIONAL_REGISTER, EXTRA_EDUCATION, LANGUAGE, DOCUMENT, EDUCATION, CONTACT, VACATION, DEPENDENT_UPDATE, PERSONAL_DATA
   */
  async aceitarSolicitacao(employeeId, tipoSolicitacao, nomeColaborador, request) {
    try {
      const idSolicitacao = await request.feriasApi.localizaSolicitacoes(employeeId, tipoSolicitacao, nomeColaborador);

      if (idSolicitacao) {
        await request.feriasApi.assumirSolicitacoes(idSolicitacao, {});
        JSON_ACEITASOLICITACAO.personRequestUpdateId = idSolicitacao;
        await request.feriasApi.aceitaSolicitacoes(JSON_ACEITASOLICITACAO);
        console.log(`Solicitação ${idSolicitacao} aceita com sucesso.`);
      } else {
        console.log('Nenhuma solicitação encontrada para aceitar.');
      }
    } catch (error) {
      throw new Error('Erro ao aceitar a solicitação:', error.message);
    }
  }
  /**
   * Função que monitora a integração G5/G7 em uma determinada tabela.
   * @param {object} config Configurações para a validação da integração.
   * @param {string} config.database Nome do banco.
   * @param {string} config.nomeIntegracao Nome da integração que está sendo monitorada.
   * @param {string} config.tenant Nome do tenant que deve ser feito a consulta - G7.
   * @param {string} config.tabela Nome da tabela onde deve ser feita a consulta - G7.
   * @param {number} config.quantAntiga Quantidade de registros na tabela individualvacationschedule (validar antes da integração).
   * @param {string} config.nomeColaborador Nome do colaborador.
   * @param {string} config.vacationPeriodId ID do período de férias na G7.
   * @param {number} config.qauntRepeticao Quantidade de vezes do laço de repetição.
   */
  async validarIntegracaoFeriasG7({ database, nomeIntegracao, tenant, tabela, quantAntiga, nomeColaborador, vacationPeriodId, qauntRepeticao }) {
    let contador = 1;
    let quantAtual = 0;
    const backoffBase = 2000; // Exponencial backoff: começa com 2 segundos

    while (quantAtual <= quantAntiga && contador <= qauntRepeticao) {
      try {
        const tempoEspera = backoffBase * Math.pow(2, contador - 1);
        await new Promise((resolve) => setTimeout(resolve, Math.min(tempoEspera, 8000))); // Máximo de 8 segundos
        quantAtual = await contarValoresScheduleG7(database, tenant, tabela, vacationPeriodId);

        if (quantAtual > quantAntiga) {
          console.log(`${nomeIntegracao} de férias do colaborador: ${nomeColaborador}, foi integrado com sucesso na G7`);
          return;
        }
        console.log(`Integração não ocorrida, tentativa ${contador}`);
      } catch (error) {
        throw new Error(`Erro ao verificar a integração na tentativa ${contador}: ${error.message}`);
      }
      contador++;
    }
  }
  /**
   * Função que acessa tela de Férias Programadas e muda a data das ferias
   * @param {number} novaDataFerias nova data de férias
   * @param {string} nomeColaborador nome do colaborador;
   */
  async ajustarProgramacaoDeFerias(novaDataFerias, nomeColaborador) {
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_FERIAPROGRAMADAS.DIRETORIO);
    const frame = this.page.frameLocator(FRAME);

    await expect(frame.getByRole('heading')).toContainText(STRING_FERIASPROGRAMADAS_TITLEPAGE);

    let nomeApareceu = false;
    const maxTentativas = 20;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      try {
        console.log(`Tentativa ${tentativa} de localizar o colaborador na tabela.`);

        const linhaColaborador = await this.dataUtils.encontrarValorNaTabela(CSS_LINHA_TABELA, nomeColaborador);

        if (linhaColaborador !== null) {
          const linkVisualizar = await linhaColaborador.$('a:has-text("Visualizar")');
          await linkVisualizar.click();
          nomeApareceu = true;
          break; // Saia do loop se encontrar o colaborador
        } else {
          console.log(`O colaborador ${nomeColaborador} não foi encontrado na tentativa ${tentativa}. Recarregando a página...`);
          await this.page.reload();
          await expect(frame.getByRole('heading')).toContainText(STRING_FERIASPROGRAMADAS_TITLEPAGE);
        }
      } catch (error) {
        throw new Error(`Erro na tentativa ${tentativa}: ${error.message}`);
      }

      // Aguardar um tempo progressivo antes da próxima tentativa
      const tempoEspera = Math.min(1200 * Math.pow(2, tentativa - 1), 5000); // Exponencial backoff, max 5s
      await new Promise((resolve) => setTimeout(resolve, tempoEspera));
    }

    if (!nomeApareceu) {
      throw new Error(`O nome do colaborador '${nomeColaborador}' não apareceu após várias tentativas.`);
    }

    await frame.locator('a:has-text("Ajustar programação")').click();
    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).click();
    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).fill(novaDataFerias);
    await frame.locator(ID_INICIARASFERIASEMEQUIPE_INPUT).press('Enter');
    await frame.locator('button:has-text("Salvar e enviar")').click();

    await expect(frame.getByText('A programação de férias foi atualizada')).toBeVisible();
  }
  /**
   * Ajusta as informações do colaborador que estão aguardando aprovação de férias.
   * @param {string} nomeColaborador - O nome do colaborador a ser ajustado.
   * @param {string} [dataFerias] - A data de férias do colaborador a ser ajustada.
   * @param {string} [QtdDiaFerias] - A quantidade de dias de férias do colaborador a ser ajustada.
   * @param {string} [QtdDiaAbono] - A quantidade de dias de abono do colaborador a ser ajustada.
   * @throws {Error} Lança um erro se o nome do colaborador não aparecer após várias tentativas.
   * @returns {Promise<void>} Uma promessa que resolve quando o ajuste é concluído.
   */
  async ajustarAguardandoAprovacaoFerias(nomeColaborador, dataFerias, QtdDiaFerias, QtdDiaAbono) {
    const frame = this.page.frameLocator(FRAME);
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_AGURDANDOAPROVACAOFERIAS.DIRETORIO);
    await expect(frame.getByRole('heading', { name: STRING_AGUARDANDOAPROVACAO_TITLEPAGE })).toBeVisible();

    let nomeApareceu = false;
    for (let tentativa = 1; tentativa <= 20; tentativa++) {
      const linhaColaborador = await this.dataUtils.encontrarValorNaTabela(CSS_LINHA_TABELA, nomeColaborador);
      if (linhaColaborador !== null) {
        console.log(`Colaborador ${nomeColaborador} encontrado na linha ${tentativa}`);
        const celulas = await linhaColaborador.$$('td');
        for (let i = 0; i < celulas.length; i++) {
          const textoCelula = await celulas[i].textContent();
          console.log(`Célula ${i + 1} ${nomeColaborador}: ${textoCelula}`);
        }
        const tdInicioFerias = await linhaColaborador.$('td[data-title="Início das férias"]');
        const tdDiasFerias = await linhaColaborador.$('td[data-title="Dias de férias"]');
        const tdDiasAbono = await linhaColaborador.$('td[data-title="Dias de abono"]');

        const textoInicioFerias = await (await tdInicioFerias.getProperty('textContent')).jsonValue();
        const textoDiasFerias = await (await tdDiasFerias.getProperty('textContent')).jsonValue();
        const textoDiasAbono = await (await tdDiasAbono.getProperty('textContent')).jsonValue();

        expect(textoInicioFerias.trim()).toBe(dataFerias);
        expect(textoDiasFerias.trim()).toBe(QtdDiaFerias.toString());
        expect(textoDiasAbono.trim()).toBe(QtdDiaAbono.toString());

        const linkVisualizar = await linhaColaborador.$('a:has-text("Visualizar")');
        await linkVisualizar.click();
        nomeApareceu = true;
        break;
      } else {
        await this.page.reload();
        await expect(frame.getByRole('heading', { name: STRING_AGUARDANDOAPROVACAO_TITLEPAGE })).toBeVisible();
      }
    }
    if (!nomeApareceu) {
      throw new Error(`O nome do colaborador '${nomeColaborador}' não apareceu após várias tentativas.`);
    }
    await expect(frame.getByRole('heading', { name: 'Solicitação de programação de férias do liderado' })).toBeVisible();
  }
  /**
   * Função que valida se a alterção de férias ira aparecer na tela "Programadas"
   * @param {number} novaDataFerias nova data de férias
   * @param {string} nomeColaborador nome do colaborador;
   */
  async validarAjusteDeFerias(novaDataFerias, nomeColaborador) {
    const frame = this.page.frameLocator(FRAME);
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_FERIAPROGRAMADAS.DIRETORIO);
    await expect(frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();

    await this.validaIntegracaoFeriasProgramadas();

    let dataApareceu = false;
    for (let tentativa = 1; tentativa <= 15; tentativa++) {
      const linhaColaborador = await this.dataUtils.encontrarValorNaTabela(CSS_LINHA_TABELA, nomeColaborador);

      if (linhaColaborador !== null && dataApareceu === false) {
        const tdInicioFerias = await linhaColaborador.$('td[data-title="Início das férias"]');
        const dataInicioFerias = await tdInicioFerias.textContent();
        console.log(`Calendário data de início das férias: ${dataInicioFerias}`);
        console.log(`data de início das férias: ${novaDataFerias}`);
        if (dataInicioFerias === novaDataFerias) {
          dataApareceu = true;
          return;
        } else {
          await this.page.reload();
          await expect(frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();
        }
      } else {
        await this.page.reload();
        await expect(frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!dataApareceu) {
      throw new Error(`O texto '${novaDataFerias}' não foi encontrado após as tentativas`);
    }
  }
  /**
   * Função que compara as datas de inicio do período de férias de um colaborador se estão igual ma G5 e G7;
   * @param {Date} dataInicioferiasG5 data de inicio do período de férias na G5;
   * @param {Date} dataInicioferiasG7 data de inicio do período de férias na G7;
   */
  async validarDataPeriodosFerias(dataInicioferiasG5, dataInicioferiasG7) {
    const dataG5 = dataInicioferiasG5.substring(0, 10);
    const dataG7 = typeof dataInicioferiasG7 === 'string' ? dataInicioferiasG7.substring(0, 10) : dataInicioferiasG7.toISOString().substring(0, 10);
    console.log('As datas dos períodos de férias G5 e G7, são compatíveis');
    if (dataG5 !== dataG7) {
      throw new Error(`As dadas de inicio do período de férias estão diferente: G5/R040PER = ${dataG5} e G7/vacationperiod = ${dataG7}`);
    }
  }
  /**
   * Função que retorna ao colaborador a solicitação - RH - tela Avaliação de solicitações.
   * @param {string} motivo texto do motivo do retorno
   * ex: Retornar ao solicitante ou Rejeitar
   */
  async rejeitarSolicitacaoFerias(motivo) {
    const frame = this.page.frameLocator(FRAME);
    await expect(frame.getByText('Responsável pela análise:')).toBeVisible();
    await frame.getByRole('button', { name: 'Rejeitar' }).click();
    await expect(frame.getByText('É preciso informar um motivo.')).toBeVisible();
    await frame.getByLabel('Observações do responsável').fill(motivo);
    await expect(frame.getByText('É preciso informar um motivo.')).toBeHidden();
    await frame.getByRole('button', { name: 'Rejeitar' }).click();
    await frame.locator('.toast-close-button-x').click();
  }
  /**
   * Função que aprova a solicitação das alterações no RH - tela Avaliação de solicitações.
   */
  async aceitarSolicitacaoFerias() {
    const frame = this.page.frameLocator(FRAME);
    await expect(frame.getByText('Responsável pela análise:')).toBeVisible();
    await frame.getByRole('button', { name: 'Aceitar' }).click();
    await expect(frame.getByText('A solicitação do colaborador foi aceita.')).toBeVisible();
    await frame.locator('.toast-close-button-x').click();
  }
  /**
   * Valida as informações do colaborador na página "Minhas férias".
   * @param {string} [dataFerias] - A data de férias do colaborador a ser validada.
   * @param {string} [QtdDiaFerias] - A quantidade de dias de férias do colaborador a ser validada.
   * @param {string} [QtdDiaAbono] - A quantidade de dias de abono do colaborador a ser validada.
   * @param {string} [situacaoFerias] - O valor da situaçao das ferias a ser validado.
   * @param {string} [tipoFerias] - O valor do tipo de férias do colaborador a ser validado.
   * @param {string} [decimoTerceiro] - O valor do décimo terceiro do colaborador a ser validado.
   * @throws {Error} Lança um erro se o nome do colaborador não aparecer após várias tentativas.
   * @returns {Promise<void>} Uma promessa que resolve quando a validação é concluída.
   */
  async validarInformacaoColaboradorMinhasFerias(
    dataFerias,
    QtdDiaFerias = null,
    QtdDiaAbono = null,
    situacaoFerias = null,
    tipoFerias = null,
    decimoTerceiro = null,
  ) {
    await this.dataUtils.navegarParaPagina(...PAINELGESTAO_MINHASFERIAS.DIRETORIO);
    const frame = this.page.frameLocator(FRAME);
    await expect(frame.getByRole('heading', { name: 'Minha programação de férias' })).toBeVisible();

    let dataFeriasApareceu = false;

    for (let tentativa = 1; tentativa <= 10; tentativa++) {
      const linhaColaborador = await this.dataUtils.encontrarValorNaTabela(CSS_LINHA_TABELA, dataFerias);

      if (linhaColaborador) {
        const celulas = await linhaColaborador.$$('td');
        const infoColaborador = await this.extrairInformacoesColaborador(celulas);

        dataFeriasApareceu = this.validarCampos(infoColaborador, {
          tipoFerias,
          dataFerias,
          QtdDiaFerias,
          QtdDiaAbono,
          situacaoFerias,
          decimoTerceiro,
        });

        if (dataFeriasApareceu) break;
      } else {
        await this.page.reload();
        await expect(frame.getByRole('heading', { name: 'Minha programação de férias' })).toBeVisible();
      }
    }

    if (!dataFeriasApareceu) {
      throw new Error(`O data '${dataFerias}' não apareceu após várias tentativas.`);
    }
  }

  /**
   * Extrai as informações de um colaborador a partir das células de uma linha da tabela.
   * @param {Array} celulas - As células da linha da tabela.
   */
  async extrairInformacoesColaborador(celulas) {
    return {
      tipo: await celulas[1].innerText(),
      inicioFerias: await celulas[2].innerText(),
      diasFerias: await celulas[3].innerText(),
      diasAbono: await celulas[4].innerText(),
      decimo: await celulas[5].innerText(),
      situacao: await celulas[5].innerText(),
    };
  }

  /**
   * Valida os campos do colaborador com os valores esperados.
   * @param {object} infoColaborador - As informações extraídas do colaborador.
   * @param {object} valoresEsperados - Os valores esperados a serem validados.
   * @param {string} valoresEsperados.tipoFerias - O tipo de férias esperado.
   * @param {string} valoresEsperados.dataFerias - A data de férias esperada.
   * @param {string} valoresEsperados.QtdDiaFerias - A quantidade de dias de férias esperada.
   * @param {string} valoresEsperados.QtdDiaAbono - A quantidade de dias de abono esperada.
   * @param {string} valoresEsperados.situacaoFerias - A situação das férias esperada.
   * @param {string} valoresEsperados.decimoTerceiro - O décimo terceiro esperado.
   * @returns {boolean} Retorna true se todas as validações forem bem-sucedidas.
   */
  validarCampos(infoColaborador, { tipoFerias, dataFerias, QtdDiaFerias, QtdDiaAbono, situacaoFerias, decimoTerceiro }) {
    const { tipo, inicioFerias, diasFerias, diasAbono, decimo, situacao } = infoColaborador;

    const validacoes = [
      { valorAtual: tipo, valorEsperado: tipoFerias },
      { valorAtual: inicioFerias, valorEsperado: dataFerias },
      { valorAtual: diasFerias, valorEsperado: QtdDiaFerias },
      { valorAtual: diasAbono, valorEsperado: QtdDiaAbono },
      { valorAtual: decimo, valorEsperado: decimoTerceiro },
      { valorAtual: situacao, valorEsperado: situacaoFerias },
    ];

    return validacoes.some(({ valorAtual, valorEsperado }) => {
      if (valorEsperado !== null) {
        expect(valorAtual).toStrictEqual(valorEsperado);
        return true;
      }
      return false;
    });
  }
  /**
   * Calcula se a data informada não é um feriado ou antecede um feriado/DSR.
   * @param {string} dataInicioFerias - Data a ser validada (formato dd/mm/aaaa)
   * @returns {string} - Data final válida para início de férias.
   */
  async calcularDataFerias(dataInicioFerias) {
    const diaUtil = await this.dataUtils.validarDiaUtilFerias(dataInicioFerias);
    const vespera = await this.validarVesperaFeriados(diaUtil);
    const inicioFerias = await this.dataUtils.validarDiaUtilFerias(vespera);
    return this.validarDataInvalidaMenorAtual(inicioFerias);
  }
  /**
   * Valida se a data informada é véspera de feriado nacional. Se sim, retorna o dia seguinte ao feriado.
   * @param {string} dataInicioFerias - Data a ser validada (formato dd/mm/aaaa)
   * @returns {string} - Data ajustada, se for véspera de feriado, para o dia seguinte ao feriado.
   */
  async validarVesperaFeriados(dataInicioFerias) {
    const dataVesperaFeriadosEng = await this.dataUtils.formataDataAmericano(dataInicioFerias);
    let data = new Date(dataVesperaFeriadosEng);

    for (const feriado of feriados) {
      const dataFeriado = parse(feriado.dia + '/' + data.getFullYear(), 'dd/MM/yyyy', new Date());
      if (isSameDay(data, dataFeriado) || isSameDay(data, addDays(dataFeriado, -1)) || isSameDay(data, addDays(dataFeriado, -2))) {
        data = addDays(dataFeriado, feriado.ajuste);
      }
    }

    return format(data, 'dd/MM/yyyy');
  }
  /**
   * Valida se a data do início de férias é menor que a data atual. Se for, adiciona para o próximo ano.
   * @param {string} data - Data a ser validada (formato dd/mm/aaaa)
   * @returns {string} - Data ajustada, se menor que a data atual, para o próximo ano.
   */
  validarDataInvalidaMenorAtual(data) {
    const dataFormatada = this.dataUtils.formataDataAmericano(data);
    const dataDesejada = new Date(dataFormatada);
    const dataAtual = new Date();

    // Verifica se a data desejada é menor que a data atual
    if (dataDesejada < dataAtual) {
      // Incrementa o ano da data desejada em 1
      dataDesejada.setFullYear(dataDesejada.getFullYear() + 1);
      // Formata o dia, mês e ano para o formato desejado
      let diaDesejadoFormatado = dataDesejada.getDate() + 1;
      let mesDesejadoFormatado = dataDesejada.getMonth() + 1;
      const anoDesejadoFormatado = dataDesejada.getFullYear();
      // Adiciona zero à esquerda se o dia ou mês for menor que 10
      if (diaDesejadoFormatado < 10) {
        diaDesejadoFormatado = '0' + diaDesejadoFormatado;
      }
      if (mesDesejadoFormatado < 10) {
        mesDesejadoFormatado = '0' + mesDesejadoFormatado;
      }
      return `${diaDesejadoFormatado}/${mesDesejadoFormatado}/${anoDesejadoFormatado}`;
    } else {
      return data; // Retorna a data original se for válida
    }
  }
  /**
   * Função captura a quantidade de vezes que se deve avançar no calendário
   * @param {string} iniciarFerias data do inicio de férias ex: 22/05/2024
   */
  async calcularQuantidadeMesesParaAvancar(iniciarFerias) {
    const iniciarFeriasFormat = await this.dataUtils.formataDataAmericano(iniciarFerias);
    const dataIniciarFerias = parse(iniciarFeriasFormat, 'yyyy-MM-dd', new Date());

    const dataAtual = new Date();

    const diffInMonths = differenceInCalendarMonths(dataIniciarFerias, dataAtual);
    return diffInMonths < 0 ? 0 : diffInMonths;
  }
  /**
   * Função verifica se o colaborador está no calendário de férias.
   * @param {string} iniciarFerias data do inicio de férias
   * @param {string} nomeColaborador nome do colaborador que deve ser visualizado no calendário
   */
  async validarColaboradorCalendario(iniciarFerias, nomeColaborador) {
    const frame = this.page.frameLocator(FRAME);
    const maxTentativas = 25;
    const quantidade = await this.calcularQuantidadeMesesParaAvancar(iniciarFerias);

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      try {
        // Avançar o calendário para o mês necessário
        await this.avancarNoCalendario(quantidade);

        // Verificar se o colaborador está visível no calendário
        const colaboradorVisivel = await frame.getByText(nomeColaborador, { exact: true }).first().isVisible();

        if (colaboradorVisivel) {
          console.log(`O colaborador ${nomeColaborador} foi encontrado no calendário.`);
          return;
        } else {
          console.log(`O colaborador ${nomeColaborador} não foi encontrado no calendário.`);
        }
      } catch (error) {
        throw new Error(`Erro na tentativa ${tentativa}: ${error.message}`);
      }

      // Espera incremental entre tentativas, com exponencial backoff
      const tempoEspera = Math.min(tentativa * 1000, 5000); // Limita o tempo máximo a 5 segundos
      console.log(`Tentativa ${tentativa} falhou. Recarregando página e aguardando ${tempoEspera / 1000}s...`);
      await this.page.reload();
      await new Promise((resolve) => setTimeout(resolve, tempoEspera));
    }

    throw new Error(`Erro ao validar o ${nomeColaborador} no calendário após ${maxTentativas} tentativas`);
  }
  /**
   * Avança um determinado número de vezes no calendário dentro de um frame específico.
   * @param {number} quant - A quantidade de vezes para avançar no calendário.
   */
  async avancarNoCalendario(quant) {
    const frame = this.page.frameLocator(FRAME);

    for (let i = 0; i < quant; i++) {
      // Verificar se o botão de avançar está visível antes de tentar clicar
      await frame.locator(CLASS_AVANCARCALENDARIO_BUTTON).waitFor({ state: 'visible' });

      await frame.locator(CLASS_AVANCARCALENDARIO_BUTTON).click({ force: true });

      // Aguarda até que o corpo do calendário atualize (confirma a navegação)
      await frame.locator(ID_CORPOCALENDARIO_BODY).waitFor({ state: 'visible' });

      // Espera um tempo moderado (pode ser ajustado conforme necessário)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  /**
   *  Função que verifica se um elemento está desabilitado na tela.
   * @param {string} componente informar qual é o elemento que deve ser validado na tela, locator
   * @param {string} desabilitado qual o valor esperado para ser comparado (true, false)
   */
  async verificaElementoDesabilitado(componente, desabilitado) {
    const frame = this.page.frame({ name: 'ci' });
    const isDisabled = await frame.$eval(componente, (el) => el.hasAttribute('disabled'));
    if (desabilitado) {
      expect(isDisabled).toBe(true);
      console.log('Botão ou campo desabilitado');
    } else {
      expect(isDisabled).toBe(false);
      console.log('Botão ou campo esta habilitado');
    }
  }

  /**
   * Função que verifica se a integração das Férias Programadas ocorreu corretamente.
   * E recarrega a tela caso ainda não tenha integrado.
   */
  async validaIntegracaoFeriasProgramadas() {
    await expect(this.frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();
    let count = await this.locatorNenhumaProgramacaoEncontrada.count();
    let tentativas = 0;
    const limiteTentativas = 15;

    while (count > 0 && tentativas < limiteTentativas) {
      console.log(`Tentativa ${tentativas + 1}: Férias Programadas não foram integradas.`);

      // Recarrega a tela
      await this.page.reload();

      // Verifica se continua na tela de Férias Programadas
      await expect(this.frame.getByRole('heading', { name: STRING_FERIASPROGRAMADAS_TITLEPAGE })).toBeVisible();

      // Aguarda 2 segundos antes da nova verificação
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verifica novamente a integração das Férias Programadas
      count = await this.locatorNenhumaProgramacaoEncontrada.count();

      tentativas++;
    }

    if (count === 0) {
      console.log('Férias Programadas foram integradas.');
    } else {
      throw new Error(`Limite de ${limiteTentativas} tentativas atingido. Férias Programadas não foram integradas.`);
    }
  }
}
