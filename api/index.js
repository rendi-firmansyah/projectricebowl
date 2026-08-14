const app = require('../backend/server.js');

app.get('/api/auth-health', (req, res) => {
  res.json({
    status: 'ok',
    route: '/api/auth-health',
    message: 'Auth API route is available'
  });
});

module.exports = app;
