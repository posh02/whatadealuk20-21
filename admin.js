const loginPanel = document.getElementById('login-panel');
const feedPanel = document.getElementById('feed-panel');
const loginForm = document.getElementById('login-form');
const feedForm = document.getElementById('feed-form');
const loginStatus = document.getElementById('login-status');
const feedStatus = document.getElementById('feed-status');
const feedSummary = document.getElementById('feed-summary');
const logoutButton = document.getElementById('logout-button');

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === 'string' ? payload : payload?.error || 'Request failed');
  }

  return payload;
}

async function checkSession() {
  try {
    const payload = await apiRequest('/api/admin/session');
    if (payload.authenticated) {
      loginPanel.hidden = true;
      feedPanel.hidden = false;
      feedSummary.textContent = `Signed in as ${payload.user}.`;
    }
  } catch (error) {
    console.warn('No active admin session', error);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  loginStatus.textContent = 'Signing in...';
  loginStatus.dataset.state = 'pending';

  try {
    const payload = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    loginStatus.dataset.state = 'success';
    loginStatus.textContent = `Signed in as ${payload.user}.`;
    loginPanel.hidden = true;
    feedPanel.hidden = false;
    feedSummary.textContent = `Signed in as ${payload.user}.`;
  } catch (error) {
    loginStatus.dataset.state = 'error';
    loginStatus.textContent = error.message;
  }
});

feedForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('feed-file');
  const file = fileInput.files[0];

  if (!file) {
    feedStatus.dataset.state = 'error';
    feedStatus.textContent = 'Choose a CSV file first.';
    return;
  }

  feedStatus.textContent = 'Uploading and validating CSV...';
  feedStatus.dataset.state = 'pending';

  try {
    const formData = new FormData();
    formData.append('feed', file);

    const payload = await apiRequest('/api/admin/feed', {
      method: 'POST',
      body: formData
    });

    feedStatus.dataset.state = 'success';
    feedStatus.textContent = payload.message;
    feedSummary.textContent = `Updated feed: ${payload.count} published items.`;
    feedForm.reset();
  } catch (error) {
    feedStatus.dataset.state = 'error';
    feedStatus.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await apiRequest('/api/admin/logout', { method: 'POST' });
    loginPanel.hidden = false;
    feedPanel.hidden = true;
    loginStatus.textContent = '';
    feedStatus.textContent = '';
  } catch (error) {
    console.error('Logout failed', error);
  }
});

checkSession();
