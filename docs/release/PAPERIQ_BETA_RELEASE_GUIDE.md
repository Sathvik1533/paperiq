# PaperIQ Beta Release & Student Onboarding Guide
**Welcome MLRIT Autonomous R22 Students (3rd Year, 1st Semester)**  
**Version**: Beta v1.0.0  
**Release Date**: November 15, 2026

---

## 1. Introduction

Welcome to the **PaperIQ Beta Release**! PaperIQ is an AI-powered Exam Intelligence platform built specifically for MLRIT engineering students. Instead of cramming hundreds of pages without direction, PaperIQ analyzes genuine autonomous examination papers from 2024 and 2025 to give you exact topic frequencies, mark-calibrated exam answers, and personalized readiness scoring.

---

## 2. Accessing the Beta Application

### Local Environment:
- **Frontend Web Application**: [http://localhost:3005](http://localhost:3005)
- **Backend API & Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **API Health Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

*(For remote beta access, refer to the Vercel staging deployment at `https://paperiq.vercel.app`)*.

---

## 3. Step-by-Step Student Onboarding

### Step 1: Create Your Account
1. Open [http://localhost:3005/auth](http://localhost:3005/auth).
2. Click **Create an Account**.
3. Enter your student email and a secure password.
4. Click **Sign Up** to automatically create your profile in Supabase Auth.

### Step 2: Configure Your Academic Context
1. Upon your first sign-in, you will be directed to `/onboarding`.
2. Confirm your academic details:
   - **College**: `MLRIT (Marri Laxman Reddy Institute of Technology)`
   - **Regulation**: `R22`
   - **Year**: `3rd Year`
   - **Semester**: `1st Semester (3-1)`
   - **Branch**: `Computer Science & Engineering (CSE) / IT / AIML`
3. Click **Complete Setup** to activate your customized 3-1 dashboard.

---

## 4. Supported Academic Scope (R22 3-1 Cohort)

To guarantee the highest data accuracy, the beta is strictly scoped to the 5 official 3-1 curriculum subjects:

| Subject Code | Official Subject Name | Units Covered | Exam Pattern |
| :--- | :--- | :--- | :--- |
| **`A6CS15`** | **Design and Analysis of Algorithms (DAA)** | Units 1 to 5 | 60 Marks (Part A + B) |
| **`A6IT13`** | **Cloud and DevOps (CD)** | Units 1 to 5 | 60 Marks (Part A + B) |
| **`A6CS18`** | **Computer Networks (CN)** | Units 1 to 5 | 60 Marks (Part A + B) |
| **`A6IT26`** | **Information Retrieval Systems (IRS)** | Units 1 to 5 | 60 Marks (Part A + B) |
| **`A6AI14`** | **Natural Language Processing (NLP)** | Units 1 to 5 | 60 Marks (Part A + B) |

> [!NOTE]
> Earlier semester subjects such as Operating Systems (`A6CS11`) and DBMS (`A6CS09`) are intentionally excluded in this beta to focus entirely on the upcoming 3-1 regular examinations.

---

## 5. Key Feature Walkthrough

### 1. AI Companion 2.1 (Your Academic Tutor)
- **Where**: Click **Companion** on the top navigation bar.
- **How to use**:
  - Ask any concept question, e.g., *"Explain 0/1 Knapsack using LC Branch and Bound"*.
  - PaperIQ detects whether this appeared on a verified past exam and auto-calibrates the answer format (1 Mark, 5 Marks, or 10 Marks).
  - **Formatting Controls**: Toggle between **Simple English** (easy to understand analogies) or **Exam-Ready** (formal academic terminology and grading points).
  - **Math**: KaTeX renders mathematical symbols, recurrences, and formulas cleanly.

### 2. Exam Pattern Analysis
- **Where**: Click **Analysis** on the navigation bar.
- **How to use**:
  - View the 60-mark exam breakdown: Part A (10 × 1M = 10 mandatory marks) and Part B (5 × 10M = 50 marks with internal choice).
  - Inspect **Topic Frequencies** sorted by recency (2024 & 2025 regular papers).
  - Click on any topic to inspect verified historical questions.

### 3. Student Study Planner & Readiness Score
- **Where**: Click **Planner** on the navigation bar.
- **How to use**:
  - Select your target subject and how many days you have before the examination.
  - Review your **Must Study** and **High Yield** topic checklists.
  - Check off topics as you complete them; your **Exam Readiness Score (0–100%)** will automatically update.

### 4. Previous Papers & Document Vault
- **Where**: Click **Previous Papers** on the navigation bar.
- **How to use**:
  - Search across 6,059 indexed MLRIT papers.
  - Filter by Regulation (R22), Session (Regular), and Year (2024, 2025).
  - Open verified papers directly to cross-check question wording and marks.

---

## 5. Visual Previews & Real Screenshots

Reference evidence captures from the live beta release:
- **Landing Dashboard**: [screenshots/landing_1440px.png](screenshots/landing_1440px.png)
- **AI Companion Interface**: [screenshots/companion_1440px_desktop.png](screenshots/companion_1440px_desktop.png)
- **AI Mark-Calibrated Chat**: [screenshots/companion_active_chat_1440px.png](screenshots/companion_active_chat_1440px.png)
- **Mobile Responsive Layout**: [screenshots/landing_390px_mobile.png](screenshots/landing_390px_mobile.png)

---

## 6. How to Report Issues & Give Feedback

If you encounter any layout issues, unexpected error messages, or missing syllabus topics:
1. Click the **Feedback** icon in the bottom corner of any page.
2. Or email the developer team directly with your feedback.
3. Include your subject code and question text so we can immediately inspect the logs.

Thank you for participating in the PaperIQ Beta!
