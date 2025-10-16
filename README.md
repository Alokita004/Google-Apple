
tokens.js — Core logic for issuing JWT-based sessions and updating user session records in DynamoDB.

---

## 🚀 Features

- ✅ Generates **Access Tokens** and **Refresh Tokens**
- ✅ Uses **DynamoDB** to store active session records
- ✅ Supports multiple authentication providers (e.g., Google, Apple)
- ✅ Secure with `HS256` JWT algorithm and environment-based secrets
- ✅ Includes device-specific session tracking (`device_type`, `device_token`)
- ✅ UUID-based session and JWT IDs for traceability

---

## ⚙️ Environment Variables

Before running or deploying, make sure the following environment variables are set:

| Variable Name          | Description |
|-------------------------|-------------|
| `SESSIONS_TABLE`        | Name of the DynamoDB table to store session data |
| `JWT_SECRET`            | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET`    | Secret key for signing refresh tokens |
| `JWT_AUD` *(optional)*  | Comma-separated list of allowed JWT audiences (default: `kickflip-mobile`) |
| `JWT_ISS` *(optional)*  | JWT issuer string (default: `https://api.kickflip.co`) |

Example `.env` file:
```bash
SESSIONS_TABLE=UserSessions
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_AUD=kickflip-mobile
JWT_ISS=https://api.kickflip.co
