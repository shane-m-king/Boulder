# Boulder – Game Tracking & Review Hub

**Boulder** is a full-stack web application where gamers can browse, track, and review video games.  
Built with **Next.js 14**, **TypeScript**, **TailwindCSS**, **MongoDB**, and **JWT authentication**, Boulder lets users manage personal game libraries, write reviews, and explore titles from a centralized database — all in a sleek, responsive interface.

This version of Boulder is a submission to Springboard Software Engineering Bootcamp, and will be updated prior to public launch after more version updates.

---

## Features

- 🔐 **Secure Auth** – Register, login, logout, and access protected routes via JWT cookies
- 🎮 **Game Browsing** – Paginated, searchable, and filterable by genre or platform
- 🧾 **Game Details** – View full game info with genres, platforms, and user reviews
- 📚 **Personal Library** – Add or remove games, set statuses (`Owned`, `Wishlisted`, `Not Owned`), and add notes
- 👤 **User Profiles** – Public profile pages showing bio and library previews
- ⭐ **Reviews** – Create, edit, and view reviews (0 – 10 rating)
- ⚡ **UX Polish** – Framer Motion animations, Tailwind shimmer skeletons, and responsive dark theme

---

## Tech Stack

| Layer             | Technologies                                                                     |
| ----------------- | -------------------------------------------------------------------------------- |
| **Frontend**      | Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion, React Hot Toast |
| **Backend / API** | Next.js API Routes, Mongoose, MongoDB Atlas, JWT Auth                            |
| **Utilities**     | `apiRequest`, `verifyUser`, `toastAction`, `invalidId`                           |
| **Testing / Dev** | Jest / Supertest, ESLint, Prettier                                               |

---

## Core Models

| Model        | Description                                          |
| ------------ | ---------------------------------------------------- |
| **User**     | username, email, password, bio                       |
| **Game**     | title, summary, genres, platforms, release date      |
| **UserGame** | user-specific status & notes                         |
| **Review**   | linked to both user & game, includes rating (0 – 10) |
