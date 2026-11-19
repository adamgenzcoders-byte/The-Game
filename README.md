# Chronicle Engine: Egypt Through Civilizations 🏛️
### An Interactive Mystery Game Web Application for School Fun Day

Built specifically for **Elsewedy International School** (مدرسة السويدي الدولية).

---

## 🌟 Overview & Key Capabilities

- **100% Data-Driven & Flexible**: Every story sentence, level, clue block, location, QR code, staff member, and rule is editable from the **Admin Dashboard** (`/admin`) without touching code.
- **Vercel & Mobile Optimized**: Lightweight, mobile-first, zero heavy assets, responsive RTL (Egyptian Arabic friendly), works reliably on weak Wi-Fi or student 4G/5G networks.
- **4 Distinct Paths × 10 Levels (40 Levels Total)**:
  1. **Ancient Egypt (The Origin)**: Why the artifact was divided into four seals.
  2. **Greco-Roman (The Method)**: The mechanical and mathematical method used to transport the artifact.
  3. **Islamic Civilization (The Motive)**: The noble motive to protect knowledge during venue renovation.
  4. **Modern Era (The Identity & Location)**: The digital footprint, who moved it, and its exact location under the stage.
- **Anti-Congestion & Anti-Leak (Route Variants A & B)**: Each path supports balanced sub-variants (A/B) so 30-40 teams never crowd the same classroom or stairs simultaneously. Answers are strictly kept server-side; players receive only their current mission.
- **The Curse of the Tomb (لعنة المقبرة)**:
  - Wrong choices or cursed trap QRs trigger a dramatic blood-red ancient curse screen.
  - Server applies a fake "+3 levels" experience using display offsets (`displayedLevel = realLevel + offset`), rerouting teams to the next civilization in the cycle without leaking answers.
- **Live Leaderboard & Stage Revelation**:
  - `/projector`: Live auditorium projector board updating every 5 seconds.
  - `/reveal`: Final revelation screen where the 4 fragments are revealed on stage with confetti!
- **Guardian Portal (`/guardian`)**: A dedicated mobile portal for teachers and booth organizers with a station PIN. They can look up teams, give challenges, dispense secret codes, and confirm curse penalties without seeing other levels.
- **Printable Sheets**: Auto-generates printable A4 HTML sheets for QR codes, organizer cards, and emergency backup codes.

---

## 🚀 Quick Start (Local Development)

### 1. Requirements
- Node.js (v18, v20, or v26)
- npm

### 2. Install & Run
```bash
# Navigate to the project directory
cd chronicle-engine

# Dependencies are already installed! If needed:
npm install

# Run automated test suite (verifies normalizer, curse offset math, security)
npm test

# Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ How to Deploy to Vercel in 2 Minutes

This project was built from the ground up for seamless Vercel deployment:

### Step 1: Push to GitHub / GitLab
Create a repository on your GitHub account and push the code:
```bash
git init
git add .
git commit -m "feat: complete chronicle mystery engine"
git branch -M main
git remote add origin https://github.com/<your-username>/chronicle-engine.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New..." -> "Project"**.
2. Select your `chronicle-engine` repository.

