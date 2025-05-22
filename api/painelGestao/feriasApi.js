import axios from 'axios';

import {
  JSON_ACEITASOLICITACAO_GESTOR,
  JSON_ASSINATURAAVISO,
  JSON_EXCLUIPOLITICAFERIAS,
  JSON_BUSCAPOLITICA,
} from '../../data/painelGestao/feriasJson';
import { BASE_API_LEGADO, BASE_API } from '../../helpers/ambiente';

const MENSAGENS_ERRO = {
  FAZER_SOLICITACAO: 'Erro ao fazer a solicitação: ',
};

export class FeriasApi {
  /**
   *  Constructor da classe
   * @param {object} request O contexto de requisição do Playwright.
   */
  constructor(request) {
    this.request = request;
  }
  /**
   * Função que retorna o vacationPeriodId
   * @param {string} employeeId  id do colaborador que solicitou as férias.
   */
  async localizarIdPeriodoFerias(employeeId) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacationrequestupdate/opened/${employeeId}?activeEmployeeId=${employeeId}`);

      const response = await axios.get(endpoint.toString(), {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);

      const openedPeriods = response.data.openedPeriods;
      if (openedPeriods.length > 0) {
        console.log('Período de férias localizado: ', openedPeriods[0].id);
        return openedPeriods[0].id || null;
      }
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }

  /**
   * Solicita férias individuais para um colaborador.
   * @param {string} employeeId - ID do colaborador que solicita as férias.
   * @param {object} reqBody - Objeto JSON com informações para a solicitação de férias.
   */
  async inserirFeriasColaborador(employeeId, reqBody) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacationrequestupdate?employeeId=${employeeId}`);
      const response = await axios.post(endpoint.toString(), reqBody, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
    } catch (error) {
      throw new Error('Erro ao inserir férias:', error.message);
    }
  }
  /**
   * Função que verifica apendência de solicitação na tela "Avaliação de solicitações"
   * @param {string} employeeId id do colaborador RH
   * @param {string} nomeColaborador nome do liderado que fez a solicitação de férias
   */
  async pendenciasSolicitacaoRH(employeeId, nomeColaborador) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}request/requests/${employeeId}`);

      const response = await axios.get(endpoint.toString(), {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);

      if (response.data.list) {
        const countRequesterName = response.data.list.filter((item) => item.requesterName.includes(nomeColaborador)).length;

        if (countRequesterName >= 1) {
          console.log(`Foi localizado uma requisição para ${nomeColaborador}.`);
        } else {
          console.log(`Foi localizado um total de ${response.data.totalElements} elementos, mas nenhum para o  ${nomeColaborador}.`);
        }
        return countRequesterName;
      } else {
        console.log('Nenhuma lista de solicitações foi retornada pela API.');
        return 0;
      }
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que verifica se à solicitação de férias, feita pelo liderado já está visível na tela 'Aguardando aprovação de férias' - Gestor
   * @param {string} employeeId id do Gestor
   * @param {string} idColaborador employeeId do liderado que fez a solicitação de férias
   */
  async pendenciaAprovacaoFeriasGestor(employeeId, idColaborador) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacation/team/${employeeId}/waiting-approval`);

      const response = await axios.get(endpoint.toString(), {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);

      if (response.data && Array.isArray(response.data.MANAGER)) {
        const manager = response.data.MANAGER.find((m) => m.employeeId === idColaborador);
        if (manager) {
          const vacationRequestUpdateId = manager.vacationRequestUpdateId;
          console.log('Encontrado o ID de atualização da solicitação de férias: ', vacationRequestUpdateId);
          return vacationRequestUpdateId;
        }
      }
      return false;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que verifica se a solicitação de férias, feita pelo liderado já está visível na tela 'Aguardando aprovação de férias' - Gestor Delegado
   * @param {string} idGestorDelegado id do Gestor
   * @param {string} idGestor id do Gestor Titular
   * @param {json} json json utilizado para realizar o Post
   * @param {string} nomeLiderado Nome do colaborador
   */
  async pendenciaAprovacaoFeriasGestorDelegado(idGestorDelegado, idGestor, json, nomeLiderado) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacation/team/${idGestorDelegado}/waiting-approval?substitutedEmployeeId=${idGestor}`);
      const response = await axios.post(endpoint.toString(), json, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      if (!response.data.MANAGER) {
        return false;
      }
      return response.data.MANAGER.some((item) => {
        return item.personName === nomeLiderado;
      });
    } catch (error) {
      console.error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
      return false;
    }
  }
  /**
   * Função que verifica se à solicitação de férias, feita pelo liderado já está visível na tela 'Aguardando aprovação de férias' - Gestor
   * @param {string} employeeId id do Gestor
   */
  async feriasProgramadasGestor(employeeId) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacation/team/${employeeId}/scheduled`);

      const response = await axios.post(
        endpoint.toString(),
        {},
        {
          ignoreHTTPSErrors: true,
          timeout: 0,
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await this.request.api.validateApiResponse(response);

      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('Pendência localizada');
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }

  /**
   * Função que localiza as solicitações e retorna o ID delas
   * @param {string} idEmploeey id do colaborador que aprovará a solicitação
   * @param {string} tipoSolicitacao tipo de solicitação
   * @param {string} nomeColaborador nome do colaborador que será aprovada a solicitação
   * ex: ADDRESS, PROFESSIONAL_REGISTER, EXTRA_EDUCATION, LANGUAGE, DOCUMENT, EDUCATION, CONTACT, VACATION, DEPENDENT_UPDATE, PERSONAL_DATA
   */
  async localizaSolicitacoes(idEmploeey, tipoSolicitacao, nomeColaborador) {
    const tipo = tipoSolicitacao.toUpperCase();
    const maxTentativas = 15;
    let tentativa = 1;

    while (tentativa <= maxTentativas) {
      try {
        const endpoint = new URL(`${BASE_API_LEGADO}request/pending/${idEmploeey}?limit=10&requestType=${tipo}&requesterName=${nomeColaborador}`);

        const response = await axios.get(endpoint.toString(), {
          ignoreHTTPSErrors: true,
          timeout: 0,
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
            ContentType: 'application/json',
          },
        });

        await this.request.api.validateApiResponse(response);

        // Verifica se há solicitações
        if (response.data.totalElements !== 0 && response.data.list && response.data.list.length > 0) {
          const item = response.data.list.find((item) => item.requesterName.includes(nomeColaborador));

          if (item) {
            console.log('Solicitação localizada, ID:', item.requestId);
            return item.requestId;
          } else {
            console.log(`Nenhuma solicitação para o ${nomeColaborador} encontrada.`);
          }
        }
        console.log(`Total de solicitações localizadas: ${response.data.totalElements}, tentativa ${tentativa}`);
      } catch (error) {
        throw new Error(`Erro na tentativa ${tentativa}:`, error.message);
      }

      // Exponencial backoff
      const tempoEspera = Math.min(1500 * Math.pow(2, tentativa), 8000); // Espera cresce exponencialmente, com máximo de 8s
      await new Promise((resolve) => setTimeout(resolve, tempoEspera));

      tentativa++;
    }

    console.log(`Não foi possível localizar solicitações após ${maxTentativas} tentativas.`);
    return null;
  }
  /**
   * Função que assumi as solicitações
   * @param {json} idSolicitacao id da solicitação - localizado pela função localizaSolicitacoes
   * @param {json} reqBody que retorna as informações da base
   */
  async assumirSolicitacoes(idSolicitacao, reqBody) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}person-update-request/take/${idSolicitacao}`);

      const response = await axios.put(endpoint.toString(), reqBody, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });
      await this.request.api.validateApiResponse(response);
      console.log('Solicitação assumida com sucesso!');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que aceita as solicitações
   * @param {json} reqBody que retorna as informações da base
   */
  async aceitaSolicitacoes(reqBody) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}person-update-request/approve`);

      const response = await axios.put(endpoint.toString(), reqBody, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });
      await this.request.api.validateApiResponse(response);
      console.log('Solicitação aceita com sucesso!');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que retorna o vacationRequestUpdateId
   * @param {string} employeeId  id do colaborador que solicitou as férias.
   */
  async localizarIdSolicitacaoFerias(employeeId) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacation/${employeeId}`);

      const response = await axios.get(endpoint.toString(), {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      return response.data.opened[0].vacationRequest2[0].vacation.id;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que verifica se existe uma pendencia de aprovação de férias e retorna o ID do vacationRequestUpdateId - Gestor Delegado
   * @param {string} idGestorDelegado id do Gestor Delegado
   * @param {string} idGestor id do Gestor Titular
   * @param {string} employeeId id do colaborador
   */
  async validarPendenciaAprovacaoGestorDelegado(idGestorDelegado, idGestor, employeeId) {
    let contador = 0;
    const quantRepeticao = 20;
    let vacationRequestUpdateId = null;
    try {
      while (contador < quantRepeticao) {
        const endpoint = new URL(`${BASE_API_LEGADO}vacation/team/${idGestorDelegado}/waiting-approval?substitutedEmployeeId=${idGestor}`);

        const response = await axios.get(endpoint.toString(), {
          ignoreHTTPSErrors: true,
          timeout: 0,
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
            ContentType: 'application/json',
          },
        });

        await this.request.api.validateApiResponse(response);

        if (response.data && Array.isArray(response.data.MANAGER)) {
          const manager = response.data.MANAGER.find((manager) => manager.employeeId === employeeId);
          if (manager) {
            vacationRequestUpdateId = manager.vacationRequestUpdateId;
            console.log(`Pendência de aprovação localizada: ${vacationRequestUpdateId}`);
            return vacationRequestUpdateId;
          }
        }
        console.log(`Pendência não localizada, tentativa ${contador}`);

        const delay = Math.min(500 * Math.pow(2, contador), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        contador++;
      }
      if (vacationRequestUpdateId === null) {
        throw new Error(`Não foi possível localizar pendências de aprovação de férias após ${quantRepeticao} tentativas`);
      }
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que aprova a solicitação de férias feitas pelo liderado - Gestor Delegado
   * @param {string} idGestorDelegado id do Gestor
   * @param {string} idGestor id do Gestor Titular
   * @param {json} json json utilizado para realizar o Post
   */
  async aprovacaoSolicitacaoFeriasGestorDelegado(idGestorDelegado, idGestor, json) {
    try {
      const endpoint = new URL(
        `${BASE_API_LEGADO}vacationrequestupdate/approve?activeEmployeeId=${idGestorDelegado}&substitutedEmployeeId=${idGestor}`,
      );

      const response = await axios.put(endpoint.toString(), json, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      const responseValid = await this.request.api.validateApiResponse(response);
      if (!responseValid) {
        return { error: 'Erro ao fazer a solicitação: response inválido' };
      }
      return responseValid;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que aceita as solicitações
   * @param { string } vacationRequestUpdateId ID do vacatioRequestUpdateId - Gestor
   */
  async aceitarSolicitacaoFeriasGestor(vacationRequestUpdateId) {
    JSON_ACEITASOLICITACAO_GESTOR.vacationRequestUpdateId = vacationRequestUpdateId;
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacationrequestupdate/approve`);

      const response = await axios.put(endpoint.toString(), JSON_ACEITASOLICITACAO_GESTOR, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });
      await this.request.api.validateApiResponse(response);
      console.log('Solicitação aprovada com sucesso!');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }

  /**
   * Função que altera a regra de assinatura eletronica de férias
   * @param {object} payloadConfiguracao payload que contem a regra de assinatura eletronica
   * Exemplo: {
    "vacationSignatureConfigurationId": "f9e84744-4201-4706-8c39-9f74c63c0e74",
    "signaturePoint": "WITH_VACATION_RECEIPT_GENERATION",
    "needEmployeeSignVacationNotice": true,
    "needEmployeeSignVacationReceipt": true
    }
   */
  async mudarRegraAssinaturaEletronica(payloadConfiguracao) {
    try {
      const endpoint = new URL(`${BASE_API}hcm/vacationmanagement/queries/changeVacationSignatureConfiguration`);

      const response = await axios.post(endpoint.toString(), payloadConfiguracao, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      console.log('Configuração alterada');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Método que busca o idEnvelop dos documentos de férias
   * @param {string} employeeId Id do colaborador
   * @returns id do envelope
   */
  async buscarIdDocumentosFerias(employeeId) {
    try {
      const endpoint = new URL(`${BASE_API_LEGADO}vacation/${employeeId}`);

      const response = await axios.get(endpoint.toString(), {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          ContentType: 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);

      const responseBodyString = JSON.stringify(response.data);
      console.log('buscarIdDocumentosFerias:', responseBodyString);

      if (response.data.vacationSignatureData && Object.keys(response.data.vacationSignatureData).length > 0) {
        const info = response.data.vacationSignatureData.vacationReceiptSignatures[0].signatures[0].gedSignatureLink;
        console.log('Info:', info);

        const pedaco = info.split('envelope=');
        const evelope = pedaco[1].split('&config=');
        console.log('Envelope:', evelope[0]);

        return evelope[0];
      }
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Método que assina documentos de aviso e recibo de férias
   * @param {string} employeeId id do colaborador
   */
  async assinarDocumentosFerias(employeeId) {
    const envelope = String(await this.buscarIdDocumentosFerias(employeeId));
    console.log(`Envelope encontrada: ${JSON.stringify(envelope, null, 2)}`);

    JSON_ASSINATURAAVISO.signature.processId = envelope.toString();

    try {
      // Obter a lista de notificações
      const endpoint = new URL(`${BASE_API}platform/ecm_ged/actions/requestSignatureByUserLogged`);
      const response = await axios.post(endpoint.toString(), JSON_ASSINATURAAVISO, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`assinarDocumentosFerias efetuado: ${JSON.stringify(response.data, null, 2)}`);

      await this.request.api.validateApiResponse(response);
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Método que busca todas as politicas de férias cadastradas no sistema
   */
  async buscaPolitica() {
    try {
      const endpoint = new URL(`${BASE_API}hcm/vacationmanagement/queries/vacationPolicyWithCompaniesCount`);

      const response = await axios.post(endpoint.toString(), JSON_BUSCAPOLITICA, {
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      return response;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Método que cadastra nova politica de férias
   * @param {object} payloadPoliticaFerias payload que contem a nova politica de férias
   */
  async cadastraNovaPolitica(payloadPoliticaFerias) {
    try {
      const endpoint = new URL(`${BASE_API}hcm/vacationmanagement/actions/saveOrUpdateVacationPolicy`);

      const response = await axios.post(endpoint.toString(), payloadPoliticaFerias, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      console.log('Nova política de férias cadastrada');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Método que exclui politica de férias
   * @param {string} newVacationPolicyId ID da politica que receberá os empresas da politica removida
   * @param {string} vacationPolicyId ID da politica que será removida
   */
  async excluirPolitica(newVacationPolicyId, vacationPolicyId) {
    try {
      const buscaPolitica = await this.buscaPolitica();
      const newVacationPolicy = buscaPolitica.data.vacationPolicies.find((atributo) => atributo.policyName === newVacationPolicyId).id;
      const vacationPolicy = buscaPolitica.data.vacationPolicies.find((atributo) => atributo.policyName === vacationPolicyId).id;
      JSON_EXCLUIPOLITICAFERIAS.newVacationPolicyId = newVacationPolicy;
      JSON_EXCLUIPOLITICAFERIAS.vacationPolicyId = vacationPolicy;

      const endpoint = new URL(`${BASE_API}hcm/vacationmanagement/actions/removeVacationPolicy`);

      const response = await axios.post(endpoint.toString(), JSON_EXCLUIPOLITICAFERIAS, {
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await this.request.api.validateApiResponse(response);
      console.log('Política de férias excluída');
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
}
