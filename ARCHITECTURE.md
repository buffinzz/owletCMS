# Owlet CMS Architecture 🦉

This document provides an overview of the planned architecture for Owlet.

The goal is to create a system that is:

* modular
* extensible
* easy to understand
* easy to deploy

---

# Core Components

Owlet consists of three primary components:

1. Backend API
2. Frontend Admin Interface
3. Database

---

# Backend

The backend is built with NestJS.

Responsibilities:

* API endpoints
* authentication
* business logic
* plugin system
* email notifications
* form processing

Example modules:

auth
content
events
media
forms
relationships

---

# Frontend

The frontend admin interface is built with:

* React
* Vite
* TypeScript

Responsibilities:

* content editing
* event management
* media uploads
* form configuration
* plugin interfaces

The frontend communicates with the backend via REST APIs.

---

# Database

Owlet uses PostgreSQL.

Primary entities may include:

Users
Content
Events
Media
Forms
Submissions
Collections

Future versions will support relationship mapping between entities to create connected knowledge structures.

---

# Plugin System (Future)

Owlet will support plugins that extend the platform without modifying the core system.

Plugins may add:

* new API routes
* admin panels
* new content types
* additional integrations

Example plugin structure:

plugin.json
backend module
frontend panel

---

# Deployment

Owlet will support containerized deployment using Docker.

Typical deployment stack:

Owlet API
PostgreSQL
Frontend

This allows institutions to deploy the system with minimal infrastructure.

---

# Design Goals

The architecture emphasizes:

* clarity over complexity
* long-term maintainability
* accessibility
* extensibility through plugins

Owlet should remain understandable even to new contributors exploring the codebase for the first time.