### Step 3: Add Database & Environment Variables
Inside your Vercel project:
1. Go to the **Storage** tab:
   - Click **Create Database** -> Select **Postgres (Neon)** (Free tier).
   - Click **Connect** to your project. Vercel automatically injects `POSTGRES_URL` and `DATABASE_URL`!
   - *(Alternatively, if using Turso Serverless SQLite, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`).*
2. Under **Settings -> Environment Variables**, add:
   - `ADMIN_PASSWORD`: Your secret admin password (e.g. `sewedy2026`).
   - `DEFAULT_GUARDIAN_PIN`: Default PIN for station guardians (e.g. `4192`).
3. Click **Deploy**!

Within 60 seconds, your application will be live at:
`https://your-project.vercel.app`

---

## 📱 URL Directory for Event Day

| URL | Audience | Description |
| :--- | :--- | :--- |
| `/` | All Students | Welcome screen, start investigation, register or join team. |
| `/register` | Students | Register a new team or enter 4-digit Join Code. |
| `/play` | Students | Active investigation dashboard, clues, answer box, hints. |
| `/scan` | Students | Mobile camera scanner for physical QR codes + manual code input. |
| `/q/:id` | Students | Direct link when a student scans a printed QR code with their native phone camera. |
| `/cursed` | Cursed Teams | The dramatic ancient curse screen with added levels. |
| `/final` | Finalist Teams | The 3 Grand Accusation questions submitted for judging. |
| `/guardian` | Teachers / Staff | Mobile portal for teachers, engineers, booth operators, and tomb guardians. |
| `/projector` | Auditorium Screen | Big-screen live leaderboard for the main hall projector. |
| `/reveal` | Main Stage Screen | The 4-part revelation stage screen for the closing ceremony. |
| `/admin` | Event Directors | Full Admin Dashboard: monitor teams, emergency skip, edit content. |

---

## 🏫 How to Adapt to Real School Data (Step-by-Step)

You do **not** need to touch any code! Simply log in to `/admin` with your password (`sewedy2026`) and use the dashboard:

### 1. Update Real School Locations (`/admin` -> "أماكن المدرسة")
- Edit existing classrooms or add new ones: "فصل 1/1 (مبنى أ)", "سلالم الدور الثاني (كوتس الدعم النفسي)", "معمل الروبوتكس".
- Each location has a name, zone, and optional organizer notes.

### 2. Update Real School Staff & Booths (`/admin` -> "المدرسين والبوثات والحراس")
- Replace sample names with your real teachers, engineers, advisors, and student organizers at Elsewedy.
- Set their character persona, what to say to teams, their challenge, their handout code, and their secret PIN.
- Click **"طباعة كروت الحراس والبوثات"** to print individual cheat sheets for each staff member!

### 3. Customize Quotes, Counting & Clues (`/admin` -> "محرر المستويات")
- Select any of the 4 paths.
- Click **"تعديل"** on any level to adapt clues to your school's physical environment:
  - **Stair Quotes**: Enter the exact words from the stairs of Elsewedy School.
  - **Counting**: Set the number of fans, ACs, screens, or chairs in a specific classroom.
  - **Valid Answers**: Enter comma-separated acceptable answers (the normalizer automatically handles Arabic Alef `أ/إ/ا`, Taa Marbouta `ة/ه`, Yaa `ى/ي`, Eastern/Western digits `٤٢/42`, and spaces).

### 4. Print Field QR Sheets (`/admin` -> "أكواد الـ QR والطباعة")
- Click **"طباعة شيت الـ QR الجاهز (A4)"**.
- It opens a pre-formatted A4 grid with high-resolution QR codes, labels, and room names ready to cut and paste on walls and classroom doors!
- Click **"شيت طوارئ الأكواد"** to keep an offline backup cheat sheet with organizers in case of phone battery issues.

---

## 🧪 Testing & Integrity Verification

The repository includes a validation tool and automated test suite:

```bash
# Run unit tests
npm test
```

Tests cover:
- Arabic answer normalization & digit conversions.
- Curse offset math (expanding displayed total, e.g. 10 -> 13 -> 15).
- Max curse caps.
- Security boundaries (zero answers leaked to client).
- In `/admin`, open the **"فحص الجاهزية"** tab to run a pre-event health check on all 40 levels.

---

## 🛡️ Emergency Overrides (Built-in Failsafes)

If a physical QR code is torn, a room is locked, or a teacher is called away:
1. Open `/admin` -> **"مراقبة الفرق الحية"**.
2. Find the affected team and click **"تخطي ليفل ⏭️" (Emergency Skip)**.
3. The server immediately advances the team to the next level with zero penalty, and their phone refreshes automatically!

