module.exports = {
  autohcm01: {
    client: 'mssql', //SQLServer
    connection: {
      host: 'seu-host',
      user: 'seu-user',
      password: 'seu-password',
      database: 'seu-database',
      port: 1433,
    },
  },
  nhcm: {
    client: 'pg', // Postgress
    connection: {
      host: 'seu-host',
      user: 'seu-user',
      password: 'seu-password',
      database: 'seu-database',
      port: 5432,
    },
  },
};
