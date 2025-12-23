import type { VercelRequest } from "@vercel/node";

import * as firebaseAdmin from 'firebase-admin';

function getAdmin() {
  console.log('[Auth] firebaseAdmin:', typeof firebaseAdmin);
  console.log('[Auth] firebaseAdmin.apps:', firebaseAdmin.apps);
  console.log('[Auth] firebaseAdmin.apps type:', typeof firebaseAdmin.apps);
  
  if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (svcJson) {
      // Use FIREBASE_SERVICE_ACCOUNT if provided (JSON format)
      const creds = JSON.parse(svcJson);
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: creds.project_id,
          clientEmail: creds.client_email,
          privateKey: (creds.private_key || '').replace(/\\n/g, '\n'),
        }),
      });
    } else if (projectId && clientEmail && privateKey) {
      // Use individual environment variables
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT) {
      firebaseAdmin.initializeApp();
    } else {
      throw new Error('Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT env.');
    }
  }
  return firebaseAdmin;
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

