const https = require('https');

function gql(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
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
  const result = await gql(`{
    __schema {
      mutationType {
        fields {
          name
          type {
            name
            fields {
              name
              args {
                name
                type { name kind ofType { name kind ofType { name kind } } }
              }
            }
          }
        }
      }
    }
  }`);

  const fields = result.data.__schema.mutationType.fields;
  const ascKey = fields.find(f => f.name === 'appStoreConnectApiKey');
  console.log('appStoreConnectApiKey type:', ascKey.type.name);
  if (ascKey.type.fields) {
    for (const sub of ascKey.type.fields) {
      const args = sub.args.map(a => {
        const t = a.type;
        const typeName = t.name || t.ofType?.name || `${t.kind}(${t.ofType?.name})`;
        return `${a.name}: ${typeName}`;
      }).join(', ');
      console.log(`  .${sub.name}(${args})`);
    }
  }
}

main().catch(console.error);
