# Emergency / Incident Map 🚨

מערכת מלאה (Fullstack) לדיווח, ניהול ומעקב אחרי אירועים על מפה אינטראקטיבית בזמן אמת.

---

## 🛠 טכנולוגיות

- **Backend:** Node.js, Express, MongoDB (Native Driver), Socket.IO, JWT, bcrypt, Zod, CORS.
- **Frontend:** React 18, TypeScript, Vite, React Router v6, Zustand, Leaflet, React-Leaflet, Socket.IO Client.

---

## 🚀 איך להריץ את הפרויקט מקומית

### 1. Backend (השרת)

```bash
cd backend
npm install
npm start
```
השרת יעלה על פורט `3001` ויתחבר ל-MongoDB.

משתני סביבה בקובץ `backend/.env`:
```env
PORT=3001
MONGO_URL=mongodb+srv://...
JWT_SECRET=incident-secret-key-123
CLIENT_ORIGIN=http://localhost:5173
```

### 2. Frontend (הקליינט)

```bash
cd frontend
npm install
npm run dev
```
האפליקציה תיפתח בדפדפן בכתובת: `http://localhost:5173`.

משתני סביבה בקובץ `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

---

## ✨ תכונות עיקריות

1. **אימות משתמשים (Auth):** הרשמה והתחברות עם סיסמאות מוצפנות וטוקן JWT שנשמר ב-Zustand ו-LocalStorage.
2. **מפה אינטראקטיבית (Leaflet):**
   - הצגת כל האירועים כסימונים (Markers) צבעוניים לפי קטגוריה.
   - לחיצה על Marker פותחת חלונית עם כל פרטי האירוע.
   - לחיצה בכל מקום על המפה לוכדת את הקואורדינטות ופותחת טופס ליצירת דיווח חדש.
3. **סינון (Filter):** אפשרות לסנן אירועים לפי קטגוריות (`accident`, `fire`, `flood`, `medical`, `other`).
4. **ניהול הרשאות (Authorization):** עדכון סטטוס ומחיקת אירוע מתאפשרים רק למשתמש שיצר את הדיווח או למנהל (`admin`).
5. **זמן אמת (Realtime Socket.IO):** כל אירוע שנוצר, מתעדכן או נמחק מתעדכן אצל כל המשתמשים המחוברים מיד ללא צורך ברענון העמוד.
