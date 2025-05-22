import knex from 'knex';
import { Client } from 'pg';

import config from '../utils/config';

/**
 * Autentica o usuário em um banco de dados SQL Server e retorna true se a autenticação for bem-sucedida.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @returns {Promise<boolean>} - true se a autenticação for bem-sucedida, caso contrário, false.
 */
async function connectToSqlServer(identificadorDeConexao) {
  let db;
  try {
    // Verifique se o identificador de conexão existe nas configurações
    if (!config[identificadorDeConexao]) {
      throw new Error('Identificador de conexão não encontrado nas configurações.');
    }
    // Use o identificador de conexão para selecionar a configuração apropriada
    const conexaoConfig = config[identificadorDeConexao];
    if (!conexaoConfig.connection) {
      throw new Error('Configuração de conexão ausente.');
    }
    // Obtenha as informações de conexão a partir da configuração
    const { host, user, password, database, port } = conexaoConfig.connection;

    // Inicialize o knex com as configurações obtidas
    const knexConfig = {
      client: conexaoConfig.client,
      connection: {
        host,
        user,
        password,
        database,
        port,
        options: {
          requestTimeout: 120000,
        },
      },
      pool: {
        min: 2,
        max: 90,
        createTimeoutMillis: 20000,
        acquireTimeoutMillis: 120000,
        idleTimeoutMillis: 120000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 400,
        propagateCreateError: false,
      },
    };
    db = knex(knexConfig);
    // Tente estabelecer a conexão para autenticar o usuário
    await db.raw('SELECT 1 as result');
    return db;
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return false;
  }
}
/**
 * Autentica o usuário em um banco de dados Postgress e retorna true se a autenticação for bem-sucedida.
 * @param {string} database - O identificador da configuração de conexão. Exemplo: 'nhcm'.
 * @returns {Promise<boolean>} - true se a autenticação for bem-sucedida, caso contrário, false.
 */
