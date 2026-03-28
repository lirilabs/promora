const admin = require("firebase-admin");

/* ======================================================
   FIREBASE CREDENTIALS
====================================================== */
const FIREBASE_PROJECT_ID   = "promora-9ab6e";
const FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@promora-9ab6e.iam.gserviceaccount.com";
const FIREBASE_PRIVATE_KEY  = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC78u2H3QEcNO+0\ncKfXPoRU9gTtKdclZkTH8sA1WQj8wUydjPIcZepAmU/axxWaL8740WQm6kys7W3H\nL+G3lRWTmXpSK/ilcrAXEI5kJCn999KVRETXiI4dGuUjWVjFmg3RRc9eH76ZxKY8\n87pezynBIj8TyJhmEET0q3jq8liJiKJjun2uKqNve0RqhBLOcEyEq2GtDENVqQah\nJ+zQ03D0oECzi4i+UMsOQy9SmZ2FSYF3Uj/X2L39zAiZrjbw+aAnbKha0eE9OoVh\nDOwstJE3+c3kBp9iArzYvwXY2gaCA7Fp8aLelZqNPoSkGRWpfsDRkHhXUagurIk0\n1ty1+KUHAgMBAAECggEADWvjmnglxCXjmDcTRUOpn4eSAn2iZ4FOGBk1sJmTErmb\nBwUxpOWCPOq10SG2YTRYy1vokv7YSuEJndfFfp6e09N58LRDJU1zVbJQ+MW8We6A\nkzg00k9mFp39DvEqbbH6mp8pl8ccjU6FsISXIn4YtToE1xzUBTXUNsSn9d8og2mn\nA45cJSBVmkendoKPktbpdcVknsdDC1GgYcsCjO5qq1pUPTJtc9r1d/Ikr1ZVKq9L\nohoPb1YzJ5xGfELQMQKeyv2uRQ8bhrEk2tGUGYt64LARHHHp/aX6Cdci2e62TvK8\n1/HHCv5yVOgwZyrKddZvWxH88FqdGcsENG1jrEJywQKBgQDsx087k+nLqM84vt47\nR9et5pWFihkMN2FOXpOgR1vp9cl4e3KcofD0kvHahA78slYopndmSjgVTCUu98+L\nvGYcBuQ0LEpcZX5lg3sQ6wMWP+MIq4+Yxsu2A8FjnAXNAujIekWwPWTxe1A4xjMi\nTdmq4H96NsLgfgDXkbm0oIQwjQKBgQDLNNmNLiNfupGxn7jDib4Ewug3zkeS3+Ju\nHhKHnftE0e3/Yi44WS3g00xDqL4E+vdgncfy26amMCa8SIbnYs8KmmFwF+rS22r5\nI6wsCwPyNTFdstRSVhMo+a97q3VAMEdWoPpVtJUEyLZuCQvu8pH8Cl/C7BHDgrcu\nYrLQCN344wKBgQDbnCy39IPHOmYgmp9iWksH5zNNbX233/Gnj37bDPSKNkbMMatm\n7aigH16krxF7fSj+gQ+DV1lXH43pVz0vvOj0G8wzO9Uoh5ZJLz7IvUDatRytIPqJ\n1/B/fFI1QjP7JzSjJQ1X3kmu1BHe5q3spko5/AkgYIQ1VYkQZ//XMX4JzQKBgQDI\nIW/VlMgwAs500qqkoicsB02vkJB7PdaCv0lemaAbgmnUqLx+sI33rAKjbDBhNU6n\nsB15uQyjBi9QJln+zxi8B5nJTTTvoDv1zUVHRz4GsI7DCloEEVPjei1zLkVXB3Vr\nAzYpbKWLRaYuLui619ohEZKIpflExZtlqr0TGHiNIwKBgDS+EDC9fQJE91mIaUHx\nXZyfW9jE8NbuW5qNC0YjVfMZQyr4QaXpI02i6zxqGsb34HkhgPdgzlkMIXNDFOgV\npkrpLt6n3ZvNDUz5OcmqKQ6GfmXBufpdE0tdPS7wNcSQrWs8F/BbDNxe5qMPM2uF\nsUsOMo8lSK8SDbP8xtnBbGYK\n-----END PRIVATE KEY-----\n";

/* ======================================================
   FIREBASE ADMIN — LAZY INIT
====================================================== */
function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey:  FIREBASE_PRIVATE_KEY,
    }),
  });
}

/* ======================================================
   CORS HELPER
====================================================== */
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/* ======================================================
   API HANDLER
   GET  ?token=X&title=Y&body=Z&imageUrl=...&clickAction=...
   POST { token, title, body, imageUrl, clickAction, data }
====================================================== */
module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let token, title, body, imageUrl, clickAction, data;

  if (req.method === "GET") {
    ({ token, title, body, imageUrl, clickAction } = req.query);
    data = {};

  } else if (req.method === "POST") {
    ({ token, title, body, imageUrl, clickAction, data = {} } = req.body || {});

  } else {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use GET or POST." });
  }

  if (!token || !title || !body) {
    return res.status(400).json({
      success: false,
      error: "Missing required params: token, title, body",
      usage: {
        GET:  "/api/follow_fcm?token=DEVICE_TOKEN&title=Hello&body=World",
        POST: "{ token, title, body, imageUrl?, clickAction?, data? }",
      },
    });
  }

  try {
    getFirebaseApp();

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
    console.log("✅ FCM sent:", messageId);

    return res.status(200).json({ success: true, messageId });

  } catch (err) {
    console.error("❌ FCM ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
