const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);

const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1] || fallback;
};

const askPassword = () => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('MYSQLPASSWORD: ', (answer) => {
    rl.close();
    resolve(answer);
  });
});

const main = async () => {
  const host = readArg('host', process.env.MYSQLHOST || process.env.DB_HOST);
  const port = Number(readArg('port', process.env.MYSQLPORT || process.env.DB_PORT || 3306));
  const user = readArg('user', process.env.MYSQLUSER || process.env.DB_USER || 'root');
  const database = readArg('database', process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway');
  const password = readArg('password', process.env.MYSQLPASSWORD || process.env.DB_PASSWORD) || await askPassword();
  const schemaPath = path.resolve(__dirname, '..', '..', 'schema.sql');

  if (!host) {
    throw new Error('Missing host. Use --host HOST_RAILWAY');
  }

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true
  });

  try {
    await connection.query(schemaSql);
    console.log('Schema import completed successfully.');
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error('Schema import failed:');
  console.error(error.message);
  process.exit(1);
});
