
interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
  token_uri: string;
}

// Helper to Base64Url encode (RFC 4648)
const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
};

const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

const importPrivateKey = async (pem: string): Promise<CryptoKey> => {
  // fetch the part of the PEM string between header and footer
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  // Clean up the key
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, ""); // Remove newlines and spaces

  // Base64 decode
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
};

export const getServiceAccountAccessToken = async (serviceAccountJsonStr: string): Promise<string> => {
  try {
    const creds: ServiceAccountCreds = JSON.parse(serviceAccountJsonStr);
    
    // 1. Create JWT Header
    const header = {
      alg: "RS256",
      typ: "JWT"
    };
    
    // 2. Create JWT Claim Set
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/chat.bot",
      aud: creds.token_uri,
      exp: now + 3600, // 1 hour
      iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
    
    // 3. Sign the JWT
    const privateKey = await importPrivateKey(creds.private_key);
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
    const signature = await window.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      str2ab(signatureInput)
    );
    
    const encodedSignature = arrayBufferToBase64Url(signature);
    const jwt = `${signatureInput}.${encodedSignature}`;

    // 4. Exchange JWT for Access Token
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const response = await fetch(creds.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Token exchange failed: ${err.error_description || err.error}`);
    }

    const data = await response.json();
    return data.access_token;

  } catch (error) {
    console.error("Failed to authenticate service account:", error);
    throw error;
  }
};
