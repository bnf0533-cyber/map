# Emergency / Incident Map — מפרט פרויקט (יומיים)

## 0. מטרה

לבנות מערכת קטנה לדיווח ומעקב אחרי **incidents** על מפה.

משתמשים מחוברים רואים דיווחים באזור, מוסיפים דיווח חדש בלחיצה על המפה, מסננים לפי קטגוריה, ומעדכנים סטטוס. שינויים (יצירה / עדכון / מחיקה) מתעדכנים אצל כולם בזמן אמת דרך **Socket.IO**.

### מה לומדים כאן

| שכבה | נושאים |
| ---- | ------ |
| Backend | Express, MongoDB, Mongoose, Zod, JWT, bcrypt, Authorization, socket.io |
| Frontend | React, TypeScript, Vite, React Router, Zustand, socket.io-client |
| Map | Leaflet, react-leaflet — markers, popup, map click → coordinates, center / zoom, filter |
| Realtime | emit / on — עדכון מפה בלי רענון דף |

---

## 1. Stack וקישורים

### Backend (חובה)

- Express
- MongoDB + Mongoose
- Zod (validation)
- jsonwebtoken (JWT)
- bcrypt
- cors, dotenv, helmet
- socket.io (אותו `http.Server` של Express)

### Frontend (חובה)

- React + TypeScript + Vite
- React Router
- Zustand (auth state)
- Leaflet + react-leaflet
- socket.io-client

### Map — documentation (לקרוא לפני הקוד)

| נושא | קישור |
| ---- | ----- |
| Leaflet Quick Start | https://leafletjs.com/examples/quick-start/ |
| Leaflet Reference | https://leafletjs.com/reference.html |
| react-leaflet | https://react-leaflet.js.org/ |
| OSM Tiles — usage policy | https://operations.osmfoundation.org/policies/tiles/ |
| Geolocation (בונוס) | https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API |

### Socket.IO — documentation

| נושא | קישור |
| ---- | ----- |
| Socket.IO (server) | https://socket.io/docs/v4/server-installation/ |
| Socket.IO + Express | https://socket.io/docs/v4/server-api/ |
| socket.io-client | https://socket.io/docs/v4/client-api/ |

### מושגי מפה (קצרים)

- **latitude / longitude** — קואורדינטות של נקודה על כדור הארץ (`lat`, `lng`).
- **marker** — סימון דיווח על המפה.
- **popup / info window** — הצגת פרטי דיווח בלחיצה על marker.
- **map click** — לחיצה על המפה מחזירה `{ lat, lng }` לטופס יצירת דיווח.
- **center / zoom** — נקודת מרכז ו+רמת התקרבות בטעינת המפה.
- **tiles** — שכבת הרקע (OpenStreetMap). לשמור על הוגנות לפי מדיניות OSM.

---

## 2. ישויות

### 2.1 User

```json
{
  "id": "string",
  "email": "string",
  "passwordHash": "string — never return to client",
  "role": "user | admin",
  "createdAt": "datetime"
}
```

- סיסמה נשמרת רק כ-`passwordHash` (bcrypt).
- `role` ברירת מחדל: `user`. `admin` — בונוס / seed בלבד.

### 2.2 Incident

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "fire | flood | accident | medical | other",
  "status": "open | in_progress | closed",
  "location": { "lat": "number", "lng": "number" },
  "createdBy": "user id",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

- `status` ברירת מחדל ביצירה: `open`.
- `createdBy` נקבע מה-JWT — לא מה-body של הלקוח.

---

## 3. ארכיטקטורת Backend

מבנה מומלץ (ES Modules):

```text
src/
├── index.js              # createServer(app) + attach socket.io
├── db/
│   └── db.js
├── routes/
│   ├── auth.routes.js
│   └── incidents.routes.js
├── ctrls/
│   ├── auth.ctrl.js
│   └── incidents.ctrl.js
├── DAL/
│   ├── user.dal.js
│   └── incident.dal.js
├── models/
│   ├── user.model.js
│   └── incident.model.js
├── validations/services/
│   ├── auth.validation.js
│   └── incident.validation.js
└── utils/
    ├── authMiddleware.js
    ├── asyncWrapper.js
    ├── errorHandler.js
    ├── generateToken.js
    └── socket.js         # init io, getIO(), emit helpers
```

