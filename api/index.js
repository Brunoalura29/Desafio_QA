import axios from 'axios';
import dotenv from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';
import { createLogger, format, transports } from 'winston';

import { JSON_NOTIFICACAO, JSON_EXCLUINOTIFICACAO } from '../data/painelGestao/feriasJson';

const { combine, timestamp, printf, colorize, json } = format;

dotenv.config();

const MENSAGENS_ERRO = {
  FAZER_SOLICITACAO: 'Erro ao fazer a solicitação: ',
};

const BASE_API = process.env.BASE_API;

// Singleton para garantir uma única instância de Api
let apiInstance = null;
let interceptorsConfigured = false; // Flag para controlar se os interceptores já foram configurados

export class Api {
  /**
   *  Constructor da classe
   * @param {object} request O contexto de requisição do Playwright.
   */
  constructor(request) {
    if (!apiInstance) {
      this.request = request;
      this.token = undefined;
      this.logger = this.createLogger();

      // Registra os interceptores apenas uma vez
      this.setupInterceptors();

      apiInstance = this;
    }

    return apiInstance;
  }

  /**
   * Configura os interceptores para a instância da API.
   */
  setupInterceptors() {
    if (interceptorsConfigured) {
      return; // Se os interceptores já foram configurados, não faça nada
    }

    axios.interceptors.request.use(this.handleRequestSuccess, this.handleRequestError);
    axios.interceptors.response.use(this.handleResponseSuccess, this.handleResponseError);

    interceptorsConfigured = true; // Marca interceptores como configurados
  }

