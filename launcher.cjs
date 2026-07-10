const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const xamppRoot = process.env.XAMPP_ROOT || 'C:\\xamppnew';
const mysqlRoot = path.join(xamppRoot, 'mysql');
const mysqlBinDir = path.join(mysqlRoot, 'bin');
const mysqlDataDir = path.join(mysqlRoot, 'data');

const logFile = path.join(__dirname, 'mysql_diag.log');
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- RE-SPAWN LOG STARTED AT ' + new Date().toISOString() + ' ---\n');

// Recursive folder copy helper
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Kill any existing mysql process first
function killMySQL() {
  try {
    const tasklist = execSync('tasklist').toString();
    if (tasklist.toLowerCase().includes('mysqld')) {
      log('Killing existing mysqld process...');
      execSync('taskkill /F /IM mysqld.exe');
    }
  } catch (e) {
    log('Process kill error: ' + e.message);
  }
}

const mysqlCmd = path.join(mysqlBinDir, 'mysqld.exe');
const mysqlArgs = [`--defaults-file=${path.join(mysqlBinDir, 'my.ini')}`, '--standalone'];

function spawnMySQL() {
  log(`Spawning MySQL with CWD ${mysqlRoot}...`);
  try {
    if (fs.existsSync(mysqlCmd)) {
      const mysqlProcess = spawn(mysqlCmd, mysqlArgs, {
        cwd: mysqlRoot,
        detached: true,
        stdio: 'ignore'
      });
      mysqlProcess.unref();
      log('MySQL process spawned successfully.');
    } else {
      log('MySQL executable not found at ' + mysqlCmd);
    }
  } catch (e) {
    log('Error spawning MySQL: ' + e.message);
  }
}

function startBackend() {
  // Kill existing process on port 5000
  try {
    const stdout = execSync('netstat -ano').toString();
    const lines = stdout.split('\n');
    lines.forEach(line => {
      if (line.includes(':5000') && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          log(`Killing existing backend process on port 5000 (PID: ${pid})...`);
          execSync(`taskkill /F /PID ${pid}`);
        }
      }
    });
  } catch (e) {
    log('Error killing existing port 5000 process: ' + e.message);
  }

  log('Starting Node backend server...');
  const backendDir = path.join(__dirname, 'backend');
  const backendProcess = spawn('node', ['server.js'], {
    cwd: backendDir,
    detached: true,
    stdio: 'ignore'
  });
  backendProcess.unref();
  log('Backend server process spawned.');
}

function verifyAndSetupDB(isRetry = false) {
  log('Verifying MySQL database and importing SQL files...');
  const mysqlBin = path.join(mysqlBinDir, 'mysql.exe');
  try {
    execSync(`"${mysqlBin}" -u root -e "SHOW DATABASES;"`);
    log('Connected to MySQL successfully!');

    const sqlPath = path.join(__dirname, 'database_full.sql');
    if (fs.existsSync(sqlPath)) {
      log('Importing database_full.sql...');
      execSync(`"${mysqlBin}" -u root < "${sqlPath}"`);
      log('database_full.sql imported.');
    } else {
      execSync(`"${mysqlBin}" -u root -e "CREATE DATABASE IF NOT EXISTS rendiweb_db;"`);
      log('Database rendiweb_db verified/created.');
    }

    // Database is good, start the backend server
    startBackend();

  } catch (err) {
    log('Error in mysql tasks: ' + err.message);

    // If it's already a retry, don't keep retrying
    if (isRetry) {
      log('Self-healing was already attempted, giving up.');
      return;
    }

    log('Attempting self-healing recovery of MySQL privilege tables...');
    try {
      const backupMysqlDir = path.join(mysqlRoot, 'backup', 'mysql');
      const dataMysqlDir = path.join(mysqlDataDir, 'mysql');
      const backupIbData = path.join(mysqlRoot, 'backup', 'ibdata1');
      const dataIbData = path.join(mysqlDataDir, 'ibdata1');

      if (fs.existsSync(backupMysqlDir)) {
        log('Renaming corrupted mysql directory...');
        const timestamp = Date.now();
        if (fs.existsSync(dataMysqlDir)) {
          try {
            fs.renameSync(dataMysqlDir, dataMysqlDir + '_corrupted_' + timestamp);
          } catch (renameErr) {
            log('Could not rename mysql directory: ' + renameErr.message);
          }
        }
        log('Copying clean mysql directory from backup...');
        copyFolderSync(backupMysqlDir, dataMysqlDir);

        if (fs.existsSync(backupIbData)) {
          log('Renaming corrupted ibdata1...');
          if (fs.existsSync(dataIbData)) {
            try {
              fs.renameSync(dataIbData, dataIbData + '_corrupted_' + timestamp);
            } catch (renameErr) {
              log('Could not rename ibdata1: ' + renameErr.message);
            }
          }
          log('Copying clean ibdata1 from backup...');
          fs.copyFileSync(backupIbData, dataIbData);
        }

        log('Killing and restarting MySQL after self-healing...');
        killMySQL();
        spawnMySQL();

        log('Waiting 5 seconds for recovered MySQL to start...');
        setTimeout(() => {
          verifyAndSetupDB(true);
        }, 5000);
      } else {
        log('Backup MySQL directory not found at ' + backupMysqlDir);
      }
    } catch (recoveryErr) {
      log('Self-healing failed: ' + recoveryErr.message);
    }
  }
}

// Execute flow
killMySQL();
spawnMySQL();
setTimeout(() => {
  verifyAndSetupDB();
}, 5000);
