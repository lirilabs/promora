import admin from "firebase-admin";

/* ======================================================
   FORCE NODE RUNTIME (VERCEL)
====================================================== */
export const config = {
  runtime: "nodejs",
};

/* ======================================================
   FIREBASE ADMIN — LAZY INIT (safe, no module-level throw)
====================================================== */
function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Missing Firebase Admin env variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Vercel stores \n as literal \\n — this restores real newlines
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

  // Pre-flight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    // Ensure Firebase is initialised (throws cleanly if env vars are missing)
    getFirebaseApp();

    const {
      token,
      title,
      body,
      imageUrl,
      clickAction,
      data = {},
    } = req.body || {};

    /* ---------- Validate required fields ---------- */
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "token, title, and body are required",
      });
    }

    /* ---------- Build FCM message ---------- */
    const message = {
      token,

      notification: {
        title,
        body,
        ...(imageUrl ? { image: imageUrl } : {}),
      },

      // All custom data values must be strings for FCM
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

    /* ---------- Send ---------- */
    const messageId = await admin.messaging().send(message);
    console.log("✅ FCM message sent:", messageId);

    return res.status(200).json({ success: true, messageId });

  } catch (err) {
    console.error("❌ FCM ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
