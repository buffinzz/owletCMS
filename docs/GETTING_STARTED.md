# 🦉 Owlet CMS

**Owlet CMS** is an open-source, flexible, and developer-friendly Content Management System (CMS) designed for community-driven projects and digital knowledge bases. Built with a modern, scalable stack, Owlet focuses on simplicity, speed, and ease of use.

---

## 🛠️ Technology Stack

Owlet CMS is built using a robust, modern technology stack:

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Fast, modern UI)
- **Backend:** [NestJS](https://nestjs.com/) (Scalable Node.js framework)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Reliable relational data)
- **Containerization:** [Docker](https://www.docker.com/) (Consistent environments)

---

## 🚀 Getting Started

Follow these steps to get a local instance of Owlet CMS running on your machine for testing or demoing.

### 📋 Prerequisites
Ensure you have the following installed:
* **Node.js** (v18 or higher)
* **Docker & Docker Compose**
* **Git**

### 1. Clone the Repository
```bash
git clone [https://github.com/buffinzz/owletCMS.git](https://github.com/buffinzz/owletCMS.git)
cd owletCMS
```


### 2. Start the Database

Owlet uses PostgreSQL. We use Docker to run the database in a container so you don't have to install it manually.
```bash
docker compose up -d
```

### 3. Setup the Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```
_The API will be running at http://localhost:3000._

### 4. Setup the Frontend (React)

Open a new terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
_Open your browser to the URL shown in your terminal (usually http://localhost:5173)._