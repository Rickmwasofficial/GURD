# GURD Health Diagnostics System

AI-powered health diagnostics platform for rural Kenya, enabling Community Health Volunteers (CHVs) to diagnose malaria, pneumonia, and malnutrition using multimodal AI, with real-time outbreak detection for district health officials.

## 🌟 Key Features

### 🏥 CHV Diagnostic Portal
- **AI-Powered Intake**: Record patient demographics and symptoms (fever, cough, rapid breathing, etc.).
- **Multimodal AI Diagnosis**: Uses **Gemini 3 Flash** to analyze symptoms and photos (face/body) for acute illnesses and malnutrition.
- **Clinical Guidance**: Instant treatment plans, medication dosages, and "Red Flag" warnings for critical cases.
- **Offline-First Design**: Optimized for low-connectivity rural environments.

### 📊 District Surveillance Dashboard
- **Real-Time Tracking**: Visualizes disease trends and case distribution across the district.
- **Outbreak Detection**: Monitors for clusters of high-urgency cases and displays active alerts.
- **Surveillance Analytics**: Breaks down disease distribution and daily incidence for resource allocation.
- **Manual Scan**: Trigger surveillance scans to identify potential outbreaks.

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Animations).
- **Backend**: Express (Node.js), Firebase Admin SDK.
- **AI**: Google Gemini 3 Flash (via `@google/genai`).
- **Database & Auth**: Firebase Firestore & Firebase Authentication.
- **Analytics**: Recharts for surveillance data visualization.

## 🚀 Getting Started

### 1. Prerequisites
- **Firebase Project**: Ensure Firebase is set up (already provisioned in this environment).
- **Gemini API Key**: Required for AI diagnostics (automatically injected in AI Studio).

### 2. Mandatory Configuration (For Deployment)
If you deploy this app to Google Cloud Run or share it, you **MUST** add the following domains to your **Firebase Authentication Authorized Domains**:
- `gurd-health-diagnostics-410789680410.us-west1.run.app`
- `ais-pre-wk5wh7dowtp63fyqw4l5o7-493110773272.europe-west2.run.app`
- `ais-dev-wk5wh7dowtp63fyqw4l5o7-493110773272.europe-west2.run.app`

### 3. Running the App
- **Development**: `npm run dev` (Runs the full-stack server with Vite middleware).
- **Build**: `npm run build` (Compiles the frontend for production).
- **Start**: `npm run start` (Starts the production Express server).

## 🧪 How to Test

1. **Sign In**: Click "Sign in with Google" on the landing page.
2. **Create Assessment**:
   - Click **"New Assessment"**.
   - Enter patient details (e.g., Age: 18 months, Location: Nairobi).
   - Select symptoms like **Fever**, **Cough**, and **Rapid Breathing**.
   - (Optional) Upload photos for malnutrition assessment.
   - Click **"Generate AI Diagnosis"**.
3. **Review Results**:
   - View the AI-generated diagnosis (e.g., "Acute Malaria").
   - Check the **Urgency Level** and **Treatment Plan**.
   - Note any **Red Flags** identified by the AI.
4. **Surveillance**:
   - Navigate to the **"District Dashboard"**.
   - View the aggregated stats and trend charts.
   - Click **"Trigger Surveillance Scan"** to simulate outbreak detection.

## 🔒 Security & Privacy
- **Firestore Rules**: Strict rules are in place to ensure CHVs can only manage their own patients while allowing district-level surveillance.
- **PII Protection**: Patient data is stored securely and only accessible to authorized personnel.

---
*Built for the GURD Health Hackathon Prototype.*
