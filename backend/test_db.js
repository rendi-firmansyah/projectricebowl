const mysql = require('mysql2');

const c = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

c.connect(function (err) {
  if (err) {
    console.log('FAIL: ' + err.message);
    process.exit(1);
  }
  console.log('MySQL connection OK!');
  c.query('CREATE DATABASE IF NOT EXISTS rendiweb_db', function (err2) {
    if (err2) console.log('DB create error: ' + err2.message);
    else console.log('Database rendiweb_db ready');
    c.query('SHOW DATABASES', function (err3, results) {
      if (results) {
        results.forEach(function (r) {
          console.log(' - ' + Object.values(r)[0]);
        });
      }
      c.end();
    });
  });
});
