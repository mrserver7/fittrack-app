const https = require('https');

const body = JSON.stringify({
  query: `{ __schema { mutationType { fields { name } } } }`
});

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
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const fields = parsed.data.__schema.mutationType.fields.map(f => f.name);
    const relevant = fields.filter(f =>
      f.toLowerCase().includes('apple') ||
      f.toLowerCase().includes('credential') ||
      f.toLowerCase().includes('ios') ||
      f.toLowerCase().includes('cert') ||
      f.toLowerCase().includes('provision')
    );
    console.log(relevant.join('\n'));
  });
});
req.on('error', (e) => console.error(e));
req.write(body);
req.end();
