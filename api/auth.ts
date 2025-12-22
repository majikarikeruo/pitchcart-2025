import type { VercelRequest } from "@vercel/node";

let admin: typeof import('firebase-admin') | null = null;

function getAdmin() {
  if (admin) return admin;
  try {
    // Lazy import to avoid bundling issues in client builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    admin = require('firebase-admin');
  } catch (e) {
    throw new Error('firebase-admin package is not installed. Install it to enable auth.');
  }
  if (admin!.apps.length === 0) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svcJson) {
      const creds = JSON.parse(svcJson);
      admin!.initializeApp({
        credential: admin!.credential.cert({
          projectId: creds.project_id,
          clientEmail: creds.client_email,
          privateKey: (creds.private_key || '').replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT) {
      admin!.initializeApp();
    } else {
      throw new Error('Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT or ADC env.');
    }
  }
  return admin!;
}

export type AuthContext = { uid: string; token: string; decoded: any };

export async function verifyRequest(req: VercelRequest): Promise<AuthContext> {
  const header = String(req.headers?.authorization || req.headers?.Authorization || '');
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error('missing_bearer');
  const token = m[1];
  const a = getAdmin();
  const decoded = await a.auth().verifyIdToken(token);
  return { uid: decoded.uid, token, decoded };
}

