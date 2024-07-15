import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import base64url from 'base64url';
import crypto from 'crypto';

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
var users: { email: string; id: string; credentials?: any }[] = [];
//#endregion

//#region code here
function generateRandomNumbers(count: number, min: number, max: number) {
  let randomNumbers: string = '';
  for (let i = 0; i < count; i++) {
    const randomNumber = (
      Math.floor(Math.random() * (max - min + 1)) + min
    ).toString();
    randomNumbers = randomNumbers.concat(randomNumber);
  }

  return randomNumbers;
}

function verify(
  authenticatorDataBase64: any,
  clientDataJSONBase64: any,
  signatureBase64: any,
  publicKeyBytes: any
) {
  // Example input data
  const authenticatorData = Buffer.from(authenticatorDataBase64, 'base64');
  const clientDataJSON = Buffer.from(clientDataJSONBase64, 'base64');
  const signature = Buffer.from(signatureBase64, 'base64');

  // Example public key in PEM format
  //   const publicKeyPem = `-----BEGIN PUBLIC KEY-----
  // YOUR_PUBLIC_KEY_HERE
  // -----END PUBLIC KEY-----`;

  // Convert clientDataJSON to SHA-256 hash
  const clientDataHash = crypto
    .createHash('sha256')
    .update(clientDataJSON)
    .digest();

  // Concatenate authenticatorData and clientDataHash
  const signedData = Buffer.concat([authenticatorData, clientDataHash]);

  // Verify the signature using the public key
  const verify = crypto.createVerify('SHA256');
  verify.update(signedData);
  verify.end();

  return verify.verify(publicKeyBytes, signature);

  // console.log('Signature is valid:', signatureIsValid);
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

  // if (existingUser) {
  //   return res
  //     .status(403)
  //     .send({ success: false, message: 'User email already exists' });
  // }

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
  console.log('req.body', req.body);
  const { credentials, email } = req.body;

  if (!email || !credentials)
    return res
      .status(403)
      .send({ successful: false, message: 'email or credentials is missing' });

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (users[i].credentials)
        return res.status(403).send({
          successful: false,
          message: 'Registration already complete. Try logging in',
        });

      users[i].credentials = credentials;
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

app.get('/get-credential/:email', async (req: Request, res: Response) => {
  let email = req.params.email;
  let challenge = generateRandomNumbers(9, 0, 9);

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (!users[i].credentials) {
        users.splice(i);
        break;
      }
      return res.send({
        success: true,
        message: 'User credentials retrieved successfully',
        data: { user: users[i], challenge },
      });
    }
  }

  return res
    .status(404)
    .send({ success: false, message: 'User does not exist. Please register' });
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, credential } = req.body;
  let existingUser;

  console.log('req.body', req.body);

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      existingUser = users[i];
      break;
    }
  }

  //perform the webauthn check here
  if (existingUser) {
    const { credentialId, publicKeyBytes } = existingUser.credentials;

    const {
      id,
      rawId,
      authenticatorData,
      clientDataJSON,
      signature,
      userHandle,
      type,
    } = credential;

    const clientDataJSONDecoded = base64url.decode(clientDataJSON);
    // const clientDataJSONParsed = JSON.parse(clientDataJSONDecoded);

    const verified = verify(
      authenticatorData,
      clientDataJSON,
      signature,
      publicKeyBytes
    );
    // const verified = true;

    if (verified) {
      return res.send({
        success: true,
        message: 'Logged in successfully',
        data: existingUser,
      });
      // return 'Hooray! User is authenticated! 🎉';
    } else {
      return res.status(403).send({
        success: false,
        message: 'Authentication failed',
        data: existingUser,
      });
      // return 'Verification failed. 😭';
      //   throw new Error('User verification failed.');
    }
  }

  return res
    .status(404)
    .send({ success: false, message: 'User email does not exist' });
});

app.get('/users', async (req: Request, res: Response) => {
  res.send({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
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
  console.log(`${'\x1b[31m'}${err.message} ${'\x1b][0m]'}`);
  console.log(err);
  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});
//#endregion
