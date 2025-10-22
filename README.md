### **HUE Vision: Browser-Based Eye Tracking with TensorFlow.js and MediaPipe FaceMesh**

**HUE Vision** is a web-based application that brings real-time eye tracking and gaze prediction directly into the browser - powered by **TensorFlow.js** and **MediaPipe FaceMesh**.
It showcases how on-device computer vision and machine learning can work seamlessly together for intuitive, privacy-friendly gaze interaction.

---

**Demo**: https://simplysuvi.com/hue-vision/

**Post**: https://blog.roboflow.com/build-eye-tracking-in-browser/

---

#### **Features**

* Real-time eye tracking using webcam input
* Lightweight facial landmark detection via **MediaPipe FaceMesh** (replacing clmtrackr)
* On-device machine learning model for gaze prediction using **TensorFlow.js**
* Live heatmap visualization to evaluate gaze prediction accuracy
* Clean, modern overlay with subtle facial mesh rendering and eye focus tracking
* Fully privacy-preserving - no data leaves your browser

---

#### **Technologies Used**

* **JavaScript** (ES6)
* **TensorFlow.js**
* **MediaPipe FaceMesh**
* **HTML5 / CSS3**
* **jQuery**

---

#### **How to Use**

1. Allow webcam access and center your face within the frame.
2. Start the **Calibration** process to map gaze positions.
3. Begin **Training** — the model learns your eye-to-screen relationship.
4. Once trained, enable **Tracking** to predict gaze movement in real time.
5. View the **Heatmap** to visualize gaze concentration and model accuracy.

---

#### **Recent Updates**

* Switched from **clmtrackr** to **MediaPipe FaceMesh** for improved accuracy and stability
* Added **subtle mesh visualization** for cleaner UI with highlighted eye contours
* Removed legacy bounding box visuals and retuned the eye crop for precise focus
* Refined **UI design**, rendering performance, and color balance for a smoother experience

---

* Inspired by next-generation spatial and gaze tracking systems like **Apple Vision Pro**
* Built using **TensorFlow.js** and **MediaPipe** for real-time, on-device vision inference
