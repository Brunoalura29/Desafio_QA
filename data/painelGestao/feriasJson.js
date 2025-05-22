export const JSON_INSERIRFERIAS = {
  startDate: '2021-03-22',
  vacationDays: '20',
  has13thSalaryAdvance: true,
  vacationBonusDays: '10',
  attachments: [],
  vacationPeriodId: '37601708B7CE4631AC56FFC5BE1DE104',
  employeeId: 'DC2365DE7E4349FB93E0C80981736B3D',
};
export const JSON_REJEITASOLICITACAO = {
  commentary: 'ok',
  dependent: {},
  personRequestUpdateId: '181D2B86F9054FCF8FC8AF4E8406C4FF',
};
export const JSON_ACEITASOLICITACAO = {
  commentary: 'ok',
  dependent: {},
  personRequestUpdateId: '181D2B86F9054FCF8FC8AF4E8406C4FF',
};
export const JSON_ACEITASOLICITACAO_GESTOR = {
  commentary: 'ok',
  vacationRequestUpdateId: '181D2B86F9054FCF8FC8AF4E8406C4FF',
};
export const JSON_EXCLUINOTIFICACAO = {
  notificationIDs: ['162854b1-45ad-4227-a975-51730604bc97'],
};
export const JSON_NOTIFICACAO = {
  username: 'colaborador1@autohcm01.com.br',
  offset: 0,
  limit: 10,
};
export const JSON_ALTERACONFIGURACAO = {
  vacationSignatureConfigurationId: 'f9e84744-4201-4706-8c39-9f74c63c0e74',
  signaturePoint: 'BEFORE_VACATION_START',
  needEmployeeSignVacationNotice: true,
  needEmployeeSignVacationReceipt: true,
  vacationNoticeAvailableDaysInAdvance: '45',
};
export const JSON_ASSINATURAAVISO = {
  signature: {
    processId: '2b83af34-a59e-437b-b659-9364f036bc9a',
    email: 'colaborador2@senior.com.br',
    token: 'EqaKQVrcinQuG9ZIbJCaMV8OCWOB1wDQ',
    decline: false,
  },
};
export const JSON_FILTROVAZIO = {
  isActive: true,
  leaders: [],
  showEmployeeWithGoal: true,
  showEmployeeWithoutGoal: true,
  pdiSituations: [],
  situations: [],
  talentPools: [],
  isDirectDescendants: true,
  employeeId: '0F6A13AC9A544C99A00EA3EFBAD116A8',
  employeeIds: [],
};
export const JSON_FILTRODEPARTAMENTOPRODUCAO = {
  isActive: true,
  leaders: [],
  showEmployeeWithGoal: true,
  showEmployeeWithoutGoal: true,
  department: [
    {
      id: '37A86F66843A46839DCC08A828796CD6',
      name: 'Produção',
      code: '1.03.01',
      tableCode: 1,
    },
  ],
  pdiSituations: [],
  situations: [],
  talentPool: [],
  isDirectDescendants: true,
  employeeId: '0F6A13AC9A544C99A00EA3EFBAD116A8',
  employeeIds: [],
};
export const JSON_APROVACAOSOLICITACAO = {
  vacationRequestUpdateId: '0CE4C2C15FD74F9C857F6E48D1FE4C5E',
  commentary: '',
};
export const JSON_CADASTRAPOLITICA = {
  vacationPolicy: {
    policyName: 'Politica parcelamento',
    allowThirteenthSalaryAnticipation: false,
    allowVacationBonus: false,
    allowInstallmentsOfVacationDiscount: true,
    installmentRule: 'INFORM_INSTALLMENT_NUMBER',
    maximumNumberOfInstallments: 5,
    defaultInstallmentIndication: false,
    vacationSchedulingInAdvanceMinDays: 30,
    vacationChangeMinDays: 30,
    vacationCancellationMinDays: 30,
    validateCompensatedDay: true,
    validateWeeklyPaidRest: true,
    validateHoliday: true,
    validateDayOff: true,
    defaultPolicy: false,
    allowBeforeConcessivePeriod: false,
    allowFractioning: true,
    custom: null,
  },
  fractioningTypes: ['ONE_PART', 'TWO_PARTS', 'THREE_PARTS'],
  companies: [
    {
      companyId: '0d2cd47a-715b-4179-935c-44349f720213',
      selectionType: 'ALL',
      selectionExceptions: [],
    },
    {
      companyId: '01b222f8-cf06-4e65-bda3-bca7a026fd23',
      selectionType: 'SOME',
      someCompanyBranches: {
        newCompanyBranchesSelectionIds: [],
        newCompanyBranchesUnselectionIds: [],
      },
    },
  ],
  newVacationPolicyIdForUnselections: null,
};
export const JSON_EXCLUIPOLITICAFERIAS = {
  vacationPolicyId: '85b6db53-88b4-4712-aa8a-7141165a74f7',
  newVacationPolicyId: '7d0504c1-a25c-45e7-8941-d475cd96c55c',
};
export const JSON_BUSCAPOLITICA = {
  page: {
    offset: 0,
    size: '10',
  },
  orderBy: null,
  filter: [],
};
