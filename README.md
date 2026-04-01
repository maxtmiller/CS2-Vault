# [`CS2Vault`](https://cs2vault.vercel.app/)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)

**Effortlessly view all your CS2 items, including those hidden in storage units, and discover the perfect additions to your collection.**

-----

## Demo

<video src="https://github.com/user-attachments/assets/d58d42d6-53e7-4eb9-b2fe-9b985040eef0" width="600" controls>
    Your browser does not support the video tag.
</video>

-----

## Features

  * **Storage Unit Transparency:** Simulates a Steam connection to index and display items in Storage Units without steam client
  * **Real-Time Pricing:** Links to aggregates live market data from both the **Steam Community Market** and **CSFloat** for accurate valuation
  * **Instant Inspect Links:** Automatically generates `steam://rungame/730/...` links for every weapon skin and sticker in your vault
  * **Intelligent Loadout Suggestions:** Select specific skins or agents, and the engine suggests matching items to complete the aesthetic
  * **Sticker Craft Generator:** Generates sticker combinations on selected specific weapon, with inspect link to preview the craft in-game
  * **Filtered Views:** Granular control to sort and view by specific weapon types, rarity, wear, quantity, or collection

-----

## Tech Stack

  * **Frontend:** React 18, Next.js (App Router)
  * **State Management:** Zustand for efficient inventory caching
  * **Styling:** Tailwind CSS (Dark Theme optimized)
  * **Steam Netork:** Steam network & authentication with [steam-user](https://www.npmjs.com/package/steam-user)
  * **CS2 Network:** CS2 game coordinator simulation with [GlobalOffensive](https://www.npmjs.com/package/globaloffensive)
  * **Item API**: Item data parsing with [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API)
  * **Language:** TypeScript

-----

## Local Setup

1.  Clone the repository:

<!-- end list -->

```bash
git clone https://github.com/yourusername/CS2-Vault.git
cd CS2-Vault
```

2.  Install dependencies:

<!-- end list -->

```bash
npm install
```

3.  Configure environment variables:

      * Create a `.env.local` file.
      * Add your Gemini API key

4.  Run the development server:

<!-- end list -->

```bash
npm run dev
```

5.  Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view your vault.

-----

## Next Steps

  * **Inventory Value History:** Track the price fluctuations of your specific skins over time
  * **Inventory Worth Sharing:** Generate a public, read-only link to showcase your collection
  * **Interactive 3D Preview:** Integrate a web-based 3D viewer to rotate skins and preview stickers
  * **Mobile Companion:** Responsive mobile view for checking market prices on the go
  * **Coherence Score:** Simple heuristic or ML model to rate a loadout based on color, and theme
