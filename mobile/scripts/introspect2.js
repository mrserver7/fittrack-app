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
  // Check subfields of relevant mutations
  const result = await gql(`{
    __schema {
      mutationType {
        fields {
          name
          args { name type { name kind ofType { name kind } } }
        }
      }
    }
  }`);

  const fields = result.data.__schema.mutationType.fields;
  const relevant = fields.filter(f =>
    f.name.toLowerCase().includes('apple') ||
    f.name.toLowerCase().includes('ios')
  );

  for (const f of relevant) {
    console.log(`\n=== ${f.name} ===`);
    for (const arg of f.args) {
      console.log(`  arg: ${arg.name} (${arg.type.name || arg.type.ofType?.name || arg.type.kind})`);
    }
  }
}

main().catch(console.error);
