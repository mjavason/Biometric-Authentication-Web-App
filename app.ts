import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import SimpleWebAuthnServer, {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';

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
var users: {
  email: string;
  id: string;
  registrationOptions: PublicKeyCredentialCreationOptionsJSON;
  credentials?: any;
  registrationResponse?: SimpleWebAuthnServer.VerifiedRegistrationResponse;
  currentAuthenticationOptions?: any;
  credentialPublicKey: Buffer;
}[] = [];
/**
 * Human-readable title for your website
 */
const rpName = 'SimpleWebAuthn Example';
/**
 * A unique identifier for your website. 'localhost' is okay for
 * local dev
 */
const rpID = 'biometric-authentication-web-app.onrender.com';
/**
 * The URL at which registrations and authentications should occur.
 * 'http://localhost' and 'http://localhost:PORT' are also valid.
 * Do NOT include any trailing /
 */
const origin = `https://${rpID}`;
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

//collect the users details and use it to generate a public key that will be used to get the main keys.
app.post('/register/:email', async (req: Request, res: Response) => {
  const user: any = {
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

  const options: PublicKeyCredentialCreationOptionsJSON =
    await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: 'none',
      // Prevent users from re-registering existing authenticators
      // excludeCredentials: userPasskeys.map((passkey) => ({
      //   id: passkey.id,
      //   // Optional
      //   transports: passkey.transports,
      // })),
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: 'preferred',
        userVerification: 'preferred',
        // Optional
        authenticatorAttachment: 'platform',
      },
    });

  user.registrationOptions = options;
  users.push(user);
  // console.log(users);

  return res.send({
    message: 'User registered successfully',
    data: {
      user,
      options,
    },
  });
});

//When the webauthn credentials are retrieved, store it in the users profile.
app.post('/set-credential', async (req: Request, res: Response) => {
  // console.log('req.body', req.body);
  const { credentials, email } = req.body;

  if (!email || !credentials)
    return res
      .status(403)
      .send({ successful: false, message: 'email or credentials is missing' });

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (users[i].credentials) {
        return res.status(403).send({
          successful: false,
          message: 'Registration already complete. Try logging in',
        });
      }

      let verification = await verifyRegistrationResponse({
        response: credentials,
        expectedChallenge: users[i].registrationOptions.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
      users[i].credentials = credentials;

      const encoder = new TextEncoder();
      users[i].credentialPublicKey = Buffer.from(
        credentials.response.publicKey,
        'utf-8'
      );

      users[i].registrationResponse = verification;
      return res.send({
        successful: true,
        message: 'Registration complete. Now try logging in',
        verification,
      });
    }
  }

  return res
    .status(404)
    .send({ success: false, message: 'User email does not exist' });
});

// before the user logs in the same public key credentials need to be generated
app.get('/get-credential/:email', async (req: Request, res: Response) => {
  let email = req.params.email;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (!users[i].credentials) {
        users.splice(i);
        break;
      }
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: [
          {
            id: users[i].credentials.id,
            transports: users[i].credentials.response.transports,
          },
        ],
      });

      users[i].currentAuthenticationOptions = options;

      return res.send({
        success: true,
        message: 'User credentials retrieved successfully',
        data: { user: users[i], options },
      });
    }
  }

  return res
    .status(404)
    .send({ success: false, message: 'User does not exist. Please register' });
});

//once the user has input their webauthn credentials, we can then verify it against what is stored.
app.post('/login', async (req: Request, res: Response) => {
  const { email, credentials } = req.body;
  let existingUser;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      existingUser = users[i];
      break;
    }
  }

  //perform the webauthn check here
  if (existingUser) {
    // const publicKeyBuffer = Buffer.from(
    //   existingUser.credentials.response.publicKey,
    //   'utf-8'
    // );
    // console.log(publicKeyBuffer.buffer);

    // console.log('public key', existingUser.credentials.response.publicKey);

    let verification = await verifyAuthenticationResponse({
      response: credentials,
      expectedChallenge: existingUser.currentAuthenticationOptions.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: existingUser.credentials.id,
        credentialPublicKey: new Uint8Array(
          existingUser.credentialPublicKey.buffer
        ), //new Uint8Array(existingUser.credentials.response.publicKey),
        counter: 0, //passkey.counter,
        transports: existingUser.credentials.response.transports,
      },
    });

    if (verification) {
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
