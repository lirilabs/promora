import admin from "firebase-admin";

/* ======================================================
   🔒 Safe ENV Loader
====================================================== */
function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ENV: ${name}`);
  }
  return value;
}

/* ======================================================
   🔥 Firebase Admin Init (Safe)
====================================================== */
function initFirebase() {
  if (admin.apps.length) return;

  const projectId = getEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = getEnv("FIREBASE_PRIVATE_KEY");

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase initialized");
}

/* ======================================================
   🚀 API Handler
====================================================== */
export default async function handler(req, res) {
  /* ---------- CORS ---------- */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    /* ---------- INIT ---------- */
    initFirebase();

    /* ---------- BODY ---------- */
    const {
      token,
      title,
      body,
      imageUrl,
      clickAction,
      data = {},
    } = req.body || {};

    /* ---------- VALIDATION ---------- */
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "token, title and body are required",
      });
    }

    /* ---------- MESSAGE BUILD ---------- */
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
          sound: "default",
          channelId: "default",
          ...(imageUrl ? { imageUrl } : {}),
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
            mutableContent: true,
          },
        },
        fcmOptions: {
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      },
    };

    /* ---------- SEND ---------- */
    const messageId = await admin.messaging().send(message);

    /* ---------- RESPONSE ---------- */
    return res.status(200).json({
      success: true,
      messageId,
    });

  } catch (err) {
    /* ---------- ERROR HANDLING ---------- */
    console.error("❌ FCM ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
      hint:
        "Check Firebase ENV variables or private key formatting",
    });
  }
}
