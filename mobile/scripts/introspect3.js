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
  // Get the return type of each namespaced mutation to find sub-mutations
  const result = await gql(`{
    __schema {
      mutationType {
        fields {
          name
          type {
            name
            kind
            fields {
              name
              args { name type { name kind ofType { name kind } } }
            }
          }
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
    console.log(`\n=== ${f.name} (type: ${f.type.name}) ===`);
    if (f.type.fields) {
      for (const sub of f.type.fields) {
        const args = sub.args.map(a => `${a.name}:${a.type.name || a.type.ofType?.name || a.type.kind}`).join(', ');
        console.log(`  .${sub.name}(${args})`);
      }
    }
  }
}

main().catch(console.error);
