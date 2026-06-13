# Indian Railways Prototype Upgrade Complete!

I've successfully implemented all advanced features. The prototype now feels incredibly cohesive, dynamic, and visually on-par with an enterprise-grade command center!

## How to Test the Prototype Features

### 1. 🌙 Global Night Mode & Alerts (Navbar)
- **Theme Engine:** Integrated a global Dark/Light mode engine.
- **How to Interact:** Click the **Sun/Moon icon** in the top right of the navigation bar to instantly switch the entire app (tabs, tables, borders) into Night Mode.
- **Alert Center:** Notice the global alert bell icon next to the theme toggle. This is prepared for cross-system telemetry alerts.

### 2. 📊 Crew Roster Pulse Dashboard
- **Operational Proof:** In the Crew Pulse Monitor, you can inspect pilot fatigue scores and dynamically schedule swaps.
- **How to Interact:**
  1. Look at the table rows; they are all clickable. 
  2. Click on a pilot (e.g., **"Rajesh Kumar"**) to expand a smooth 7-Day Shift History Gantt Chart beneath them.
  3. Notice the red pulsing bars? These represent back-to-back 10+ hour night shifts, proving exactly why the AI flagged them as a critical fatigue risk!
  4. Click the **"Request Swap"** button to open the swap modal, select a replacement pilot, and watch the UI instantly update.

### 3. 🗺️ Interactive Live FOIS Map
- **Live Geography:** Replaced the static FOIS screen with a massive `react-leaflet` interactive map.
- **How to Interact:**
  1. Click the **"FOIS Freight Tracker"** tab.
  2. Scroll around the map and zoom in/out. 
  3. Click the **Colored Terminals** to view live capacity and congestion levels.
  4. Click the **Train Icons** to see their Origin, Destination, and Delay times.

> [!TIP]
> Because we do not have a secure VPN to the Indian Railways CRIS API yet, the prototype renders deterministic mock trains (train icons) near their destination terminals to demonstrate exactly how it will look when live data is plugged in.

### 4. 🧠 Dynamic Delay Adjustment (Layover Concierge)
- **AI Recalculation:** We built an itinerary generator for stranded passengers that reacts dynamically to train delays.
- **How to Interact:**
  1. Click the **"Layover Concierge"** tab.
  2. Enter any 10-digit PNR (e.g., `1234567890`) and select a preferred language.
  3. Click **"Generate Itinerary"** using the default "On Time (4 Hrs)" duration. Notice the timeline.
  4. Now, click **"+2 Hr Delay"** and click **"Generate Itinerary"** again. 
  5. **Watch the AI Magic:** The AI instantly realizes it now has 6 hours instead of 4, expands the geofence, and intelligently injects a brand new activity (like a quick museum visit) into your timeline to fill the gap!

> [!WARNING]
> **Important Note regarding Bhashini Voice Announcements:** 
> You can click the **Speaker Button** at the top right of any generated itinerary to simulate a station voice announcement. 
> *However, please note that the Bhashini API integration is currently **MOCKED** for this prototype phase to avoid incurring unexpected cloud costs or rate limits during demonstrations. We have prepared the backend to accept real Bhashini ULCA credentials whenever you are ready to go live!*
