const https = require('https');
const fs = require('fs');

const p8 = fs.readFileSync('C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/AuthKey_2L2WCHL8TJ.p8', 'utf8');

function gql(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jUr8ISf7ZEhfA_IymIoTBhASpCmjpsNzjbMLNuoV',
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
  // Try to create Apple API Key under the account
  const result = await gql(`
    mutation CreateAppleApiKey($accountId: ID!, $appleApiKeyInput: AppleApiKeyInput!) {
      appleApiKey {
        createAppleApiKey(accountId: $accountId, appleApiKeyInput: $appleApiKeyInput) {
          id
          keyIdentifier
        }
      }
    }
  `, {
    accountId: '93279bfd-9b84-4b96-aae6-7e0f1a4528b9',
    appleApiKeyInput: {
      keyIdentifier: '2L2WCHL8TJ',
      issuerId: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565',
      keyP8: p8,
      name: 'EAS Build Key'
    }
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
