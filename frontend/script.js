const registerButton = document.getElementById('registerBtn');
const loginButton = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;
class ApiHelper {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint = '') {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(endpoint = '', data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async put(endpoint = '', data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(endpoint = '') {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
      });
      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error', errorData);
      throw new Error(
        `Error: ${response.status} ${response.statusText} - ${errorData.message}`
      );
    }
    const data = await response.json();
    console.log('Successful API response:', data);
    return data;
  }

  handleError(error) {
    window.alert(error.message);
    console.error('API call failed:', error);
  }
}
const api = new ApiHelper(
  'https://biometric-authentication-backend.onrender.com'
  // 'http://localhost:5000'
);

async function createCredential(registrationData) {
  try {
    // Pass the options to the authenticator and wait for a response
    const credentials = await startRegistration(await registrationData.options);

    await api
      .post(`/set-credential`, {
        email: registrationData.user.email,
        credentials,
      })
      .then((data) => {
        if (!data) return;
        window.alert(data.message);
        // console.log(data)
      });
  } catch (e) {
    console.error('Error creating credential:', e);
    window.alert(e.message);
  }
}

async function getCredential(email) {
  try {
    const userInfo = await api.get(`/get-credential/${email}`);
    if (!userInfo) return;

    const credentials = await startAuthentication(userInfo.data.options);
    console.log('assertion', credentials);

    let login = await api.post('/login', {
      email,
      credentials,
    });
    if (!login) return;

    window.alert(login.message);
  } catch (e) {
    console.error('Error getting credential:', e);
    window.alert(e.message);
  }
}

registerButton.addEventListener('click', () => {
  let userEmail = emailInput.value;

  // POST request example
  api.post(`/register/${userEmail}`).then((data) => {
    // window.alert(data.message);
    createCredential(data.data);
  });
});

loginButton.addEventListener('click', () => {
  let userEmail = emailInput.value;

  getCredential(userEmail);
});
// createCredential();
