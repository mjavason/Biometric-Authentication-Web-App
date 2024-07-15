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
          id: window.location.hostname, // Dynamically use the current hostname
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
    // console.log('Credentials:', credentials);

    // decode the clientDataJSON into a utf-8 string
    // const utf8Decoder = new TextDecoder('utf-8');
    // const decodedClientData = utf8Decoder.decode(
    //   credentials.response.clientDataJSON
    // );

    // parse the string as an object
    // const clientDataObj = JSON.parse(decodedClientData);
    // console.log('Client Data Object:', clientDataObj);

    const decodedAttestationObj = CBOR.decode(
      credentials.response.attestationObject
    );

    // console.log('Decoded Attestation Object:', decodedAttestationObj);

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
    // const publicKeyObject = CBOR.decode(publicKeyBytes.buffer);
    // console.log('Public Key Object:', publicKeyObject);

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
    console.error('Error creating credential:', e);
    window.alert(e.message);
  }
}

async function getCredential(email) {
  try {
    const userInfo = await api.get(`/get-credential/${email}`);
    if (!userInfo) return;

    const { user, challenge } = userInfo.data;
    const { credentialId } = user.credentials;
    // Convert the credentialId object to a Uint8Array
    const credentialIdArray = new Uint8Array(Object.values(credentialId));

    const publicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
      allowCredentials: [
        {
          id: credentialIdArray,
          type: 'public-key',
          // transports: ['usb', 'ble', 'nfc'],
        },
      ],
      timeout: 60000,
      userVerification: 'required',
    };

    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
    console.log('assertion', credential);

    // Encode the credential.
    const authenticatorData = base64url.encode(
      credential.response.authenticatorData
    );
    const clientDataJSON = base64url.encode(credential.response.clientDataJSON);
    const signature = base64url.encode(credential.response.signature);
    const userHandle = credential.response.userHandle
      ? base64url.encode(credential.response.userHandle)
      : undefined;

    try {
      console.log(
        'Authenticator data',
        CBOR.decode(credential.response.authenticatorData)
      );
      console.log('signature', CBOR.decode(credential.response.signature));
      console.log(
        'client data json',
        CBOR.decode(credential.response.clientDataJSON)
      );
    } catch (e) {
      console.log('unable to converte to cbor', e);
    }

    const decodedAssertion = {
      id: credential.id,
      rawId: base64url.encode(credential.rawId),
      type: credential.type,
      authenticatorData,
      clientDataJSON,
      signature,
      userHandle,
    };

    let login = await api.post('/login', {
      email: user.email,
      credential: decodedAssertion,
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