### כללים

1. אין business logic ב-routes — רק validation + קריאה ל-controller.
2. אין שאילתות DB ב-controllers — רק DAL.
3. כל קלט (body / params / query) עובר Zod.
4. אחרי שמירה מוצלחת ב-DB — ה-controller (או שכבת עזר) עושה **emit** ללקוחות. Socket.IO **לא** מחליף את ה-REST API.
5. תשובות אחידות:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "Error message" }
```

6. לא מחזירים `passwordHash`, tokens פנימיים, או שגיאות DB גולמיות.

---

## 4. API

### Authentication

Header בכל הנתיבים המוגנים:

```http
Authorization: Bearer <token>
```

| Method | Path | Auth | תיאור |
| ------ | ---- | ---- | ----- |
| POST | `/auth/register` | לא | Body: `{ email, password }` (password min 8). מחזיר `{ user, token }` |
| POST | `/auth/login` | לא | Body: `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | כן | המשתמש המחובר |

### Incidents

| Method | Path | Auth | תיאור |
| ------ | ---- | ---- | ----- |
| GET | `/incidents` | כן | רשימה. Query אופציונלי: `?category=fire` |
| GET | `/incidents/:id` | כן | דיווח בודד |
| POST | `/incidents` | כן | יצירה. Body: `title`, `description`, `category`, `location: { lat, lng }`. `createdBy` מה-JWT. `status` = `open` |
| PATCH | `/incidents/:id` | כן | עדכון `title` / `description` / `category` / `status` / `location` — **owner בלבד** (או `admin`) |
| DELETE | `/incidents/:id` | כן | מחיקה — **owner בלבד** (או `admin`) |

### Authorization

- משתמש מחובר יכול לקרוא את כל ה-incidents וליצור חדשים.
- עדכון / מחיקה: רק אם `incident.createdBy === req.user.id`, או `role === "admin"`.
- אחרת → **403 Forbidden**.

### Validation (דוגמאות)

- `email` תקין; `password` באורך ≥ 8.
- `lat` בין -90 ל-90; `lng` בין -180 ל-180.
- `category` / `status` רק מה-enum.
- מניעת body ריק / שדות חסרים ב-POST.

---

## 5. Realtime — Socket.IO (מינימלי, חובה)

CRUD נשאר ב-REST. Socket.IO רק **משדר** שינויים לכל הלקוחות המחוברים כדי שהמפה תתעדכן בלי רענון.

### Server

1. `http.createServer(app)` + `new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } })`.
2. אחרי `POST` / `PATCH` / `DELETE` מוצלח — `io.emit(...)`.
3. **אין** אימות JWT / middleware על חיבור ה-socket בשרת — השרת רק מקבל חיבורים ומשדר events.

### Events (שמות קבועים)

| Event | מתי | Payload |
| ----- | --- | ------- |
| `incident:created` | אחרי POST מוצלח | אובייקט incident המלא (בלי שדות רגישים) |
| `incident:updated` | אחרי PATCH מוצלח | אובייקט incident המעודכן |
| `incident:deleted` | אחרי DELETE מוצלח | `{ id }` |

אין צורך ב-rooms / namespaces בפרויקט זה — broadcast לכולם מספיק.

### Client

1. אחרי login (בדף המפה המוגן): `io(VITE_API_URL)` — החיבור נוצר רק למשתמש מחובר בצד הלקוח; אין העברת token ל-socket.
2. האזנה ל-3 האירועים למעלה ועדכון ה-state / markers בהתאם:
   - `created` → הוסף marker
   - `updated` → עדכן marker / פרטים
   - `deleted` → הסר marker
3. ב-logout / unmount: `socket.disconnect()`.
4. מי שיצר את הדיווח עדיין מקבל תשובת REST; האירוע משמש בעיקר **משתמשים אחרים** (מותר גם לעדכן state אצל עצמך מאותו event).

---

## 6. Frontend

### Routes

| Path | הגנה | תוכן |
| ---- | ---- | ---- |
| `/login` | ציבורי | התחברות |
| `/register` | ציבורי | הרשמה |
| `/` | Protected Route | מפת incidents |

