# AgriLink — Smallholder Farmer Platform

AgriLink is a web platform built to support smallholder farmers in Northern Ghana. It connects farmers to buyers through a crop marketplace with integrated Mobile Money (MoMo) payments, gives irrigation guidance based on crop, soil, and weather conditions, provides live weather forecasts, and offers a resource hub covering cooperatives, financing, and best practices.

## Core Features

- **Market** — post crop listings, browse live market prices, and buy crops directly with a simulated MoMo payment flow (MTN, Vodafone, AirtelTigo network detection)
- **Irrigation Advisory** — get watering recommendations based on crop type, soil type, field size, and recent weather
- **Weather Widget** — live 5-day forecast per region, powered by the Open-Meteo API
- **Enterprise Hub** — resource articles on cooperatives, financing, and agribusiness practices
- **Dashboard** — a farmer's snapshot of active listings, fields, and buyer connections
- **Authentication** — secure signup/login with JWT-based sessions

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express
- **Auth:** JWT + bcrypt password hashing
- **Data store:** lightweight JSON file-based storage (`db.js` / `data.json`)
- **Weather:** Open-Meteo API (no key required)

---

## Live Deployment

- **Live app:** [ADD DEPLOYED FRONTEND URL HERE]
- **Backend API:** [ADD DEPLOYED BACKEND URL HERE]

## Demo Video

[ADD 5-MINUTE DEMO VIDEO LINK HERE]

The video focuses on core functionality (Market/MoMo payments, Irrigation Advisory, Enterprise Hub) rather than sign-up/sign-in flows.

---

## Installation & Setup (Local)

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/maabu025/agri_link.git
cd agri_link
```

### 2. Set up the backend
```bash
cd backend
npm install
node server.js
```
The backend will start at `http://localhost:5000`. You should see:
```
AgriLink server running at http://localhost:5000
```

### 3. Set up the frontend
Open a **new terminal window**, then:
```bash
cd frontend
npm install
npm start
```
The frontend will open automatically at `http://localhost:3000`.

### 4. Using the app
- Register a new account (any Ghanaian-style phone number works, e.g. `0241234567`)
- Explore the Market, Irrigation, Enterprise Hub, and Dashboard tabs
- Try the "Buy with MoMo" flow on any crop listing

---

## Testing Results & Strategies

*(Screenshots referenced below should be added to a `/screenshots` folder in this repo and embedded here, e.g. `![description](screenshots/filename.png)`)*

### 1. Functional Testing — Core Flows
- Registering a new account and logging in
- Posting a new crop listing and confirming it appears in the Market tab
- Buying a listing with MoMo and confirming quantity/stock updates correctly
- Requesting an irrigation advisory for different crop/soil combinations
- Loading the weather widget for each supported region

### 2. Testing with Different Data Values
- MoMo numbers tested across all three supported networks:
  - MTN prefixes (`024`, `054`, `055`, `059`)
  - Vodafone prefixes (`020`, `050`)
  - AirtelTigo prefixes (`026`, `027`, `057`)
- Irrigation advisory tested across multiple crop types (maize, yam, rice, groundnut) and soil types (sandy, loamy, clay) to confirm water-need calculations scale correctly
- Listing quantities tested at boundary values (1 kg, exact max stock, quantity exceeding stock)

### 3. Edge Case Testing
- Invalid/malformed MoMo phone numbers (e.g. too short, non-Ghanaian prefix) — confirmed proper validation error is shown
- Buy quantity of `0` or negative — confirmed rejected client-side
- Buy quantity greater than available stock — confirmed rejected
- Empty required fields on listing/registration forms — confirmed validation blocks submission
- Payment failure path — the MoMo simulation has a 10% random failure rate, used to confirm the "Payment failed" screen and retry flow both work correctly

### 4. Bug Found & Fixed During Testing
During testing, a **network-mismatch bug** was discovered in the MoMo payment flow:
- **Symptom:** the frontend correctly detected a phone number as "MTN MoMo," but submitting the payment was rejected by the backend with "Unrecognized MoMo network."
- **Root cause:** the backend's `normalizePhone()` function stripped the leading `0` from phone numbers before checking it against the network-prefix table, while the prefix table itself used keys that included the leading `0` (e.g. `'059'`). This caused a valid number like `0592534928` to be checked against `"592"` instead of `"059"`, which never matched.
- **Fix:** `detectNetwork()` on the backend was corrected to preserve the leading `0` when extracting the network prefix, matching the (correct) logic already used on the frontend.
- This is a good example of why **consistency between frontend and backend validation logic is critical** — the two must agree, or the same input can pass one layer and silently fail the other.

