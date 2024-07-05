import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

//#region app setup
const app = express();
app.use(express.json()); // Middleware to parse JSON or URL-encoded data
app.use(express.urlencoded({ extended: true })); // For complex form data
app.use(cors());
dotenv.config({ path: './.env' });
//#endregion

//#region keys and configs
const PORT = process.env.PORT || 3000;
const baseURL = 'https://httpbin.org';
var database: { users: [{ email: string; id: string; key: any }] } | any = {
  users: [],
};
//#endregion

//#region code here
function generateRandomNumbers(count: number, min: number, max: number) {
  const randomNumbers = [];
  for (let i = 0; i < count; i++) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    randomNumbers.push(randomNumber);
  }
  return randomNumbers;
}

function generatePublicKeyCredentials(user: {
  id: string;
  name: string;
  displayName: string;
}) {
  return {
    challenge: generateRandomNumbers(32, 0, 9), // Should be replaced with a real challenge from your server
    rp: {
      name: 'Biometric Web App',
      id: 'biometric-authentication-web-app.onrender.com',
    },
    user,
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    authenticatorSelection: {
      // authenticatorAttachment: 'platform',
      userVerification: 'preferred',
    },
    timeout: 60000,
    attestation: 'direct',
  };
}

// default message
app.post('/register/:email', async (req: Request, res: Response) => {
  const user = {
    email: req.params.email,
    id: generateRandomNumbers(9, 0, 9).toString(),
  };
  database.users.push(user);

  return res.send({
    message: 'User registered successfully',
    data: {
      user,
      publicKeyCredentials: generatePublicKeyCredentials({
        id: user.id,
        name: user.email,
        displayName: user.email,
      }),
    },
  });
});
//#endregion code here

//#region Server setup
async function pingSelf() {
  try {
    const { data } = await axios.get(`http://localhost:5000`);

    console.log(`Server pinged successfully: ${data.message}`);
    return true;
  } catch (e: any) {
    console.log(`this the error message: ${e.message}`);
    return;
  }
}

// default message
app.get('/api', async (req: Request, res: Response) => {
  const result = await axios.get(baseURL);
  console.log(result.status);
  return res.send({
    message: 'Demo API called (httpbin.org)',
    data: result.status,
  });
});

//default message
app.get('/', (req: Request, res: Response) => {
  return res.send({ message: 'API is Live!' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf, 600000);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');

  console.log(`${'\x1b[31m'}${err.message}${'\x1b][0m]'}`);
  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});
//#endregion
