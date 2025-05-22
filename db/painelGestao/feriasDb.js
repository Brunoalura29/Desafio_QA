import { selecionaRegistrosG7, inserirRegistros, excluirRegistros, atualizarRegistros } from '..';

const MENSAGENS_ERRO = {
  REMOVER_REGISTRO: 'Erro ao remover atividade: ',
  ADICIONAR_REGISTRO: 'Erro ao adicionar atividade: ',
  ATUALIZAR_REGISTRO: 'Erro ao atualizar registro: ',
  VALIDAR_REGISTRO: 'Erro ao validar registros: ',
  SELECIONAR_REGISTRO: 'Erro ao selecionar registros: ',
};

/**
 * Função que conta quantos valores exitem em uma determinada tabela para um colaborador - G7;
 * @param {string} database nome do basco;
 * @param {string} tenant nome do tenant onde deve ser feita a consulta na G7;
 * @param {string} tabela nome da tabela onde deve ser feita a consulta na G7;
 * @param {string} idEmployee id do colaborador na G7;
 * @returns {Promise<void>} - Uma Promise que representa a conclusão da operação.
 */
export async function contarValoresColaboradorG7(database, tenant, tabela, idEmployee) {
  try {
    const query = `SELECT COUNT(*) AS total FROM ${tenant}.${tabela} WHERE employee = '${idEmployee}'`;
    console.log(`Executando consulta: ${query}`);

    const resultado = await selecionaRegistrosG7(database, query, 'total', 1);

    console.log(`Registros selecionado na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);

    return resultado.selectedValues?.[0] || 0;
  } catch (error) {
    throw new Error(`${MENSAGENS_ERRO.SELECIONAR_REGISTRO}: ${error.message}`);
  }
}
/**
 * Conta e deleta registros de um colaborador em uma tabela específica até que não haja mais registros.
 * @param {object} database - Objeto de conexão com o banco de dados.
 * @param {string} tenant - Nome do schema ou tenant onde a tabela está localizada.
 * @param {string} tabela - Nome da tabela onde os registros devem ser contados e deletados.
 * @param {string} idEmployee - Identificador único do colaborador para o qual os registros serão contados e deletados.
 * @param {number} maxTentativas - Número máximo de tentativas para validar a ausência de registros (opcional, padrão 10).
 * @returns {Promise<number>} Retorna 0 quando não há mais registros para o colaborador na tabela.
 * @throws Lança um erro se houver problemas ao selecionar ou deletar registros.
 */
export async function validarPeriodoInexistente(database, tenant, tabela, idEmployee, maxTentativas = 15) {
  try {
    let tentativas = 0;
    let resultado;
    const query = `SELECT COUNT(*) AS total FROM ${tenant}.${tabela} WHERE employee = '${idEmployee}'`;
    console.log(`Executando consulta: ${query}`);

    do {
      tentativas++;
      resultado = await selecionaRegistrosG7(database, query, 'total', 1);
      console.log(`Tentativa ${tentativas}: Registros selecionados na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    } while (resultado.selectedValues[0] > 0 && tentativas < maxTentativas);

    if (resultado.selectedValues[0] > 0) {
      console.log(`Após ${maxTentativas} tentativas, ainda há registros para o empregado ${idEmployee} na tabela ${tabela}.`);
      throw new Error('Períodos de férias encontrados');
    } else {
      console.log(`Todos os registros para o empregado ${idEmployee} foram validados e estão ausentes da tabela ${tabela}.`);
      return;
    }
  } catch (error) {
    throw new Error(MENSAGENS_ERRO.VALIDAR_REGISTRO, error);
  }
}
/**
 * Função que conta quantos itens exitem em uma determinada tabela - G7;
 * @param {string} database nome do basco;
 * @param {string} tenant nome do tenant onde deve ser feita a consulta na G7;
 * @param {string} tabela nome da tabela onde deve ser feita a consulta na G7;
 */
