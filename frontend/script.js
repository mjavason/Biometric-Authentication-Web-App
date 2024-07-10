const registerButton = document.getElementById('registerBtn');
const loginButton = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
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
    return response.json();
  }

  handleError(error) {
    window.alert(error.message);
    console.error('API call failed:', error);
  }
}
const api = new ApiHelper(
  // 'https://biometric-authentication-backend.onrender.com'
  'http://localhost:5000'
);

async function createCredential(registrationData) {
  try {
    const credentials = await navigator.credentials.create({
      publicKey: {
        challenge: Uint8Array.from(registrationData.challenge, (c) =>
          c.charCodeAt(0)
        ),
        rp: {
          name: 'Biometric Web App',
          id: 'biometric-authentication-web-app.onrender.com',
        },
        user: {
          id: Uint8Array.from(registrationData.user.id, (c) => c.charCodeAt(0)),
          name: registrationData.user.email,
          displayName: registrationData.user.email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256: ECDSA with SHA-256
          { alg: -257, type: 'public-key' }, // RS256: RSASSA-PKCS1-v1_5 with SHA-256
        ],
        authenticatorSelection: {
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      },
    });
    console.log(credentials);

    // decode the clientDataJSON into a utf-8 string
    const utf8Decoder = new TextDecoder('utf-8');
    const decodedClientData = utf8Decoder.decode(
      credentials.response.clientDataJSON
    );

    // parse the string as an object
    const clientDataObj = JSON.parse(decodedClientData);
    console.log(clientDataObj);

    const decodedAttestationObj = CBOR.decode(
      credentials.response.attestationObject
    );

    console.log(decodedAttestationObj);

    const { authData } = decodedAttestationObj;

    // get the length of the credential ID
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach((value, index) => dataView.setUint8(index, value));
    const credentialIdLength = dataView.getUint16(0);

    // get the credential ID
    const credentialId = authData.slice(55, 55 + credentialIdLength);

    // get the public key object
    const publicKeyBytes = authData.slice(55 + credentialIdLength);

    // the publicKeyBytes are encoded again as CBOR
    const publicKeyObject = CBOR.decode(publicKeyBytes.buffer);
    console.log(publicKeyObject);

    await api
      .post(`/set-credential`, {
        email: registrationData.user.email,
        credentials: { credentialId, publicKeyBytes },
      })
      .then((data) => {
        if (!data) return;
        window.alert(data.message);
      });

    // window.alert('Logged in successfully ✔✔✔');
  } catch (e) {
    window.alert(e.message);
  }
}

async function getCredential(email) {
  try {
    const userInfo = await api.get(`/get-credential/${email}`);
    if (!userInfo) return;
    console.log(userInfo);
    const { user, challenge } = userInfo.data;

    const publicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
      allowCredentials: [
        {
          id: Uint8Array.from(user.credentials.credentialId, (c) =>
            c.charCodeAt(0)
          ),
          // type: 'public-key',
          userVerification: 'required',
          // transports: ['usb', 'ble', 'nfc'],
        },
      ],
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
  } catch (e) {
    window.alert(e.message);
  }
}

registerButton.addEventListener('click', () => {
  let userEmail = emailInput.value;

  // POST request example
  api.post(`/register/${userEmail}`).then((data) => {
    console.log('POST response:', data);
    // window.alert(data.message);
    createCredential(data.data);
  });
});

loginButton.addEventListener('click', () => {
  let userEmail = emailInput.value;

  getCredential(userEmail);
});

// createCredential();
