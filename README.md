# Acess Path

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
- **Data:** 
  - Primary source: Campus Accessibility Map (ArcGIS) showing all wheelchair-accessible paths.  
  - Used as the main layer for route visualization and navigation.  
  - For demo purposes, a subset of key routes is hardcoded to enable quick routing and AR prototype.  
  - Full GeoJSON integration from ArcGIS can be added later for complete campus coverage.


---

## 🛠 Setup & Run

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```
