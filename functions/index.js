const admin = require("firebase-admin");

const serviceAccount = require("./qonsoll-video-transcoder-firebase-adminsdk-ntmhf-b688febd35.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});