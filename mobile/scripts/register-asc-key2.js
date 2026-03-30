const https = require('https');
const fs = require('fs');

const p8 = fs.readFileSync('C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/AuthKey_2L2WCHL8TJ.p8', 'utf8');
const TOKEN = 'jUr8ISf7ZEhfA_IymIoTBhASpCmjpsNzjbMLNuoV';
const ACCOUNT_ID = '93279bfd-9b84-4b96-aae6-7e0f1a4528b9';

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
  console.log('Registering Apple API Key with EAS...');

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

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
