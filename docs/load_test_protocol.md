# BIM Viewer & PWA Load Test Protocol

This document provides step-by-step instructions for performing a high-load stress test on the BMBuildManage MVP.

## 1. BIM Viewer Performance (Desktop)

### Preparation
1. Open the BMBuildManage web app in **Chrome**.
2. Go to any project's **3D View**.
3. Open **Chrome DevTools** (`F12`) → **Performance** tab.

### Test Steps
1. **Model Loading Time**: Upload a model > 30MB. Record total time from "Seleccionar archivo" to "Visualización 3D lista".
   - *Target: Any 50MB model should load in < 15 seconds.*
2. **Smoothness (FPS)**: Enable the "FPS Meter" in Chrome. Zoom and Rotate for 60 seconds.
   - *Target: Consistent 60fps for models < 50k elements; > 30fps for models > 200k.*
3. **Quantity Extraction Trace**: Select 5 complex elements (e.g., non-rectangular walls or large slabs).
   - *Target: Volume and Area properties should appear in the popover in < 800ms.*

---

### Comparison Matrix
| Model Size | Load Time | FPS (Avg) | Extraction Lag |
| :--- | :--- | :--- | :--- |
| < 5 MB | < 3s | 60+ | < 200ms |
| 10 - 30 MB | < 8s | 60 | < 500ms |
| > 50 MB | < 20s | 30 - 45 | < 1s |

---

## 2. Mobile PWA Offline Stress (Field App)

### Test Steps
1. **Data Density**: Choose a budget with at least 50+ line items.
2. **Offline Simulation**: Turn on "Airplane Mode" on your phone (or use "Offline" in DevTools).
3. **High Volume Queueing**: Quickly edit the quantity of **20 different items**.
4. **Sync Latency**: Turn "Airplane Mode" OFF and monitor the Sync Indicator.
   - *Target: All 20 items should sync as a single transaction in < 5 seconds.*

## 3. Recommended Benchmark Models
If you do not have a private large IFC model, download one of these public benchmarks:
- [Duplex Apartment (Standard)](https://github.com/BuildingSMART/Sample-Test-Files/raw/master/IFC%202x3/Duplex%20Apartment/Duplex_A_20110907.ifc)
- [Schependomlaan (Complex)](https://github.com/BuildingSMART/Sample-Test-Files/raw/master/IFC%204/Schependomlaan/Schependomlaan_IFC4.ifc)
