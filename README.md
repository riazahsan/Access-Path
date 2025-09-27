# Wheelchair Campus Navigator (Hackathon Prototype)

**Project Goal:**  
Provide a simple, accessible navigation tool for wheelchair users on campus, with real-time AR guidance and notifications for blocked paths.

---

## 🚀 Features

- **Campus Wheelchair Map**  
  - Displays all wheelchair-accessible paths on campus.  
  - Overlay of main routes between buildings.

- **Navigation & AR Guidance**  
  - Computes route between two points on campus.  
  - AR-style arrow overlay points in the direction of the next waypoint.  
  - Real-time compass updates align the arrow with user heading.

- **Real-Time Notifications (Simulated)**  
  - Alerts users of blocked ramps or path hazards.  
  - Demonstrates rerouting functionality.

- **Hackathon Focus**  
  - Fully working prototype without needing full GIS data.  
  - Hardcoded example routes for quick demonstration.

---

## 📱 Tech Stack

- **Frontend:** React + Mapbox GL JS / Leaflet (map visualization)  
- **AR/Navigation:** Web camera feed + JavaScript compass/orientation API  
- **Backend (optional for demo):** Node.js / Firebase (for simulated real-time updates)  
- **Data:** Hardcoded routes for hackathon demo (can later integrate ArcGIS GeoJSON)

---

## 🛠 Setup & Run

1. Clone the repository:  
   ```bash
   git clone https://github.com/<your-org>/wheelchair-campus-navigator.git
   cd wheelchair-campus-navigator