בלי token תקף → הפניה ל-`/login`.

### State & API

- Zustand: שמירת `token` + `user` (מומלץ persist) + רשימת `incidents` (או hook ייעודי).
- קריאות REST עם `fetch` (או Axios) + צירוף `Authorization: Bearer ...`.
- socket.io-client: חיבור אחרי login (בדף המוגן בלבד), האזנה ל-`incident:*`.
- אין קריאות API / socket ישירות מתוך רכיבי UI — דרך hooks / services.

### מסך המפה (חובה)

1. טעינת incidents מהשרת והצגתן כ-**markers**.
2. לחיצה על marker → **popup** או פאנל פרטים (title, description, category, status).
3. מצב "הוסף דיווח": לחיצה על המפה → קבלת `{ lat, lng }` → טופס (title, description, category) → `POST /incidents`.
4. **Filter** לפי category (query לשרת ו/או סינון בצד הלקוח).
5. **center / zoom** התחלתי הגיוני (למשל מרכז ישראל / עיר הקורס).
6. עדכון `status` ו-edit/delete — רק לדיווחים של המשתמש המחובר (להסתיר כפתורים לאחרים).
7. עדכון חי של markers כשמגיע `incident:created` / `updated` / `deleted` (בדיקה עם שני דפדפנים / שני users).

### בונוס (אופציונלי)

- כפתור "מרכז עליי" עם Geolocation API.
- תפקיד `admin` שמנהל כל הדיווחים.
- צבע marker לפי category / status.
- אינדיקטור "online" / toast קצר כשדיווח חדש נוסף.

---

## 7. לוח זמנים — יומיים

### Day 1 — Backend

1. חיבור MongoDB + models (`User`, `Incident`).
2. Auth: register / login / me + bcrypt + JWT + auth middleware.
3. Incidents CRUD + ownership checks (403).
4. Zod על כל הנתיבים.
5. חיבור socket.io + emit של `incident:created` / `updated` / `deleted`.
6. Seed של כמה incidents לבדיקה.
7. בדיקה ב-Postman / Thunder Client (REST) + שני טאבים ל-socket.

### Day 2 — Frontend + Map + Realtime

1. Vite + React TS + React Router + עמודי login / register.
2. Zustand + fetch API + Protected Route.
3. מפה: markers, popup, click → coordinates, טופס יצירה.
4. Filter לפי category + עדכון status / מחיקה לבעלים.
5. socket.io-client: חיבור + עדכון markers בזמן אמת.
6. README קצר: איך להריץ backend + frontend + משתני `.env`.

---

## 8. Acceptance checklist

- [ ] Register / Login עובדים; הסיסמה לא חוזרת בתשובות.
- [ ] כל נתיבי incidents דורשים JWT תקף.
- [ ] רשימת markers מגיעה מה-DB.
- [ ] לחיצה על marker מציגה פרטי incident.
- [ ] לחיצה על המפה ממלאת `lat` / `lng` בטופס יצירה.
- [ ] Filter לפי category עובד.
- [ ] Owner (או admin) יכול לעדכן / למחוק; משתמש אחר מקבל 403.
- [ ] `status` תומך ב-`open` | `in_progress` | `closed`.
- [ ] center / zoom מוגדרים במפה.
- [ ] אחרי create/update/delete — לקוח אחר רואה שינוי במפה **בלי רענון** (`incident:created` / `updated` / `deleted`).
- [ ] README מסביר הרצה מקומית.

---

## 9. מחוץ לסקופ

- אין GIS מתקדם, clustering, heatmaps.
- אין העלאת קבצים / תמונות.
- אין Google Maps / Mapbox (רק Leaflet + OSM).
- אין Docker חובה בפרויקט זה.
- אין שליחת מייל / SMS.
- אין rooms / private channels / typing indicators — רק broadcast של שינויי incidents.

---

## 10. `.env` לדוגמה

**Backend**

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/incident-map
JWT_SECRET=change-me-long-random
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
```

**Frontend**

```env
VITE_API_URL=http://localhost:3000
```

---

בהצלחה — התמקדו ב-CRUD נקי + auth אמיתי + מפה + עדכונים חיים מינימליים עם Socket.IO.
