import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';

//#region app setup
const app = express();
app.use(express.json()); // Middleware to parse JSON or URL-encoded data
app.use(express.urlencoded({ extended: true })); // For complex form data
app.use(cors());
app.use(morgan('dev')); // Options include: 'combined', 'common', 'dev', 'tiny', 'combined' logs more details
dotenv.config({ path: './.env' });
//#endregion

//#region keys and configs
const PORT = process.env.PORT || 3000;
const baseURL = 'https://httpbin.org';
var users: [{ email: string; id: string; key?: any }] | any = [];
//#endregion

//#region code here
function generateRandomNumbers(count: number, min: number, max: number) {
  let randomNumbers = [];
  for (let i = 0; i < count; i++) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    randomNumbers.push(randomNumber);
  }

  return randomNumbers.toString();
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

app.post('/register/:email', async (req: Request, res: Response) => {
  const user = {
    email: req.params.email,
    id: generateRandomNumbers(9, 0, 9),
  };
  let existingUser;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == user.email) {
      existingUser = users[i];
      break;
    }
  }

  if (existingUser) {
    return res
      .status(403)
      .send({ success: false, message: 'User email already exists' });
  }

  users.push(user);
  console.log(users);

  return res.send({
    message: 'User registered successfully',
    data: {
      user,
      challenge: generateRandomNumbers(9, 0, 9),
    },
  });
});

app.post('/set-credential', async (req: Request, res: Response) => {
  const email = req.body.email;
  const credentials = req.body.credentials;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (users[i].key)
        return res.status(403).send({
          successful: false,
          message: 'Registration already complete. Try logging in',
        });

      users[i].key = credentials;
      return res.send({
        successful: true,
        message: 'Registration complete. Now try logging in',
      });
    }
  }

  return res
    .status(404)
    .send({ success: false, message: 'User email does not exist' });
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, credentials } = req.body;
  let existingUser;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      existingUser = users[i];
      break;
    }
  }

  if (existingUser) {
    //perform the webauthn check here
    return res.send({ message: 'Successful', data: existingUser });
  }
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