### 5. Performance Across Environments
- Tested on desktop (Windows, Microsoft Edge) at `localhost` and via the deployed URL
- Tested on a mobile browser via the deployed URL to confirm responsive layout and touch interactions work correctly
- [Add any additional hardware/browser combinations tested]

---

## Analysis of Results

The implemented system successfully delivers on the core objectives set out in the project proposal: a marketplace connecting farmers and buyers, mobile-money-based payments suited to the Ghanaian context, and practical irrigation guidance.

**Where the system met objectives:**
- The Market, Irrigation Advisory, Weather, and Enterprise Hub modules are all fully functional end-to-end, with real data flowing between frontend and backend via a REST API.
- MoMo network detection correctly classifies numbers by Ghana's three major mobile money providers, and the payment flow (initiate → poll status → confirm/fail) mirrors how a production API-based integration would behave.
- The bug discovered during testing (see above) demonstrates that the validation logic, while initially inconsistent, is now correctly aligned between client and server — an important reliability property for a payment-adjacent feature.

**Where the system falls short of the original scope:**
- **MoMo settlement is simulated**, not connected to a real Mobile Money provider (MTN MoMo Open API, Vodafone Cash, or AirtelTigo Money). The current implementation uses a server-side `setTimeout` with a randomized 90% success rate to stand in for the real asynchronous "request to pay" and callback confirmation flow. This was a deliberate scope decision: production access to MTN's MoMo API requires business registration and API approval that falls outside the timeline of this project. The surrounding UX (network detection, confirmation screen, polling for status, success/failure states) was still built to the same shape a real integration would require, so swapping in a live API is a contained, well-defined next step rather than a redesign.
- **Data persistence** uses a flat JSON file rather than a proper database, which is adequate for demonstrating functionality but would not scale or persist reliably in a production deployment (especially on hosting platforms with ephemeral file systems).

---

## Discussion

Each core milestone directly addresses a real constraint faced by smallholder farmers in Northern Ghana:

- **Market + MoMo payments** matter because cash-based, in-person trading limits a farmer's reach to their immediate physical network. Mobile Money is the dominant digital payment method in Ghana, so building around it (rather than card payments, which have low penetration in this context) is the more realistic path to actual adoption.
- **Irrigation Advisory** matters because over- or under-watering is a major driver of crop loss for smallholders who often lack access to agronomic expertise. Turning crop type, soil type, and recent weather into a concrete recommendation closes an information gap cheaply and immediately.
- **Correctness of validation logic** (as surfaced by the MoMo bug) matters more here than in a typical CRUD app, because payment flows fail silently and expensively if frontend and backend disagree — a user could believe a network is supported while the transaction is actually being rejected, which erodes trust in a system explicitly designed to build trust with a first-time digital-payments audience.

The impact of getting these right is that the platform becomes something a farmer can plausibly trust with a real transaction — which is the actual bar for adoption, more so than feature count.

---

## Recommendations

1. **Integrate a real Mobile Money API** (MTN MoMo Open API Collections, or an aggregator like Paystack/Flutterwave that supports MoMo) to replace the simulated payment settlement. This is the single highest-impact next step for making the platform production-ready.
2. **Move to a proper database** (PostgreSQL or MongoDB) instead of the current JSON file store, for real persistence and to support concurrent users safely.
3. **Move secrets out of source code** — the JWT secret is currently hardcoded in `server.js` and should be loaded from an environment variable (`.env`) in any real deployment.
4. **Add automated tests** (e.g. Jest) for critical logic such as `detectNetwork()` and `validateGhanaPhone()`, so regressions like the bug found during manual testing are caught automatically in the future.
5. **Add offline/low-connectivity handling**, since target users in rural Northern Ghana may have inconsistent internet access — a service worker with basic offline caching would meaningfully improve real-world usability.
6. **Expand irrigation advisory with real soil-moisture or satellite data** where available, to move beyond heuristic-based recommendations toward more precise guidance.

---

## Project Structure

```
agri_link/
├── backend/
│   ├── server.js        # Express server: auth, weather, MoMo payments, market/listings, irrigation, resources
│   ├── db.js             # Lightweight JSON-file data layer
│   ├── data.json          # Stored application data
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/       # AuthContext (JWT session handling)
    │   ├── pages/          # Market, MoMoModal, Irrigation, Dashboard, Enterprise, Auth, WeatherWidget
    │   ├── App.js
    │   └── index.js
    └── package.json
```