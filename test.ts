import base64url from 'base64url';
function stringToBuffer(str: string) {
  return Buffer.from(str, 'utf-8');
}
const publicKey =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoCtnzPvQ3_SoZ-gofvI1nMM8bY6JznGzi4HFRa_vFa1q5Kycssn-UCxIwr_2XjC4yhkMKA8TtSOBJgRR4N6p6PTFPlvC7YrJaEO8PpfzCexYG8lhRveSD-QyKfkDxVuBesoVHHMnaJv7tKnbb8uf2CRlzU8IyS9he_4U4AEVxxiI9PMnXyQPwWKHyPwA_oyYhHHwpO8syNFMMFHcsQnVbD2WcLqEnLle_8C1c03TBJAu86z-gViVxYBoxxvcAYBcm-q0g1_wXv6ukhfIVbFcIPbl6M89vd3R-FIrHTOcHocIB3OM_cjPFyxguwM1XZkCf6iAO1wZ51LdogHL9FvORQIDAQAB';

const publicKeyBuffer = stringToBuffer(base64url.decode(publicKey));
console.log(new Uint8Array(publicKeyBuffer));
