# Informações Gerais

- **Nº Roteiro:** 001
- **Nr issue Jira:** ERPONU-7128
- **Produto:** Gestão Empresarial | ERPX > Banking > Recebimento > Boleto
- **Nome:** Jornada para criação de boleto e suas validações
- **Data Criação:** 06/03/2025

## **Objetivo de Teste**

Validar a jornada de boleto, desde da geração, até liquidação do mesmo.

## **Regras e Diretrizes para o Copilot**

O código gerado deve seguir estritamente as seguintes diretrizes:

### **1. Estrutura de Arquivos**

📂 **Coverage:**
└── `coverageFeatureMap.yml`. // Deverá adicionar o coverage.

📂 **helpers/**
└── `helpers/index.js` // Deverá instanciar os arquivos gerados.

📂 **api/**
└── `api/banking/recebimento/boletoApi.js` // Deverá criar o arquivo api.

📂 **pages/**
└── `pages/banking/recebimento/boletoPage.js` // Deverá criar o arquivo page.

📂 **tests/**
└── `tests/jornadas/banking/recebimento/boletoEsales.spec.js` // Deverá criar o arquivo spec.

📂 **data/**
└── `data/banking/recebimento/boletoJson.js` // Deverá criar o arquivo json.

📂 **db/**
└── `db/banking/recebimento/boletoDb.js` // Deverá criar o arquivo banco.

### **2. Regras de Implementação**

#### **Validação do Código com ESLint**

- Todo o código gerado deve estar em conformidade com as regras do `eslint.config.mjs`.
- Antes de concluir a geração do código, valide se ele passa sem erros pelo ESLint.

#### **Uso do Page Object Model (POM)**

- Separar ações e seletores em classes dentro da pasta `pages/`.
- Criar todos os `locators` dentro do `constructor`.

#### **Uso de Localizadores Recomendados**

- Sempre utilizar `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `filter` ou `locator` para buscar elementos.
- **Todos os localizadores devem ser declarados dentro do `constructor`.
- Se a função utilizar de métodos `filifieldLookUp`, `filifield`, `typeFieldLabel`, utilizar os seletores baseados em IDs.
- **Não aceite testes que instanciam seletores diretamente no `spec.js`.**

#### **Uso de Assertivas Web-First**

- Sempre utilizar `expect` do Playwright para validações rápidas e confiáveis.

#### **Validação de `iframe`**

- Antes de interagir com elementos dentro de um `iframe`, verifique se há necessidade real de manipular o `frame`.
- Utilize `frameLocator` para localizar elementos dentro de `iframes`, caso necessário.

#### **Uso de Arquivos JSON**

- Todos os dados devem estar completos, sem omitir campos com `// ...other fields...`.

#### **Aplicação de JSDoc**

- **Todas as classes e métodos devem ter uma documentação JSDoc clara.**

#### **Sempre siga essa estrutura para arquivos de apis (`*Api.js`)**

- A estrutura do arquivo de `api` deve seguir a estrutura definida no `copilot-instructions.md`.

#### **Sempre siga essa estrutura para arquivos de banco (`*.db.js`)**

- A estrutura do arquivo de `db` deve seguir a estrutura definida no `copilot-instructions.md`.

#### **Uso Correto do `page` e `request`**

- Sempre utilize `page` e `request` já configurados dentro das classes globais do projeto.
- Nunca instancie `new Page()` ou `new Request()`.
- Quando utilizado a frase "valide a tela de carregamento", utilize do método no `comunsPage.esperarCarregamentoFiltragem()`.

---

## Implementação do Cenário 01

### **Passos Detalhados**

#### **1. Pré-requisitos (`beforeEach`)**

- **Descrição:** Configurar ambiente de teste e autenticação via API.
- **Ações:**
  - Implementar `BeforeEach` com login via `page.dataUtils.login`.
  - Acessar a tela criando um método no `page.baixaTitulosPage` acessando para a URL COBRANCABOLETO = `${BASE_URL}gestao-empresarial/erpx_bnk_cob/boleto/#/cobranca-item-boleto` alterando o arquivo `urls.js`.
  - Valide o carregamento do título "Cobrança boleto" e valide se está visível.
  - Utilizar a função `baixarTitulosApi.salvarTitulos` já existente.
  - **Código:**

    ```javascript
    import {
      JSON_SALVARTITULOS,
      JSON_REGISTRARBOLETO,
      JSON_FILTRARBOLETO,
      JSON_VALIDARGERACAOBOLETO,
      JSON_VALIDARLIQUIDACAOBOLETO,
      JSON_VALIDARDETALHESBOLETO,
    } from '../../../../data/banking/recebimento/1boletoJson';
    import { recuperaIdTitulo } from '../../../../db/banking/recebimento/1boletoDb';
    import { test } from '../../../helpers';
    import { BANKING_ERPXUI } from '../../../helpers/ambiente';

    const database = 'erpx';
    const tenant = 'testeserpxcombr';

    test.beforeEach(async ({ page, request }) => {
      console.log('Executando teste: ${test.info().title}');
      await page.dataUtils.login(BANKING_ERPXUI);
      await page.boletoPage.acessaTela();
      await request.api.setToken(BANKING_ERPXUI);
      test.setTimeout(280000);

      const numPrimeiroTitulo = await page.comunsPage.gerarNumeroAleatorioComData();
      const seuNumero = await page.comunsPage.gerarNumeroAleatorioComData();
      JSON_SALVARTITULOS.titulos[0].numeroTítulo = numPrimeiroTitulo;

      await request.baixarTitulosApi.salvarTitulos(JSON_SALVARTITULOS);
      const idTcr = await recuperaIdTitulo(database, tenant, numPrimeiroTitulo);
    });
    ```

#### **2. Recuperação do ID do Título via Banco**

- **Ações:**
  - Criar somente o método `recuperaIdTitulo` em `boletoDb.js`.
  - Utilizar `selecionaRegistrosPg(database, queryIdTitulo, 'id');` do `api/index.js`.
  - Executar a query `SELECT id FROM erpx_fin_${tenant}.e301tcr WHERE numtit = '${numeroTitulo}'`.
  - Retornar a primeira posição do `selecionaRegistrosPg`.
  - Se nao houver um retorno na primeira posição, deverá retornar um erro.

#### **3. Atribuir valoress ao JSON**

- **Ações:**
  - Gerar duas variáveis utilizando a função `comunsPage.gerarNumeroAleatorioComData()`.
  - Atribuir o valro da primeira variável ao JSON `JSON_SALVARTITULOS.titulos[0].numeroTítulo`.
  - Atribuir o valor da primeira e segunda variável ao JSON `JSON_VALIDARDETALHESBOLETO.validarDetalhesBoleto.push(seuNumero, numPrimeiroTitulo);`.
  - Atribuir o valor da primeira variável ao JSON `JSON_REGISTRARBOLETO.accountsReceivable[0].accountReceivableNumber`.
  - Atribuir o valor da segunda variável ao JSON `JSON_REGISTRARBOLETO.accountsReceivable[0].yourNumber`.
  - Atribuir o valor da variável obtida a partir da chamada `recuperaIdTitulo(database, tenant, numPrimeiroTitulo);` ao JSON `JSON_REGISTRARBOLETO.accountsReceivable[0].accountReceivableId`.
  - Atribuir o valor da primeira variável ao JSON `JSON_FILTRARBOLETO.numeroTitulo`.

#### **4. Registro do Boleto via API**

- **Ações:**
  - Criar somente o método `registerBankSlipBilling` em `boletoApi.js`., que receberá como parametro o `JSON_REGISTRARBOLETO`.
  - Utilizar `axios.post()` para enviar `JSON_REGISTRARBOLETO` ao endpoint `${BASE_API}erpx_bnk_cob/register_boleto/actions/registerBankSlipBilling`.

#### **5. Filtrar boleto**

- **Tela:**
  - cobranca-boleto.html
- **Ações:**
  - Chamar o metodo `comunsPage.fillFieldSLookup("#cliente-autocomplete", JSON_FILTRARBOLETO.cliente)` para pesquisar o "Cliente".
  - Digite o texto `JSON_FILTRARBOLETO.numeroTitulo` no "Título" `#numeroTitulo`.
  - Digite o texto `JSON_FILTRARBOLETO.nomeBeneficiario` no "Nome do beneficiário" `#nomeBeneficiario`.
  - Clicar em "Filtrar" na página da web.
  - Chamar o metodo `comunsPage.esperarCarregamentoFiltragem()`.
  - Validar o texto "1 registro(s) encontrado(s)" está visível.

#### **6. Criar boleto**

- **Tela:**
  - cobranca-boleto.html
- **Ações:**
  - Clicar em `Ações` na página da web.
  - Clicar em `Criar boleto` na `role="menuitem"` na página da web, aplicar a solução para elementos âncora.
  - Validar o texto "Iniciado processo de criação do boleto. Aguarde alguns instantes e o boleto será criado".
  - Chamar o método `comunsPage.expandirFiltro()`.
  - Clicar apenas em "Filtrar" na página da web, os campos da pesquisa já estão preenchidos.
  - Chamar o método `comunsPage.validarGrid(JSON_VALIDARGERACAOBOLETO.validarGrid)` para validar que se de "Processando" para "Gerado".

#### **7. Liquidar Boleto**

- **Tela:**
  - cobranca-boleto.html
- **Ações:**
  - Clicar em `Ações` na página da web.
  - Clicar em `Liquidar boleto` na `role="menuitem"` na página da web, aplicar a solução para elementos âncora.
  - Validar o texto "Iniciado processo de liquidação do boleto. Aguarde alguns instantes e o boleto será liquidado".
  - Chamar o método `comunsPage.expandirFiltro()`.
  - Clicar apenas em "Filtrar" na página da web, os campos da pesquisa já estão preenchidos.
  - Chamar o método `comunsPage.validarGrid(JSON_VALIDARLIQUIDACAOBOLETO.validarGrid)` para validar que se de "Gerado" para "Pago".

#### **8. Detalhes do boleto**

- **Tela:**
  - cobranca-boleto.html
- **Ações:**
  - Clicar em `Ações` na página da web.
  - Clicar em `Detalhes` na `role="menuitem"` na página da web, aplicar a solução para elementos âncora.

#### **9. Validar detalhes do boleto**

- **Tela:**
  - cobranca-boleto.html
- **Ações:**
  - Para as validações a seguir, valide o primeiro match encontrado.
  - Clicar no texto exato `Detalhes gerais` na `a role="tab"` na página da web.
  - No `primeiro` componente `info-detail-component`, validar o `primeiro` texto compatível com `JSON_VALIDARDETALHESBOLETO.validarInformacoes`.
  - Clicar no texto exato `Detalhes boleto` na `a role="tab"` na página da web.
  - No `segundo` componente `info-detail-component`, validar o `primeiro` texto compatível com `JSON_VALIDARDETALHESBOLETO.validarDetalhesBoleto`.
  - Clicar no texto exato `Detalhes do valor` na `a role="tab"` na página da web.
  - No `terceiro` componente `info-detail-component`, validar o `primeiro` texto compatível com  `JSON_VALIDARDETALHESBOLETO.validaDetalhesValor`.
  - Clicar no `primeiro` botão `Fechar` encontrado na página da web.

#### **10. Criação dos Json**

- **Descrição:** Fazer a massa de dados utilizado no desenvolvimento do teste.
- **Ações:**
  - Os Json devem ser criados na integra, sem falatar qualquer dado e não utilizar `// ...other fields...`.
  - Complemente o arquivo  `data\\banking\\recebimento\\boletoJson.js` com os json a seguir:

    ```javascript
    const dataAtual = new Date().toISOString().substring(0, 10);
    const dataEmissao = new Date().toISOString().substring(0, 10);
    const empresa = 'SENIOR SISTEMAS S.A. BETA';
    const filial = 'SENIOR SISTEMAS UNIDADE DE BLUMENAU';
    const pessoa = 'Pessoa para ERPMAD-13477';
    const pessoaCompleta = '180 - Pessoa para ERPMAD-13477';

    export const JSON_SALVARTITULOS = {
      titulos: [
        {
          descontos: {
            periodoDesconto: 'VM',
            percentualAntecipacao: 0,
            percentualPontualidade: 0,
            antecipacao: false,
            tolerancia: 0,
            valor: 0,
            percentual: 0,
            _discriminator: 'recDescontosReceber',
          },
          informacoesAdicionais: {
            observacao: 'INCLUIDO TÍTULO GERAL PARA ERPMAD-13477',
            portador: { id: '0d3ebdbf-9f62-4acc-9063-10175511cc84', label: '999 - Portador 999', codigo: '999', descricao: 'Portador 999' },
            carteira: {
              id: 'bb95961c-46ea-4055-ab4d-c8b243a1aabe',
              label: '01 - Cobrança Simples s/ Registro',
              codigo: '01',
              descricao: 'Cobrança Simples s/ Registro',
            },
            codigoBarras: '',
            _discriminator: 'recInformacoesAdicionaisTituloReceber',
          },
          empresa: {
            id: '62c03510-c357-49ea-acd8-450c1796d38c',
            label: '50 - SENIOR SISTEMAS S.A. BETA',
            codigo: '50',
            descricao: empresa,
          },
          filial: {
            id: 'a91b4c27-66de-4915-a22a-93fc89ad8fa4',
            label: '10 - SENIOR SISTEMAS UNIDADE DE BLUMENAU',
            codigo: '10',
            descricao: filial,
          },
          pessoa: {
            id: '96a19f67-c7ae-4ecf-a6f7-68d3086e1bad',
            label: pessoaCompleta,
            codigo: '180',
            descricao: pessoa,
          },
          numeroTitulo: '14263/01',
          tipoTitulo: { id: '8c30cffc-9ff7-4cd1-ad36-3b97ffcae6c7', label: 'DM - DUPLICATA MERCANTIL', codigo: 'DM', descricao: 'DUPLICATA MERCANTIL' },
          transacao: {
            id: '6b350577-7074-4d87-aec7-30b89b714a93',
            label: '90300 - Entrada Título Manual',
            codigo: '90300',
            descricao: 'Entrada Título Manual',
          },
          dataEmissao: dataEmissao,
          dataEntrada: dataEmissao,
          vencimentoOriginal: dataEmissao,
          vencimentoProrrogado: dataEmissao,
          provavelPagamento: dataEmissao,
          situacaoTitulo: 'VAB',
          valorOriginal: 3687.78,
          valorAberto: 3687.78,
          moeda: { moeda: { id: 'a39b1937-b37b-46a9-b001-506b3b9e190e', label: 'BRL - Real', codigo: 'BRL', descricao: 'Real' }, cotacaoEmissao: 1 },
          rateio: {},
          juros: { valorJurosDia: 0, percentual: 0, tipo: 'VC', toleranciaJuros: 0, prorrogaJuros: true },
          multa: { percentual: 0, toleranciaMulta: 0 },
          valoresNegociados: { juroNegociado: 0, multaNegociada: 0, descontoNegociado: 0, outrosValoresNegociados: 0, cotacaoNegociada: 0 },
          credito: false,
          _dataKey: '143a9078-dba4-448a-ab2e-723c91476641',
        },
      ],
    };

    export const JSON_REGISTRARBOLETO = {
        receivableBank: 'ITAU',
        beneficiary: {
            name: 'Irineu',
            documentNumber: '99999999999962',
            covenant: '99999',
            branchNumber: '9999',
            branchDigit: '9',
            accountNumber: '99999',
            accountDigit: '9',
        },
        accountsReceivable: [
            {
                accountReceivableId: '01196ffd-aef5-49d4-a8e6-522f130bc5fb',
                accountReceivableNumber: 'Titulo 0503/01',
                accountReceivableType: '01',
                yourNumber: '050301',
                customer: {
                    id: '032a5f18-147f-43a0-8dcd-354fea1978a9',
                },
                dueDate: dataAtual,
                specie: 'COMMERCIAL_DUPLICATE',
                wallet: 'SIMPLE',
                values: {
                    original: '200',
                },
            },
        ],
    };

    export const JSON_FILTRARBOLETO = {
      cliente: 'Pessoa para BOLETO ERPONU-7128',
      numeroTitulo: '094111/01',
      nomeBeneficiario: 'Irineu',
    };

    export const JSON_VALIDARGERACAOBOLETO = {
      validarGrid: ['Gerado'],
    };

    export const JSON_VALIDARLIQUIDACAOBOLETO = {
      validarGrid: ['Pago'],
    };

    export const JSON_VALIDARDETALHESBOLETO = {
      validarInformacoes: ['Irineu', '99.999.999/9999-62', '99999', 'Itaú', '9999-9', '99999-9'],
      validarDetalhesBoleto: [
        '181 - Pessoa para BOLETO ERPONU-7128',
        'Duplicata mercantil',
        'Simples',
        '00000000000000000000000000000000000000000000000',
        '01',
      ],
      validaDetalhesValor: ['R$200,00', 'R$0,00'],
      validaDetalhesLiquidacao: ['R$200,00', 'R$0,00', new Date().toLocaleDateString('pt-br')],
    };
    ```

---

- Respeite as `**Regras de Implementação**`
- Siga corretamente os 10 `**Passos Detalhados**`, sem omitir passos ou ações.
- Crie os arquivos de acordo com a estrutura de arquivos.
- Crie os JSDoc corretamente.
- Crie os locators dentro do constructor.
- Instancie as classes criadas no helpers/index.
- Não utilize localizadores dinamicos, que alteram em cada renderização.
- Utilize o filter para conseguir localizadores mais precisos.
