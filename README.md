## **ReVision: Your AI-Powered Active Learning Tutor**
**DevPost:** https://devpost.com/software/revision-bdqpho
**ReVision** is a **web application** designed to transform passive review into **active, personalized learning**. It helps students and learners of all kinds practice and master concepts by providing **real-time, recursive guidance** similar to a dedicated human tutor.

---

### **Key Features and Functionality**

* **Problem Extraction:** Users upload an image or document (e.g., JPEG, PNG) of problems. Using **Google Cloud Vision's OCR**, **ReVision** extracts the questions, from subjects like algebra, calculus, or even code.
* **Active Practice Module:** The app builds an interactive module featuring a digital **whiteboard-style canvas**. Users write or type their solutions directly onto the canvas.
* **Real-Time AI Tutoring:** An integrated **AI Tutor** (powered by **Gemini Pro** and **Gemini 2.5 Flash Lite**) constantly monitors the user's input.
* **Instant, Tailored Feedback:** Based on the solution process, the AI provides **instant feedback, detailed breakdowns, and personalized suggestions**. Hints are color-coded (green for close, red for off-track) and displayed at the bottom.
* **Multilingual Support:** The application can reply in multiple languages, significantly expanding its accessibility.
* **Versatile Use Cases:** Excellent for students preparing for **exams** and for developers new to technologies seeking **active coding practice**.

---

### **Tech Stack and Architecture**

* **Frontend:** Built with **React** and **Next.js**.
* **Backend:** Utilizes **Python** with **Flask** for API integration.
* **AI/ML:** Leverages **Google Cloud Vision (OCR)** and the **Gemini API** for question structuring and **real-time recursive solution validation**.
* **Deployment:** Managed with **Git/GitHub** and deployed on platforms like **Vercel**.

---

### **What We're Proud Of**

* Successfully deploying a functional, **real-time looping algorithm** with an integrated LLM.
* Simulating an editable, **whiteboard-style canvas** with pen and eraser features.
* Achieving **multilingual tutoring support**.

**ReVision** moves beyond just getting the right answer—it focuses on **understanding the logic and refining the solution process**, building true confidence in the user.
