import base64url from 'base64url';
import forge from 'node-forge';

function publicKeyBytesConverter(publicKeyBytes: object): string {
  // Convert the publicKeyBytes object to a Buffer
  const publicKeyBuffer = Buffer.from(Object.values(publicKeyBytes));

  // Base64 encode the buffer
  const base64PublicKey = base64url.encode(publicKeyBuffer);

  // PEM format the key
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${base64PublicKey
    .match(/.{1,64}/g)!
    .join('\n')}\n-----END PUBLIC KEY-----`;

  console.log(publicKeyPem);
  return publicKeyPem;
}

function verify(publicKeyBytes: any) {
  const publicKeyPem = publicKeyBytesConverter(publicKeyBytes);
  return forge.pki.publicKeyFromPem(publicKeyPem);
}

const publicKeyBytes = {
  '0': 164,
  '1': 1,
  '2': 3,
  '3': 3,
  '4': 57,
  '5': 1,
  '6': 0,
  '7': 32,
  '8': 89,
  '9': 1,
  '10': 0,
  '11': 147,
  '12': 49,
  '13': 111,
  '14': 18,
  '15': 184,
  '16': 72,
  '17': 239,
  '18': 53,
  '19': 46,
  '20': 6,
  '21': 216,
  '22': 50,
  '23': 103,
  '24': 231,
  '25': 230,
  '26': 125,
  '27': 143,
  '28': 49,
  '29': 25,
  '30': 201,
  '31': 71,
  '32': 14,
  '33': 178,
  '34': 12,
  '35': 79,
  '36': 166,
  '37': 245,
  '38': 244,
  '39': 95,
  '40': 232,
  '41': 42,
  '42': 67,
  '43': 35,
  '44': 141,
  '45': 146,
  '46': 0,
  '47': 251,
  '48': 136,
  '49': 178,
  '50': 187,
  '51': 24,
  '52': 226,
  '53': 205,
  '54': 48,
  '55': 64,
  '56': 26,
  '57': 37,
  '58': 33,
  '59': 135,
  '60': 163,
  '61': 44,
  '62': 178,
  '63': 156,
  '64': 146,
  '65': 228,
  '66': 247,
  '67': 68,
  '68': 98,
  '69': 179,
  '70': 195,
  '71': 37,
  '72': 112,
  '73': 65,
  '74': 148,
  '75': 97,
  '76': 59,
  '77': 182,
  '78': 16,
  '79': 126,
  '80': 228,
  '81': 149,
  '82': 164,
  '83': 236,
  '84': 161,
  '85': 235,
  '86': 216,
  '87': 227,
  '88': 159,
  '89': 49,
  '90': 248,
  '91': 146,
  '92': 179,
  '93': 245,
  '94': 18,
  '95': 185,
  '96': 219,
  '97': 45,
  '98': 136,
  '99': 242,
  '100': 48,
  '101': 91,
  '102': 122,
  '103': 87,
  '104': 59,
  '105': 1,
  '106': 64,
  '107': 251,
  '108': 193,
  '109': 244,
  '110': 207,
  '111': 114,
  '112': 56,
  '113': 249,
  '114': 237,
  '115': 224,
  '116': 105,
  '117': 166,
  '118': 234,
  '119': 143,
  '120': 71,
  '121': 38,
  '122': 218,
  '123': 141,
  '124': 237,
  '125': 140,
  '126': 245,
  '127': 144,
  '128': 249,
  '129': 251,
  '130': 168,
  '131': 68,
  '132': 11,
  '133': 136,
  '134': 243,
  '135': 198,
  '136': 128,
  '137': 107,
  '138': 155,
  '139': 190,
  '140': 11,
  '141': 102,
  '142': 251,
  '143': 56,
  '144': 136,
  '145': 91,
  '146': 21,
  '147': 245,
  '148': 145,
  '149': 55,
  '150': 214,
  '151': 83,
  '152': 205,
  '153': 250,
  '154': 7,
  '155': 254,
  '156': 233,
  '157': 149,
  '158': 114,
  '159': 125,
  '160': 188,
  '161': 241,
  '162': 79,
  '163': 110,
  '164': 234,
  '165': 0,
  '166': 71,
  '167': 163,
  '168': 155,
  '169': 125,
  '170': 73,
  '171': 191,
  '172': 79,
  '173': 232,
  '174': 174,
  '175': 87,
  '176': 241,
  '177': 250,
  '178': 133,
  '179': 174,
  '180': 157,
  '181': 129,
  '182': 33,
  '183': 5,
  '184': 54,
  '185': 236,
  '186': 126,
  '187': 23,
  '188': 227,
  '189': 71,
  '190': 226,
  '191': 210,
  '192': 53,
  '193': 161,
  '194': 168,
  '195': 199,
  '196': 145,
  '197': 85,
  '198': 122,
  '199': 43,
  '200': 117,
  '201': 145,
  '202': 227,
  '203': 57,
  '204': 56,
  '205': 77,
  '206': 136,
  '207': 139,
  '208': 208,
  '209': 86,
  '210': 181,
  '211': 231,
  '212': 121,
  '213': 244,
  '214': 9,
  '215': 143,
  '216': 34,
  '217': 173,
  '218': 96,
  '219': 34,
  '220': 42,
  '221': 82,
  '222': 223,
  '223': 33,
  '224': 155,
  '225': 41,
  '226': 208,
  '227': 45,
  '228': 104,
  '229': 208,
  '230': 238,
  '231': 200,
  '232': 47,
  '233': 229,
  '234': 164,
  '235': 227,
  '236': 74,
  '237': 225,
  '238': 96,
  '239': 87,
  '240': 66,
  '241': 100,
  '242': 197,
  '243': 67,
  '244': 128,
  '245': 187,
  '246': 111,
  '247': 233,
  '248': 144,
  '249': 238,
  '250': 41,
  '251': 212,
  '252': 109,
  '253': 191,
  '254': 184,
  '255': 53,
  '256': 19,
  '257': 150,
  '258': 24,
  '259': 85,
  '260': 131,
  '261': 236,
  '262': 37,
  '263': 17,
  '264': 194,
  '265': 36,
  '266': 113,
  '267': 33,
  '268': 67,
  '269': 1,
  '270': 0,
  '271': 1,
};

console.log(verify(publicKeyBytes));
