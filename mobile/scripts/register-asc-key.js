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

  // Try all plausible mutation variants
  const mutations = [
    // Variant 1
    {
      query: `mutation($accountId: ID!, $input: AppStoreConnectApiKeyInput!) {
        appStoreConnectApiKey {
          createAppStoreConnectApiKey(accountId: $accountId, appStoreConnectApiKeyInput: $input) {
            id keyIdentifier
          }
        }
      }`,
      vars: { accountId: ACCOUNT_ID, input: { keyIdentifier: '2L2WCHL8TJ', issuerId: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565', keyP8: p8, name: 'EAS Build Key' } }
    },
    // Variant 2
    {
      query: `mutation($accountId: ID!, $input: AppStoreConnectApiKeyInput!) {
        appStoreConnectApiKey {
          createAppStoreConnectApiKey(accountId: $accountId, input: $input) {
            id keyIdentifier
          }
        }
      }`,
      vars: { accountId: ACCOUNT_ID, input: { keyIdentifier: '2L2WCHL8TJ', issuerId: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565', keyP8: p8, name: 'EAS Build Key' } }
    },
    // Variant 3 - flat mutation
    {
      query: `mutation($accountId: ID!, $keyIdentifier: String!, $issuerId: String!, $keyP8: String!, $name: String!) {
        appStoreConnectApiKey {
          createAppStoreConnectApiKey(accountId: $accountId, keyIdentifier: $keyIdentifier, issuerId: $issuerId, keyP8: $keyP8, name: $name) {
            id keyIdentifier
          }
        }
      }`,
      vars: { accountId: ACCOUNT_ID, keyIdentifier: '2L2WCHL8TJ', issuerId: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565', keyP8: p8, name: 'EAS Build Key' }
    },
  ];

  for (let i = 0; i < mutations.length; i++) {
    console.log(`\nTrying variant ${i + 1}...`);
    const result = await gql(mutations[i].query, mutations[i].vars);
    if (result.errors) {
      console.log('Error:', result.errors[0].message);
    } else {
      console.log('Success!', JSON.stringify(result.data, null, 2));
      return;
    }
  }
}

main().catch(console.error);
