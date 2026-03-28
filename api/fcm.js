import admin from "firebase-admin";

/* ======================================================
   FORCE NODE RUNTIME (VERCEL)
====================================================== */
export const config = {
  runtime: "nodejs",
};

/* ======================================================
   FIREBASE CREDENTIALS (hardcoded)
====================================================== */
const FIREBASE_PROJECT_ID   = "promora-9ab6e";
const FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@promora-9ab6e.iam.gserviceaccount.com";
const FIREBASE_PRIVATE_KEY  = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC78u2H3QEcNO+0
cKfXPoRU9gTtKdclZkTH8sA1WQj8wUydjPIcZepAmU/axxWaL8740WQm6kys7W3H
L+G3lRWTmXpSK/ilcrAXEI5kJCn999KVRETXiI4dGuUjWVjFmg3RRc9eH76ZxKY8
87pezynBIj8TyJhmEET0q3jq8liJiKJjun2uKqNve0RqhBLOcEyEq2GtDENVqQah
J+zQ03D0oECzi4i+UMsOQy9SmZ2FSYF3Uj/X2L39zAiZrjbw+aAnbKha0eE9OoVh
DOwstJE3+c3kBp9iArzYvwXY2gaCA7Fp8aLelZqNPoSkGRWpfsDRkHhXUagurIk0
1ty1+KUHAgMBAAECggEADWvjmnglxCXjmDcTRUOpn4eSAn2iZ4FOGBk1sJmTErmb
BwUxpOWCPOq10SG2YTRYy1vokv7YSuEJndfFfp6e09N58LRDJU1zVbJQ+MW8We6A
kzg00k9mFp39DvEqbbH6mp8pl8ccjU6FsISXIn4YtToE1xzUBTXUNsSn9d8og2mn
A45cJSBVmkendoKPktbpdcVknsdDC1GgYcsCjO5qq1pUPTJtc9r1d/Ikr1ZVKq9L
ohoPb1YzJ5xGfELQMQKeyv2uRQ8bhrEk2tGUGYt64LARHHHp/aX6Cdci2e62TvK8
1/HHCv5yVOgwZyrKddZvWxH88FqdGcsENG1jrEJywQKBgQDsx087k+nLqM84vt47
R9et5pWFihkMN2FOXpOgR1vp9cl4e3KcofD0kvHahA78slYopndmSjgVTCUu98+L
vGYcBuQ0LEpcZX5lg3sQ6wMWP+MIq4+Yxsu2A8FjnAXNAujIekWwPWTxe1A4xjMi
Tdmq4H96NsLgfgDXkbm0oIQwjQKBgQDLNNmNLiNfupGxn7jDib4Ewug3zkeS3+Ju
HhKHnftE0e3/Yi44WS3g00xDqL4E+vdgncfy26amMCa8SIbnYs8KmmFwF+rS22r5
I6wsCwPyNTFdstRSVhMo+a97q3VAMEdWoPpVtJUEyLZuCQvu8pH8Cl/C7BHDgrcu
YrLQCN344wKBgQDbnCy39IPHOmYgmp9iWksH5zNNbX233/Gnj37bDPSKNkbMMatm
7aigH16krxF7fSj+gQ+DV1lXH43pVz0vvOj0G8wzO9Uoh5ZJLz7IvUDatRytIPqJ
1/B/fFI1QjP7JzSjJQ1X3kmu1BHe5q3spko5/AkgYIQ1VYkQZ//XMX4JzQKBgQDI
IW/VlMgwAs500qqkoicsB02vkJB7PdaCv0lemaAbgmnUqLx+sI33rAKjbDBhNU6n
sB15uQyjBi9QJln+zxi8B5nJTTTvoDv1zUVHRz4GsI7DCloEEVPjei1zLkVXB3Vr
AzYpbKWLRaYuLui619ohEZKIpflExZtlqr0TGHiNIwKBgDS+EDC9fQJE91mIaUHx
XZyfW9jE8NbuW5qNC0YjVfMZQyr4QaXpI02i6zxqGsb34HkhgPdgzlkMIXNDFOgV
pkrpLt6n3ZvNDUz5OcmqKQ6GfmXBufpdE0tdPS7wNcSQrWs8F/BbDNxe5qMPM2uF
sUsOMo8lSK8SDbP8xtnBbGYK
-----END PRIVATE KEY-----`;

/* ======================================================
   FIREBASE ADMIN — LAZY INIT
====================================================== */
function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey:  FIREBASE_PRIVATE_KEY,
    }),
  });

  console.log("🔥 Firebase Admin initialized:", FIREBASE_PROJECT_ID);
  return app;
}

/* ======================================================
   CORS HELPER
====================================================== */
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/* ======================================================
   API HANDLER
====================================================== */
export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    getFirebaseApp();

    const {
      token,
      title,
      body,
      imageUrl,
      clickAction,
      data = {},
    } = req.body || {};

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "token, title, and body are required",
      });
    }

    const message = {
      token,

      notification: {
        title,
        body,
        ...(imageUrl ? { image: imageUrl } : {}),
      },

      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        ...(clickAction ? { click_action: clickAction } : {}),
      },

      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
          ...(imageUrl ? { imageUrl } : {}),
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
            "mutable-content": 1,
          },
        },
        fcmOptions: {
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    console.log("✅ FCM message sent:", messageId);

    return res.status(200).json({ success: true, messageId });

  } catch (err) {
    console.error("❌ FCM ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