  /**
   * Cria um logger com configurações específicas.
   * @returns {object} Uma instância do logger.
   */
  createLogger() {
    return createLogger({
      level: process.env.LOG_INFO,
      format: combine(
        colorize({ all: true }),
        json(),
        timestamp({ format: 'hh:mm:ss A' }),
        printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;

          if (metadata.method) msg += ` [${metadata.method.toUpperCase()}]`;
          if (metadata.url) msg += ` URL: ${metadata.url}`;

          // Adiciona status e tempo de resposta
          if (metadata.status) msg += ` Status: ${metadata.status}`;
          if (metadata.responseTime) msg += ` Response Time: ${metadata.responseTime}ms`;

          // Formatação aprimorada do erro
          if (metadata.error) {
            const errorStack = metadata.error.stack ? `\nStack: ${metadata.error.stack}` : '';
            msg += `${errorStack}`;
          }

          // Adiciona os dados da resposta e requisição, com verificação para evitar valores indefinidos
          if (metadata.responseData) msg += `\nResponse Data: ${JSON.stringify(metadata.responseData, null, 2)}`;
          if (metadata.requestData) msg += `\nRequest Data: ${JSON.stringify(metadata.requestData, null, 2)}`;

          return msg;
        }),
      ),
      transports: [new transports.Console()],
    });
  }
  /**
   * Manipula as solicitações bem-sucedidas, registrando as informações da solicitação e adicionando um timestamp.
   * @param {object} request - O objeto de solicitação.
   * @returns {object} O objeto de solicitação com metadados adicionados.
   */
  handleRequestSuccess = (request) => {
    request.metadata = { startTime: Date.now() };
    this.logger.info('Request', {
      url: request.url,
      method: request.method,
      requestData: request.data,
    });
    return request;
  };
  /**
   * Manipula os erros de solicitação, registrando as informações do erro e encerrando o processo.
   * @param {object} error - O objeto de erro.
   */
  handleRequestError = (error) => {
    this.logger.error('Request error', {
      error: error.message || 'Erro desconhecido',
      request: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
            headers: error.config.headers,
          }
        : 'Request config não disponível',
      message: error.response?.data?.message || 'Sem mensagem de erro no response',
    });
  };
  /**
   * Manipula as respostas bem-sucedidas, registrando as informações da resposta e calculando o tempo de resposta.
   * @param {object} response - O objeto de resposta.
   * @returns {object} O objeto de resposta.
   */
  handleResponseSuccess = (response) => {
    const responseTime = Date.now() - response.config.metadata.startTime;
    this.logger.info('Response', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      responseTime,
      responseData: response.data ? response.data : null, // Adiciona os primeiros 100 caracteres do response data
    });
    return response;
  };
  /**
   * Manipula os erros de resposta, registrando as informações do erro e encerrando o processo.
   * @param {object} error - O objeto de erro.
   */
  handleResponseError = (error) => {
    let responseData = null;

    // Se error.response?.data for uma string válida em JSON, tenta fazer o parse
    if (error.response?.data) {
      try {
        // Tenta fazer o parse caso seja uma string JSON válida
        responseData = typeof error.response.data === 'string' ? JSON.parse(error.response.data) : error.response.data;
      } catch (parseError) {
        // Registra o erro de parsing para não ignorá-lo
        this.logger.error('Error parsing response data', {
          error: parseError.message || 'Erro ao fazer o parse da resposta',
          rawResponseData: error.response.data,
        });
        // Mantém responseData como a string original, se o parse falhar
        responseData = error.response.data;
      }
    }

    // Extração do diretório da chamada
    const stack = new Error().stack;

    // Filtra a stack trace para manter apenas as linhas relevantes
    const filteredStack = stack
      .split('\n')
      .filter((line) => line.includes('erpx-jornadas-ui-test') && !line.includes('node_modules')) // Filtra pelas linhas do seu projeto
      .map((line) => line.trim()) // Remove espaços em branco desnecessários
      .join('\n'); // Recombina em uma string

    this.logger.error('Response error', {
      error: {
        stack: filteredStack, // Usando as linhas da stack formatadas
      },
      errorCode: responseData?.errorCode,
      reason: responseData?.reason,
      domain: responseData?.domain,
      service: responseData?.service,
      responseData: responseData,
    });
  };
  /**
   * Valida a resposta de uma solicitação de API.
   * @param {Response} response - A resposta da solicitação de API.
   * @returns {Promise<object>} - Retorna uma promessa que resolve para o corpo da resposta se o status for 200-299.
   * @throws {Error} - Lança um erro se o status da resposta for diferente de 200-299. A mensagem de erro inclui o status e a mensagem da resposta.
   */
  async validateApiResponse(response) {
    // Verifica se a resposta está definida
    if (!response) {
      throw new Error('Nenhuma resposta recebida');
    }

    // Verifica se a propriedade status está presente
    if (typeof response.status !== 'number') {
      throw new Error('Resposta sem status');
    }

    // Valida o status da resposta
    if (response.status >= 200 && response.status < 300) {
      return response; // Retorna a resposta se o status estiver no intervalo 2xx
    } else if (response.status >= 300 && response.status < 400) {
      // Trata redirecionamentos
      throw new Error(`Redirecionamento: ${response.status} - ${response.statusText}. URL sugerida: ${response.headers['location']}`);
    } else if (response.status >= 400 && response.status < 500) {
      // Trata erros do cliente
      throw new Error(`Erro do cliente: ${response.status} - ${response.data?.message || response.statusText}`);
    } else if (response.status >= 500) {
      // Trata erros do servidor
      throw new Error(`Erro do servidor: ${response.status} - ${response.data?.message || response.statusText}`);
    } else {
      // Se o status não se encaixar em nenhuma das categorias, lança um erro genérico
      throw new Error(`Erro desconhecido: ${response.status} - ${response.statusText}`);
    }
  }
  /**
   * Realiza uma solicitação de autenticação e retorna o token JSON.
   * @param {object} infoUsuario - As informações de usuário para autenticação.
   * @example
   * const infoUsuario = {
   *   usuario: 'seu_usuario@senior.com', {string}
   *   senha: 'sua_senha', {string}
   * };
   */
  async setToken(infoUsuario) {
    const url = `${BASE_API}platform/authentication/actions/login`;

    const payload = {
      username: infoUsuario.email,
      password: infoUsuario.senha,
    };

    const response = await axios.post(url, payload);

    this.validateApiResponse(response);

    const jsonToken = response.data.jsonToken;
    const bodyAccess = JSON.parse(jsonToken);

    this.token = bodyAccess.access_token;

    // Atualiza a variável de ambiente API_TOKEN
    process.env.API_TOKEN = this.token;
    // Ler o conteúdo atual do arquivo .env
    let envContent = readFileSync('.env', 'utf8');
    // Substituir o valor existente da variável API_TOKEN
    envContent = envContent.replace(/(API_TOKEN=).*/, `$1${this.token}`);
    // Escrever o conteúdo atualizado de volta para o arquivo .env
    writeFileSync('.env', envContent);
    return jsonToken;
  }
  /**
   * Função que pega as notificações da plataforma.
   * @param { string } email email do solicitando
   */
  async buscaNotificacao(email) {
    JSON_NOTIFICACAO.username = email;
    try {
      // Obter a lista de notificações
      const endpoint = new URL(`${BASE_API}platform/notifications/actions/getNotifications`);
      const response = await axios.post(endpoint.toString(), JSON_NOTIFICACAO, {
        ignoreHTTPSErrors: true,
        timeout: 0,
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await this.validateApiResponse(response);

      return response.data;
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
  /**
   * Função que exclui as 10 primeiras notificações da plataforma.
   * @param { string } email email do solicitando
   */
  async excluirNotificacao(email) {
    try {
      // Obter a lista de notificações
      const notificationResponse = await this.buscaNotificacao(email);

      // Verificar se a resposta contém notificações
      if (notificationResponse.notifications) {
        const listaId = notificationResponse.notifications;
        // Iterar sobre cada notificação e arquivá-la
        for (const idNotificacao of listaId) {
          const ids = idNotificacao.notificationID;
          JSON_EXCLUINOTIFICACAO.notificationIDs = [ids];
          const endpointExcluir = new URL(`${BASE_API}platform/notifications/actions/archiveNotifications`);
          await axios.post(endpointExcluir.toString(), JSON_EXCLUINOTIFICACAO, {
            ignoreHTTPSErrors: true,
            timeout: 0,
            headers: {
              Authorization: `Bearer ${process.env.API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
        }
        console.log('Notificações excluídas.');
      } else {
        console.log('Não há notificações para excluir.');
      }
    } catch (error) {
      throw new Error(MENSAGENS_ERRO.FAZER_SOLICITACAO, error.message);
    }
  }
}
