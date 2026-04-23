# 📘 CertifyMe — Full Stack Intern Assessment

---

## 🚀 Getting Started

1. **Clone the provided repository**
   ```bash
   git clone https://github.com/Neerajvs32/Test1.git
   ```

2. **Create your own GitHub repository**
   - Push the cloned project to your own GitHub account.
   - Share your repository link after completing the task.

3. **Development Requirement**
   - Both Frontend and Backend must run together.
   - The UI must remain exactly the same.
   - ❌ Do NOT modify frontend design or components.
   - ✅ Build the backend required for the existing UI functionality.

---

## 🏢 Project Overview

This project is part of the **CertifyMe Full Stack Intern Assessment**. The repository already contains a complete Admin UI. Your responsibility is to **build the backend and connect it with the existing frontend**.

### Objectives
- Build backend APIs using Flask
- Connect frontend with backend
- Store and retrieve data from database
- Make the application fully functional

### 🔗 Original Repository
[https://github.com/Neerajvs32/Test1](https://github.com/Neerajvs32/Test1)

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python |
| Framework | Flask |
| Database | SQLite / MySQL / PostgreSQL |
| Frontend | Pre-built Admin UI |

---

## 🧩 Features & User Stories

---

### ✅ Task 1 — Authentication *(Day 1)*

---

#### US-1.1 — Admin Sign Up

**Required Fields**
- Full Name
- Email
- Password
- Confirm Password

**Validations**
- All fields mandatory
- Email must be valid
- Password minimum 8 characters
- Passwords must match
- Email must be unique

**Expected Result**
- Save admin account
- Redirect to Login page

---

#### US-1.2 — Admin Login

**Fields**
- Email
- Password
- Remember Me checkbox

**Rules**
- Show generic error on failure:
  ```
  Invalid email or password
  ```

**Expected Result**
- Redirect to dashboard
- Load opportunities created by the admin

**Session Handling**

| Condition | Behaviour |
|---|---|
| Remember Me checked | Long-lived session |
| Remember Me unchecked | Session ends when browser closes |

---

#### US-1.3 — Forgot Password

**Requirements**
- Admin enters their email
- Always show the same success message (regardless of whether email exists)

**Behaviour**
- Generate reset link internally
- No email sending required

**Security**
- Reset link expires after **1 hour**
- Expired link shows an error

---

### ✅ Task 2 — Opportunity Management *(Day 2)*

> All opportunities must be stored in the database, linked to the logged-in admin, and must never use hardcoded data.

---

#### US-2.1 — View All Opportunities

**Each opportunity card must display:**
- Opportunity Name
- Category
- Duration
- Start Date
- Description

**Rules**
- Show only the logged-in admin's opportunities
- Remove all demo / hardcoded cards
- Show an empty state if no opportunities exist

---

#### US-2.2 — Add New Opportunity

**Required Fields**
- Opportunity Name
- Duration
- Start Date
- Description
- Skills to Gain *(comma separated)*
- Category
- Future Opportunities

**Optional Field**
- Maximum Applicants

**Category Options**
- Technology
- Business
- Design
- Marketing
- Data Science
- Other

**Expected Result**
- Validate all required fields
- Save opportunity to database
- Link opportunity to logged-in admin
- Display immediately **without page refresh**

---

#### US-2.3 — Opportunities Persist After Login

- Opportunities must load after logout / login cycles
- Stored only in the database — **no local storage usage**
- Admins cannot access other admins' data

---

#### US-2.4 — View Opportunity Details

- Open a details modal
- Show all saved fields
- Close button available

---

#### US-2.5 — Edit Opportunity

- Edit button opens a pre-filled form
- Apply the same validations as during creation
- Update only the selected opportunity
- Reflect changes instantly **without page refresh**

---

#### US-2.6 — Delete Opportunity

- Show a confirmation dialog before deletion
- Delete permanently from the database
- Remove from UI immediately **without page refresh**
- Only the creator admin can delete their own opportunity