async function connectToPostgres(database) {
  const databaseConfigurations = {
    nhcm: 'postgres://sua_outra_url_de_conexao/nhcm',
    onboarding: 'postgres://sua_outra_url_de_conexao/onboarding',
  };

  if (!databaseConfigurations[database]) {
    throw new Error(`Configuração de banco de dados não encontrada para: ${database}`);
  }

  const databaseURL = databaseConfigurations[database];
  const clientPostgres = new Client({
    connectionString: databaseURL,
    connectionTimeoutMillis: 60000,
  });

  try {
    await clientPostgres.connect();
    return clientPostgres;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}
/**
 * Seleciona registros de uma tabela específica no banco de dados com base em uma query SQL personalizada.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {string} tabela - O nome da tabela da qual os registros serão selecionados.
 * @param {string} [queryPersonalizada] - Uma query SQL personalizada que determina quais registros serão selecionados.
 * @returns {Promise<any>} - Os registros selecionados da tabela.
 */
async function selecionarRegistros(identificadorDeConexao, tabela, queryPersonalizada) {
  let db;
  try {
    db = await connectToSqlServer(identificadorDeConexao);
    // Execute a query personalizada ou a seleção padrão
    const resultado = queryPersonalizada ? await db.raw(queryPersonalizada) : await db(tabela).select('*');

    console.log(`Registro selecionado com sucesso na ${tabela.toUpperCase()}: `, resultado);
    return resultado;
  } catch (error) {
    console.error('Erro ao executar a consulta:', error);
    throw error;
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}
/**
 * Insere registros em uma tabela específica no banco de dados.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {string} tabela - O nome da tabela onde os registros serão inseridos.
 * @param {object} dados - Os dados a serem inseridos na tabela. Exemplo: { nome: 'John', idade: 30, email: 'john@example.com' }
 * @returns {Promise<any>} - O resultado da operação de inserção.
 */
async function inserirRegistros(identificadorDeConexao, tabela, dados) {
  let db;
  try {
    db = await connectToSqlServer(identificadorDeConexao);
    // Execute a operação de inserção na tabela
    const resultado = await db(tabela).insert(dados);
    console.log(`Registro inserido na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado;
  } catch (error) {
    console.error('Erro ao inserir registros:', error);
    throw error;
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}
/**
 * Atualiza registros em uma tabela específica no banco de dados com base em uma condição.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {string} tabela - O nome da tabela onde os registros serão atualizados.
 * @param {object} condicao - A condição que determina quais registros serão atualizados.
 *                         Exemplo: { id: 1 } (Atualizará registros onde o campo "id" é igual a 1).
 * @param {object} atualizacao - Os dados de atualização a serem aplicados aos registros.
 *                         Exemplo: { idade: 31 } (Atualizará a coluna "idade" para o valor 31).
 * @returns {Promise<any>} - O resultado da operação de atualização.
 */
async function atualizarRegistros(identificadorDeConexao, tabela, condicao, atualizacao) {
  let db;
  try {
    db = await connectToSqlServer(identificadorDeConexao);
    // Execute a operação de atualização na tabela
    const resultado = await db(tabela).where(condicao).update(atualizacao);
    console.log(`Registro atualizado na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado;
  } catch (error) {
    console.error('Erro ao atualizar registros:', error);
    throw error;
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}
/**
 * Exclui registros de uma tabela específica no banco de dados com base em uma condição.
 * @param {string} identificadorDeConexao - O identificador da configuração de conexão. Exemplo: 'autohcm01'.
 * @param {string} tabela - O nome da tabela onde os registros serão excluídos.
 * @param {object} condicao - A condição que determina quais registros serão excluídos.
 *                         Exemplo: { id: 2 } (Excluirá registros onde o campo "id" é igual a 2).
 * @returns {Promise<any>} - O resultado da operação de exclusão.
 */
async function excluirRegistros(identificadorDeConexao, tabela, condicao) {
  let db;
  try {
    db = await connectToSqlServer(identificadorDeConexao);
    // Execute a operação de exclusão na tabela
    const resultado = await db(tabela).where(condicao).del();
    console.log(`Registro excluído na tabela ${tabela.toUpperCase()} com sucesso: `, resultado);
    return resultado;
  } catch (error) {
    console.error('Erro ao excluir registros:', error);
    throw error;
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}
/**
 * Executa uma consulta SELECT em um banco de dados PostgreSQL.
 * @param {string} database - O nome da configuração do banco de dados.
 * @param {string} querySelect - A consulta SELECT a ser executada.
 * @param {string} fieldSelect - O campo a ser retornado pela consulta.
 * @param {number} numRows - quantidade de registros desejados
 * @returns {Promise<string>} O resultado da consulta.
 * @throws {Error} Se ocorrer um erro durante a execução da consulta.
 */
async function selecionaRegistrosG7(database, querySelect, fieldSelect, numRows = null) {
  const client = await connectToPostgres(database);
  try {
    const query = numRows ? `${querySelect} LIMIT ${numRows}` : querySelect;
    const resultQuery = await client.query(query);

    const numberOfRows = resultQuery.rows.length;
    const selectedValues = fieldSelect ? resultQuery.rows.map((row) => row[fieldSelect]) : null;

    return { numberOfRows, selectedValues };
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    throw error;
  } finally {
    await client.end();
  }
}
/**
 * Insere registros em uma tabela de banco de dados PostgreSQL.
 * @param {string} database - O nome da configuração do banco de dados.
 * @param {string} queryInsert - A consulta INSERT a ser executada. Ex: 'INSERT INTO users (name, age, email) VALUES ($1, $2, $3)'.
 * @param {Array} values - Os valores a serem inseridos na tabela. Ex: ['João', 25, 'joao@example.com'];
 * @returns {Promise<number>} O número de linhas afetadas pela inserção.
 * @throws {Error} Se ocorrer um erro durante a execução da consulta.
 */
async function insertRegistrosG7(database, queryInsert, values) {
  const client = await connectToPostgres(database);
  try {
    const result = await client.query(queryInsert, values);
    console.log(`Inserção bem-sucedida: ${result.rowCount} linhas inseridas.`);
    return result.rowCount;
  } catch (error) {
    console.error('Erro ao executar inserção:', error);
    throw error;
  } finally {
    await client.end();
  }
}
/**
 * Atualiza registros em uma tabela de banco de dados PostgreSQL.
 * @param {string} database - O nome da configuração do banco de dados.
 * @param {string} queryUpdate - A consulta UPDATE a ser executada. Ex: 'UPDATE users SET age = $1 WHERE name = $2'.
 * @param {Array} values - Os valores a serem atualizados na tabela. Ex: [26, 'João'];
 * @returns {Promise<number>} O número de linhas afetadas pela atualização.
 * @throws {Error} Se ocorrer um erro durante a execução da consulta.
 */
async function updateRegistrosG7(database, queryUpdate, values) {
  const client = await connectToPostgres(database);
  try {
    const result = await client.query(queryUpdate, values);
    console.log(`Atualização bem-sucedida: ${result.rowCount} linhas atualizadas.`);
    return result.rowCount;
  } catch (error) {
    console.error('Erro ao executar atualização:', error);
    throw error;
  } finally {
    await client.end();
  }
}
/**
 * Exclui registros em uma tabela de banco de dados PostgreSQL.
 * @param {string} database - O nome da configuração do banco de dados.
 * @param {string} queryDelete - A consulta DELETE a ser executada. Ex: 'DELETE FROM users WHERE name = $1 AND age = $2 AND email = $3'.
 * @param {Array} values - Os valores para a cláusula WHERE, ex: ['João', 25, 'joao@example.com'];
 * @returns {Promise<number>} O número de linhas afetadas pela exclusão.
 * @throws {Error} Se ocorrer um erro durante a execução da consulta.
 */
async function deleteRegistrosG7(database, queryDelete, values) {
  const client = await connectToPostgres(database);
  try {
    const result = await client.query(queryDelete, values);
    console.log(`Exclusão bem-sucedida: ${result.rowCount} linhas excluídas.`);
    return result.rowCount;
  } catch (error) {
    console.error('Erro ao executar exclusão:', error);
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  selecionarRegistros,
  inserirRegistros,
  atualizarRegistros,
  excluirRegistros,
  selecionaRegistrosG7,
  deleteRegistrosG7,
  updateRegistrosG7,
  insertRegistrosG7,
};
