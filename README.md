Wheelchair Campus Navigator (Hackathon Prototype)

Project Goal:
Provide a simple, accessible navigation tool for wheelchair users on campus, with real-time AR guidance and notifications for blocked paths.

🚀 Features

Campus Wheelchair Map

Displays all wheelchair-accessible paths on campus.

Overlay of main routes between buildings.

Navigation & AR Guidance

Computes route between two points on campus.

AR-style arrow overlay points in the direction of the next waypoint.

Real-time compass updates align the arrow with user heading.

Real-Time Notifications (Simulated)

Alerts users of blocked ramps or path hazards.

Demonstrates rerouting functionality.

Hackathon Focus

Fully working prototype without needing full GIS data.

Hardcoded example routes for quick demonstration.

📱 Tech Stack

Frontend: React + Mapbox GL JS / Leaflet (map visualization)

AR/Navigation: Web camera feed + JavaScript compass/orientation API

Backend (optional for demo): Node.js / Firebase (for simulated real-time updates)

Data: Hardcoded routes for hackathon demo (can later integrate ArcGIS GeoJSON)

🛠 Setup & Run

Clone the repository:

git clone https://github.com/<your-org>/wheelchair-campus-navigator.git
cd wheelchair-campus-navigator


Install dependencies:

npm install


Start the app:

npm start


Open your browser on mobile for AR + compass demo.

(Optional) If using Firebase for simulated real-time updates:

Add Firebase config in src/firebase.js.

Start Firebase emulators or connect to live project.

🧩 How It Works

User selects Start and End points on campus.

App highlights a route along wheelchair-accessible paths.

In AR view, an arrow overlays the camera feed and rotates toward the next waypoint based on device compass.

If a “blocked path” is triggered, the route updates and arrow redirects (demo simulation).

📸 Demo Instructions

Open the app on your mobile device.

Select a predefined route (e.g., Library → Student Center).

Switch to AR mode → see the arrow pointing along the route.

Trigger a simulated path blockage → watch rerouting and notification appear.

⚡ Hackathon Notes

Hardcoded routes replace full GIS data for speed.

Prototype demonstrates core idea: navigation + AR guidance + accessibility focus.

Full integration with ArcGIS GeoJSON can be added later.
