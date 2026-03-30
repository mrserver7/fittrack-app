/**
 * Full iOS credential setup via Apple App Store Connect API + EAS GraphQL API.
 * Steps:
 * 1. Generate a signing key + CSR with openssl
 * 2. Submit CSR to Apple → get Distribution Certificate
 * 3. Register bundle ID with Apple
 * 4. Create Ad Hoc Provisioning Profile
 * 5. Upload everything to EAS
 */

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

const KEY_ID = '2L2WCHL8TJ';
const ISSUER_ID = 'dab1489e-2e7c-40e6-93c1-91ecb80e9565';
const TEAM_ID = '5KVQN5UT25';
const BUNDLE_ID = 'com.fittrack.app';
const EXPO_TOKEN = 'jUr8ISf7ZEhfA_IymIoTBhASpCmjpsNzjbMLNuoV';
const ACCOUNT_ID = '3f2c8b8e-f926-412f-b704-89c129060985';
const APP_ID = 'f0bea90c-2366-4104-9bf0-de52abe427bd';
const WORK_DIR = 'C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/scripts/creds';
const P8_PATH = 'C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/AuthKey_2L2WCHL8TJ.p8';

// Ensure work dir exists
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

// ── JWT generation for Apple API ──────────────────────────────────────────────
function makeAppleJWT() {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1'
  })).toString('base64url');

  const p8 = fs.readFileSync(P8_PATH, 'utf8');
  const key = crypto.createPrivateKey(p8);
  const sign = crypto.createSign('SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign({ key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

// ── Apple API helper ──────────────────────────────────────────────────────────
function appleAPI(method, path, body) {
  return new Promise((resolve, reject) => {
    const jwt = makeAppleJWT();
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.appstoreconnect.apple.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Apple API ${method} ${path} → ${res.statusCode}: ${out}`));
        } else {
          resolve(out ? JSON.parse(out) : {});
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── EAS GraphQL helper ────────────────────────────────────────────────────────
function easGQL(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPO_TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => resolve(JSON.parse(out)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {

  // Step 1: Generate private key + CSR
  console.log('\n[1/6] Generating private key + CSR...');
  const keyPath = `${WORK_DIR}/dist.key`;
  const csrPath = `${WORK_DIR}/dist.csr`;
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'pipe' });
  execSync(
    `openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/CN=mrserver7/O=mrserver7/C=US"`,
    { stdio: 'pipe' }
  );
  const csrContent = fs.readFileSync(csrPath, 'utf8');
  const csrBase64 = csrContent
    .replace('-----BEGIN CERTIFICATE REQUEST-----', '')
    .replace('-----END CERTIFICATE REQUEST-----', '')
    .replace(/\s/g, '');
  console.log('  ✓ Key + CSR generated');

  // Step 2: Submit CSR to Apple → Distribution Certificate
  console.log('\n[2/6] Creating iOS Distribution Certificate with Apple...');
  let certId, certContent;
  try {
    const certResp = await appleAPI('POST', '/certificates', {
      data: {
        type: 'certificates',
        attributes: {
          csrContent: csrBase64,
          certificateType: 'IOS_DISTRIBUTION'
        }
      }
    });
    certId = certResp.data.id;
    certContent = certResp.data.attributes.certificateContent; // base64 DER
    console.log('  ✓ Certificate created:', certId);
  } catch (e) {
    // Might already exist — list and reuse
    console.log('  ! Could not create cert, trying to list existing...');
    const list = await appleAPI('GET', '/certificates?filter[certificateType]=IOS_DISTRIBUTION&limit=1');
    if (!list.data || list.data.length === 0) throw e;
    certId = list.data[0].id;
    certContent = list.data[0].attributes.certificateContent;
    console.log('  ✓ Reusing existing certificate:', certId);
  }

  // Save cert as DER then convert to PEM
  const certDerPath = `${WORK_DIR}/dist.cer`;
  const certPemPath = `${WORK_DIR}/dist.pem`;
  fs.writeFileSync(certDerPath, Buffer.from(certContent, 'base64'));
  execSync(`openssl x509 -in "${certDerPath}" -inform DER -out "${certPemPath}" -outform PEM`, { stdio: 'pipe' });

  // Create .p12 (certificate + private key, password: 'fittrack')
  const p12Path = `${WORK_DIR}/dist.p12`;
  const p12Password = 'fittrack123';
  execSync(
    `openssl pkcs12 -export -in "${certPemPath}" -inkey "${keyPath}" -out "${p12Path}" -passout pass:${p12Password} -legacy`,
    { stdio: 'pipe' }
  );
  const p12Base64 = fs.readFileSync(p12Path).toString('base64');
  console.log('  ✓ .p12 created');

  // Step 3: Register Bundle ID with Apple
  console.log('\n[3/6] Registering bundle identifier...');
  let bundleDbId;
  try {
    const bundleResp = await appleAPI('POST', '/bundleIds', {
      data: {
        type: 'bundleIds',
        attributes: {
          identifier: BUNDLE_ID,
          name: 'FitTrack',
          platform: 'IOS'
        }
      }
    });
    bundleDbId = bundleResp.data.id;
    console.log('  ✓ Bundle ID registered:', bundleDbId);
  } catch (e) {
    console.log('  ! Bundle ID might exist, listing...');
    const list = await appleAPI(`GET`, `/bundleIds?filter[identifier]=${BUNDLE_ID}&limit=1`);
    if (!list.data || list.data.length === 0) throw e;
    bundleDbId = list.data[0].id;
    console.log('  ✓ Reusing existing bundle ID:', bundleDbId);
  }

  // Step 4: Create Ad Hoc Provisioning Profile
  console.log('\n[4/6] Creating Ad Hoc provisioning profile...');
  const profileResp = await appleAPI('POST', '/profiles', {
    data: {
      type: 'profiles',
      attributes: { name: 'FitTrack AdHoc', profileType: 'IOS_APP_ADHOC' },
      relationships: {
        bundleId: { data: { type: 'bundleIds', id: bundleDbId } },
        certificates: { data: [{ type: 'certificates', id: certId }] },
        devices: { data: [] }
      }
    }
  });
  const profileBase64 = profileResp.data.attributes.profileContent;
  const profileId = profileResp.data.id;
  console.log('  ✓ Provisioning profile created:', profileId);

  // Step 5: Upload to EAS
  console.log('\n[5/6] Uploading credentials to EAS...');

  // Register Apple Team
  const teamResult = await easGQL(
    `mutation($accountId: ID!, $input: AppleTeamInput!) {
      appleTeam { createAppleTeam(accountId: $accountId, appleTeamInput: $input) { id appleTeamIdentifier } }
    }`,
    { accountId: ACCOUNT_ID, input: { appleTeamIdentifier: TEAM_ID, appleTeamName: 'mrserver7' } }
  );
  const appleTeamId = teamResult.data?.appleTeam?.createAppleTeam?.id ||
    (await easGQL(`{ account { byId(accountId: "${ACCOUNT_ID}") { appleTeams { id appleTeamIdentifier } } } }`, {}))
      .data?.account?.byId?.appleTeams?.find(t => t.appleTeamIdentifier === TEAM_ID)?.id;
  console.log('  ✓ Apple Team ID in EAS:', appleTeamId);

  // Upload Distribution Certificate
  const certResult = await easGQL(
    `mutation($accountId: ID!, $input: AppleDistributionCertificateInput!) {
      appleDistributionCertificate {
        createAppleDistributionCertificate(accountId: $accountId, appleDistributionCertificateInput: $input) {
          id
          serialNumber
        }
      }
    }`,
    {
      accountId: ACCOUNT_ID,
      input: {
        certP12: p12Base64,
        certPassword: p12Password,
        certPrivateSigningKey: fs.readFileSync(keyPath, 'utf8'),
        appleTeamId
      }
    }
  );
  console.log('  Cert upload result:', JSON.stringify(certResult.data || certResult.errors?.[0]?.message));
  const easCertId = certResult.data?.appleDistributionCertificate?.createAppleDistributionCertificate?.id;

  // Register App Identifier in EAS
  const appIdResult = await easGQL(
    `mutation($accountId: ID!, $input: AppleAppIdentifierInput!) {
      appleAppIdentifier {
        createAppleAppIdentifier(accountId: $accountId, appleAppIdentifierInput: $input) { id bundleIdentifier }
      }
    }`,
    { accountId: ACCOUNT_ID, input: { bundleIdentifier: BUNDLE_ID, appleTeamId } }
  );
  const easAppIdentifierId = appIdResult.data?.appleAppIdentifier?.createAppleAppIdentifier?.id;
  console.log('  App identifier in EAS:', easAppIdentifierId);

  // Upload Provisioning Profile
  const ppResult = await easGQL(
    `mutation($accountId: ID!, $input: AppleProvisioningProfileInput!) {
      appleProvisioningProfile {
        createAppleProvisioningProfile(accountId: $accountId, appleProvisioningProfileInput: $input) { id }
      }
    }`,
    {
      accountId: ACCOUNT_ID,
      input: {
        appleProvisioningProfile: profileBase64,
        appleTeamId,
        appleAppIdentifierId: easAppIdentifierId
      }
    }
  );
  console.log('  PP upload result:', JSON.stringify(ppResult.data || ppResult.errors?.[0]?.message));
  const easProfileId = ppResult.data?.appleProvisioningProfile?.createAppleProvisioningProfile?.id;

  // Link credentials to the app
  if (easCertId && easAppIdentifierId && easProfileId) {
    const linkResult = await easGQL(
      `mutation($appId: ID!, $input: IosAppBuildCredentialsInput!) {
        iosAppBuildCredentials {
          createIosAppBuildCredentials(appId: $appId, iosAppBuildCredentialsInput: $input) { id }
        }
      }`,
      {
        appId: APP_ID,
        input: {
          distributionCertificateId: easCertId,
          provisioningProfileId: easProfileId,
          iosDistributionType: 'AD_HOC'
        }
      }
    );
    console.log('  Link result:', JSON.stringify(linkResult.data || linkResult.errors?.[0]?.message));
  }

  console.log('\n[6/6] Done! Run the build now.');
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
