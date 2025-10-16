// lambdas/shared/tokens.js
const jwt = require("jsonwebtoken");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

async function getUuidV4() {
  const { v4: uuidv4 } = await import("uuid");
  return uuidv4();
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const { SESSIONS_TABLE, JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

function json(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

JWT_AUD = "kickflip-mobile";
JWT_ISS = "https://api.kickflip.co";
ACCESS_TTL = "7d";
REFRESH_TTL = "30d";
const allowedAud = JWT_AUD.split(",").map(s => s.trim()).filter(Boolean);

exports.issueSession = async ({
  userId,
  email,
  provider,
  device_type,
  device_token,
  roles = [],
  name,
  aud
}) => {
  if (!SESSIONS_TABLE || !JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error("Missing env: SESSIONS_TABLE/JWT_SECRET/JWT_REFRESH_SECRET");
    throw new Error("Server misconfiguration");
  }

  const audience = aud && allowedAud.includes(aud) ? aud : allowedAud[0];
  const now = new Date().toISOString();

  const access_token = jwt.sign(
    {
      ...baseClaims({ user_id: userId, email, roles, name }),
      token_use: "access",
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      issuer: JWT_ISS,
      audience,
      subject: userId,
      expiresIn: ACCESS_TTL,
      notBefore: "0s",
      jwtid: await getUuidV4(),
      header: { kid: "hmac-v1" },
    }
  );

  const session_id = crypto.randomUUID();
  const refresh_token = jwt.sign(
    { sub: userId, sid: session_id, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: "30d", issuer: "kickflip-auth", algorithm: "HS256" }
  );

  jwt.sign(
    { user_id: userId, email, roles, token_use: "refresh" },
    JWT_REFRESH_SECRET,
    {
      algorithm: "HS256",
      issuer: JWT_ISS,
      audience,
      subject: userId,
      expiresIn: REFRESH_TTL,
      notBefore: "0s",
      jwtid: await getUuidV4(),
      header: { kid: "hmac-v1" },
    }
  );

  const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  await ddb.send(
    new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: { session_id },
      UpdateExpression:
        "SET user_id=:uid, device_type=:dt, device_id=:tk, created_at=:ls, #ttl=:ttl",
      ExpressionAttributeNames: { "#ttl": "ttl" },
      ExpressionAttributeValues: {
        ":uid": userId,
        ":dt": device_type || "ios",
        ":tk": device_token || null,
        ":ls": now,
        ":ttl": ttl,
      },
    })
  );

  return { access_token, refresh_token };
};

function baseClaims({ user_id, email, roles = [], name }) {
  return {
    user_id,
    email,
    roles,
    name: name || undefined,
  };
}
