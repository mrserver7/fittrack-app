const https = require('https');
const fs = require('fs');

const p8 = fs.readFileSync('C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/AuthKey_2L2WCHL8TJ.p8', 'utf8');
const TOKEN = 'jUr8ISf7ZEhfA_IymIoTBhASpCmjpsNzjbMLNuoV';
const ACCOUNT_ID = '3f2c8b8e-f926-412f-b704-89c129060985'; // mrserver7 account

function gql(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Registering Apple App Store Connect API Key...');

  const result = await gql(
    `mutation($accountId: ID!, $input: AppStoreConnectApiKeyInput!) {
      appStoreConnectApiKey {
        createAppStoreConnectApiKey(accountId: $accountId, appStoreConnectApiKeyInput: $input) {
          id
          keyIdentifier
          issuerIdentifier
          name
        }
      }
    }`,
    {
      accountId: ACCOUNT_ID,
      input: {
        keyIdentifier: '2L2WCHL8TJ',
        issuerIdentifier: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565',
        keyP8: p8,
        name: 'EAS Build Key'
      }
    }
  );

  if (result.errors) {
    console.error('Error:', JSON.stringify(result.errors, null, 2));
    return;
  }

  const key = result.data.appStoreConnectApiKey.createAppStoreConnectApiKey;
  console.log('Apple API Key registered successfully!');
  console.log('Key ID:', key.keyIdentifier);
  console.log('EAS ID:', key.id);
}

main().catch(console.error);