export async function contarValoresG7(database, tenant, tabela) {
  try {
    const query = `SELECT count(*) FROM ${tenant}.${tabela}`;
    console.log(`Executando consulta: ${query}`);

    const resultado = await selecionaRegistrosG7(database, query, 'count', 1);
    console.log(`Registros selecionado na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado.selectedValues?.[0] || 0;
  } catch (error) {
    throw new Error(MENSAGENS_ERRO.VALIDAR_REGISTRO, error);
  }
}
/**
 * Função que conta quantos itens exitem em uma determinada tabela - G7;
 * @param {string} database nome do basco;
 * @param {string} tenant nome do tenant onde deve ser feita a consulta na G7;
 * @param {string} tabela nome da tabela onde deve ser feita a consulta na G7;
 * @param {string} vacationPeriodId id do periodo de ferias na G7;
 */
export async function contarValoresScheduleG7(database, tenant, tabela, vacationPeriodId) {
  try {
    const query = `SELECT count(*) FROM ${tenant}.${tabela} WHERE vacationperiod = '${vacationPeriodId}'`;
    console.log(`Executando consulta: ${query}`);

    const resultado = await selecionaRegistrosG7(database, query, 'count', 1);
    console.log(`Registros selecionado na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado.selectedValues?.[0] || 0;
  } catch (error) {
    throw new Error(MENSAGENS_ERRO.ATUALIZAR_REGISTRO, error);
  }
}
/**
 * Função que localiza um valor exitem em uma determinada tabela para um colaborador - G7;
 * @param {string} database nome do basco;
 * @param {string} tenant nome do tenant onde deve ser feita a consulta na G7;
 * @param {string} tabela nome da tabela onde deve ser feita a consulta na G7;
 * @param {string} campoConsulta campo que deve ser consultado na tabela;
 * @param {string} idemployee id do colaborador na G7;
 * @param {string} ordenacao ordenação dos valores: desc ou asc;
 */
export async function localizarUltimoValorG7(database, tenant, tabela, campoConsulta, idemployee, ordenacao) {
  try {
    const query = `SELECT ${campoConsulta} FROM ${tenant}.${tabela} WHERE employee = '${idemployee}' ORDER BY ${campoConsulta} ${ordenacao}`;
    console.log(`Executando consulta: ${query}`);

    const resultado = await selecionaRegistrosG7(database, query, campoConsulta, 1);
    console.log(`Registros selecionado na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado.selectedValues?.[0] || 0;
  } catch (error) {
    throw new Error(MENSAGENS_ERRO.ATUALIZAR_REGISTRO, error);
  }
}
/**
 * Insere períodos de férias no sistema G5.
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numemp O número da empresa.
 * @param {object} periodo Ferias contendo as propriedades:
 * @param {string} periodo.tipcol O tipo de colaborador.
 * @param {number} periodo.numcad O número do cadastro.
 * @param {string} periodo.iniper A data de início do período de férias.
 * @param {string} periodo.fimper A data de término do período de férias.
 * @param {string} periodo.limcon A data limite para concessão das férias.
 * @param {number} periodo.qtdDir A quantidade de dias de férias direito.
 * @param {number} periodo.qtdSld A quantidade de dias de férias a saldo.
 * @param {string} periodo.sitPer A situação do período de férias.
 * @returns {Promise<any>} Uma Promise que resolve com o resultado da inserção.
 * @throws {Error} Se ocorrer um erro durante a inserção.
 */
export async function inserirPeriodosFeriasG5(identificadorDeConexao, numemp, periodo) {
  const dados = {
    numemp,
    tipcol: periodo.tipcol,
    numcad: periodo.numcad,
    iniper: periodo.iniper,
    fimper: periodo.fimper,
    limcon: periodo.limcon,
    qtdDir: periodo.qtdDir,
    qtdSld: periodo.qtdSld,
    sitPer: periodo.sitPer,
    persus: 'N',
    avoFer: 1,
  };

  return await inserirRegistros(identificadorDeConexao, 'r040per', dados);
}
/**
 * Exclui registros de uma tabela específica no banco de dados, baseando-se em condições fornecidas.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numemp O número da empresa.
 * @param {string} tipcol O tipo de colaborador.
 * @param {number} numcad O número do cadastro.
 * @returns {Promise<any>} - O resultado da operação de exclusão.
 */
export async function excluirPeriodosFeriasG5(identificadorDeConexao, numemp, tipcol, numcad) {
  const dados = { numemp, tipcol, numcad };

  await excluirRegistros(identificadorDeConexao, 'R040FEV', dados);
  await excluirRegistros(identificadorDeConexao, 'R040FEG', dados);
  await excluirRegistros(identificadorDeConexao, 'R040FEM', dados);
  await excluirRegistros(identificadorDeConexao, 'R038AFA', dados);
  await excluirRegistros(identificadorDeConexao, 'R040PRG', dados);
  await excluirRegistros(identificadorDeConexao, 'R040PER', dados);
}
/**
 * Função que insere o registro mestre na tabela - G5/R040FEM.
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numemp Número da empresa - numemp/R034FUN.
 * @param {object} dados Dados do recibo de férias contendo as propriedades:
 * @param {number} dados.tipcol Tipo de colaborador - tipcol/R034FUN.
 * @param {number} dados.numcad Número do colaborador - numcad/R034FUN.
 * @param {string} dados.iniper Data inicial do período de férias - 2021-04-01 00:00:00.
 * @param {string} dados.inifer Data inicial de férias - 2021-04-01 00:00:00.
 * @param {string} dados.datpag Data de pagamento das férias.
 * @param {number} dados.diafer Quantidade de dias de férias.
 * @param {number} dados.diaabo Quantidade de dias de abono.
 * @param {number} dados.minfed Minutos férias.
 * @param {number} dados.minabo Minutos abono.
 * @param {number} dados.salbas Salário base.
 * @returns {Promise<any>} Uma Promise que resolve com o resultado da inserção.
 * @throws {Error} Se ocorrer um erro durante a inserção.
 */
export async function inseriReciboFeriasMesterG5(identificadorDeConexao, numemp, dados) {
  const registro = {
    numemp,
    tipcol: dados.tipcol,
    numcad: dados.numcad,
    iniper: dados.iniper,
    inifer: dados.inifer,
    datpag: dados.datpag,
    diafer: dados.diafer,
    diaabo: dados.diaabo,
    minfed: dados.minfed,
    minabo: dados.minabo,
    salbas: dados.salbas,
    tipfer: 'N',
    opc13s: 'N',
    pagmul: ' ',
    geradt: 'S',
    todint: 'N',
    calhfe: 'S',
    caladf: 'S',
    caltfe: 'S',
    calabo: 'S',
    calaab: 'S',
    caltab: 'S',
  };
  return await inserirRegistros(identificadorDeConexao, 'R040FEM', registro);
}
/**
 * Função que insere o Recibo Férias - Afastamento na tabela - G5/R040FEG.
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numemp Número da empresa - numemp/R034FUN.
 * @param {object} dados Dados do recibo de férias com afastamento contendo as propriedades:
 * @param {number} dados.tipcol Tipo de colaborador - tipcol/R034FUN.
 * @param {number} dados.numcad Número do colaborador - numcad/R034FUN.
 * @param {string} dados.iniper Data inicial do período de férias.
 * @param {string} dados.inifer Data inicial de férias.
 * @param {string} dados.iniafa Data inicial de afastamento.
 * @param {string} dados.terafa Data fim de afastamento.
 * @param {number} dados.diaafa Quantidade de dias de afastamento/férias.
 * @returns {Promise<any>} Uma Promise que resolve com o resultado da inserção.
 * @throws {Error} Se ocorrer um erro durante a inserção.
 */
export async function inseriReciboFeriasAfastamentoG5(identificadorDeConexao, numemp, dados) {
  const registro = {
    numemp,
    tipcol: dados.tipcol,
    numcad: dados.numcad,
    iniper: dados.iniper,
    inifer: dados.inifer,
    seqafa: 1,
    iniafa: dados.iniafa,
    terafa: dados.terafa,
    diaafa: dados.diaafa,
    obsafa: ' ',
  };
  return await inserirRegistros(identificadorDeConexao, 'R040FEG', registro);
}
/**
 * Função que insere Recibo Férias Eventos na tabela - G5/R040FEV.
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numemp Número da empresa - numemp/R034FUN.
 * @param {object} dados Dados do recibo de férias eventos contendo as propriedades:
 * @param {number} dados.tipcol Tipo de colaborador - tipcol/R034FUN.
 * @param {number} dados.numcad Número do colaborador - numcad/R034FUN.
 * @param {string} dados.iniper Data inicial do período de férias.
 * @param {string} dados.inifer Data inicial de férias.
 * @param {number} dados.tabeve Número da tabela de eventos.
 * @param {number} dados.codeve Código do evento.
 * @param {number} dados.refeve Referência do evento, horas, monetário.
 * @param {number} dados.valeve Valor do evento em reais.
 * @param {number} dados.codrub Código da rubrica do evento.
 * @returns {Promise<any>} Uma Promise que resolve com o resultado da inserção.
 * @throws {Error} Se ocorrer um erro durante a inserção.
 */
export async function inseriReciboFeriasEventosG5(identificadorDeConexao, numemp, dados) {
  const registro = {
    numemp,
    tipcol: dados.tipcol,
    numcad: dados.numcad,
    iniper: dados.iniper,
    inifer: dados.inifer,
    tabeve: dados.tabeve,
    codeve: dados.codeve,
    refeve: dados.refeve,
    valeve: dados.valeve,
    orieve: 'C',
    codrub: dados.codrub,
    fatrub: 0.0,
  };
  return await inserirRegistros(identificadorDeConexao, 'R040FEV', registro);
}
/**
 * Função que insere um histórico de afastamento
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {number} numcad - número do colaborador-  numcad/R034FUN
 * @param {string} data - data do afastamento - 2020-10-31
 * @param {number} sitafa - código de afastamento - 7 Demitido
 */
export async function insertAfastamentoG5(identificadorDeConexao, numcad, data, sitafa) {
  const dataAfastamento = data + ' 00:00:00.000';
  const dados = {
    numemp: 1,
    tipcol: 1,
    numcad,
    datafa: dataAfastamento,
    horafa: 0,
    sitafa,
    caudem: 1,
    contov: 'N',
    staatu: 1,
    exmret: ' ',
    obsafa: ' ',
    nroaut: ' ',
    codsub: ' ',
    risnex: ' ',
    coddoe: ' ',
    eferet: ' ',
    motalt: ' ',
    nomate: ' ',
    regcon: ' ',
    cgcces: ' ',
    msmmot: ' ',
  };
  return await inserirRegistros(identificadorDeConexao, 'R038AFA', dados);
}
/**
 * Função que realiza uma alteração via UPDATE em uma determinada tabela.
 * @param {string} identificadorDeConexao O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {string} tabelaAlteracao - nome da tabela onde deve ser feito o update
 * @param {string} campoAlteracao - nome da campo onde deve ser feito o update
 * @param {string} novoValorCampo - valor que dever ser inserido na base
 * @param {number} numEmp - número da empresa - numemp/R034FUN;
 * @param {number} tipCol - tipo de colaborador - tipcol/R034FUN;
 * @param {number} numCad - número do colaborador - numcad/R034FUN;
 */
export async function alterarDadoColaboradorG5(identificadorDeConexao, tabelaAlteracao, campoAlteracao, novoValorCampo, numEmp, tipCol, numCad) {
  const condicao = { numEmp, tipCol, numCad };
  const atualizacao = { [campoAlteracao]: novoValorCampo };

  return await atualizarRegistros(identificadorDeConexao, tabelaAlteracao, condicao, atualizacao);
}
