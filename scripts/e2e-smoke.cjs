const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
  console.error('API_BASE_URL is required. Example: API_BASE_URL=https://your-backend.up.railway.app npm run test:e2e');
  process.exit(1);
}

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const login = async (email, password, expectedRole) => {
  const { response, body } = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, expectedRole })
  });
  assert(response.ok, `Login failed for ${email}: ${body?.message || response.status}`);
  assert(body?.token, `Missing token for ${email}`);
  return body.token;
};

(async () => {
  console.log(`Running smoke test against ${BASE_URL}`);

  const { response: menuResponse, body: menu } = await request('/api/menu');
  assert(menuResponse.ok, 'Public menu endpoint failed');
  assert(Array.isArray(menu), 'Menu response must be an array');

  const { response: blockedOrders } = await request('/api/orders');
  assert(blockedOrders.status === 401, 'Admin orders endpoint must reject unauthenticated access');

  const adminToken = await login('admin@couplebowl.com', 'admin', 'admin');
  const userToken = await login('alex.t@email.com', 'user123', 'user');

  const { response: adminOrders, body: orders } = await request('/api/orders', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminOrders.ok, 'Admin orders endpoint failed with admin token');
  assert(Array.isArray(orders), 'Orders response must be an array');

  if (orders[0]?.order_number) {
    const { response: invoiceResponse, body: invoice } = await request(`/api/orders/number/${orders[0].order_number}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invoiceResponse.ok, 'Invoice endpoint failed with admin token');
    assert(Array.isArray(invoice.items), 'Invoice response must include items');
  }

  const { response: userOrders, body: profileOrders } = await request('/api/orders/user/alex.t%40email.com', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(userOrders.ok, 'User order history failed with user token');
  assert(Array.isArray(profileOrders), 'User order history must be an array');

  const { response: dashboard } = await request('/api/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(dashboard.ok, 'Admin dashboard endpoint failed');

  console.log('Smoke test passed.');
})().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
