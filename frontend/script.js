const registerButton = document.getElementById('registerBtn');
const emailInput = document.getElementById('emailInput');
class ApiHelper {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(endpoint, data) {
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

  async put(endpoint, data) {
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

  async delete(endpoint) {
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
      throw new Error(
        `Error: ${response.status} ${response.statusText} - ${errorData.message}`
      );
    }
    return response.json();
  }

  handleError(error) {
    console.error('API call failed:', error);
  }
}

// Example usage
const api = new ApiHelper('https://jsonplaceholder.typicode.com');

// GET request example
api.get('/posts/1').then((data) => {
  console.log('GET response:', data);
  displayData(data);
});

// POST request example
const newPost = {
  title: 'foo',
  body: 'bar',
  userId: 1,
};
api.post('/posts', newPost).then((data) => {
  console.log('POST response:', data);
  displayData(data);
});

// PUT request example
const updatedPost = {
  id: 1,
  title: 'foo',
  body: 'bar',
  userId: 1,
};
api.put('/posts/1', updatedPost).then((data) => {
  console.log('PUT response:', data);
  displayData(data);
});

// DELETE request example
api.delete('/posts/1').then((data) => {
  console.log('DELETE response:', data);
  displayData(data);
});

// Function to display data on the page
function displayData(data) {
  const output = document.getElementById('output');
  output.innerHTML = JSON.stringify(data, null, 2);
}

function createCredential(userEmail) {
  try {
    const credential = navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    console.log(credential);
    window.alert('Logged in successfully ✔✔✔');
  } catch (e) {
    window.alert(e.message);
  }
}

registerButton.addEventListener('click', () => {
  let userEmail = emailInput.value;
  window.alert(`register button clicked. email: ${userEmail}`);
});
// createCredential();
