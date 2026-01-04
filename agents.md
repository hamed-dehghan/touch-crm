# Agents.md

This document defines the conventions, best practices, and guidelines for AI agents (and developers) when contributing to this Node.js + React project.

---

## 📦 Project Structure

* **Backend (Node.js/Express/Typescript)**

  * `src/` contains all backend code.

    * `controllers/` → Business logic.
    * `models/` → Database models (Sequelize).
    * `routes/` → API route definitions.
    * `middlewares/` → Reusable middleware.
    * `migrations/` → Database migrations (Sequelize).
    * `seeders/` → Database seeders (Sequelize).
    * `utils/` → Helper functions.
  * Use **index.js** only for bootstrapping the app.

* **Frontend (React + Typescript + Vite)**

  * `src/` contains all frontend code.

    * `components/` → UI components.
    * `pages/` → Page-level components.
    * `hooks/` → Reusable React hooks.
    * `store/` → State management (Zustand).
    * `context/` → React context providers.
    * `services/` → API calls via Axios.
    * `utils/` → Client-side helpers.
    * `assets/` → Images, fonts, static files.

---

## 📦 Package Manager

* Use **Bun** as the package manager across the repository.
* Prefer `bun install` for dependencies and `bun run <script>` for scripts.
* Use `bun test` to run tests, or `bun run test` if defined in `package.json`.
* Backend runtime remains **Node.js**; Bun is used for package management and scripts.

---

## 📝 Coding Standards

* **JavaScript/TypeScript**

  * Prefer **TypeScript** when possible.
  * Use ES Modules (`import/export`).
  * Use **async/await** instead of `.then()`.
  * Keep functions **pure** and **single-responsibility**.

* **React**

  * Use **functional components + hooks**.
  * Manage state with **Zustand** where global state is needed.
  * Validate forms with **Yup**.
  * Co-locate component styles and tests with the component.
  * Use **TailwindCSS** and **shadcn/ui** for styling and UI consistency.

* **Node.js (Express)**

  * Use **Sequelize** for database access.
  * Validate inputs with **Yup**.
  * Handle errors with centralized middleware.

---

## ⚡ API Conventions

* **RESTful principles**.
* Use plural nouns for resources (`/users`, `/posts`).
* Use proper HTTP status codes:

  * `200` OK, `201` Created, `204` No Content.
  * `400` Bad Request, `401` Unauthorized, `403` Forbidden.
  * `404` Not Found, `500` Internal Server Error.
* Use JWT for authentication.
* Version APIs (`/api/v1/...`).
* **API Documentation with Swagger/OpenAPI**:

  * Implement Swagger UI for interactive API documentation (typically at `/api-docs`).
  * Use **swagger-jsdoc** or **@nestjs/swagger** (if using NestJS).
  * Document all endpoints with:
    * Request/response schemas.
    * Authentication requirements.
    * Example requests/responses.
    * Error codes and messages.
  * Keep Swagger documentation in sync with actual API implementation.

---

## 🗂️ State Management (Frontend)

* Use **Zustand** for global state.
* Use **React Query** patterns only when necessary (but prefer Axios service layer + Zustand).
* Keep API interactions isolated in `services/`.

---

## 🔒 Security Best Practices

* Never commit `.env` or secrets.
* Sanitize and validate all inputs with Yup.
* Use HTTPS in production.
* Implement CORS properly.
* Use helmet middleware in Express.


## 🚀 Deployment & DevOps

* Use **Docker Compose** for simplified container orchestration:

  * Node.js backend (with Dockerfile)
  * React frontend (with Dockerfile)
  * **Nginx** as web server (reverse proxy for backend, serves frontend static files)
  * PostgreSQL
  * Redis
* Maintain **Dockerfiles** for backend and frontend:

  * Update Dockerfiles whenever dependencies or build steps change.
  * Use multi-stage builds for optimized images.
  * Keep images lightweight (use Alpine variants when possible).
* Use **Nginx** for:

  * Serving production frontend builds.
  * Reverse proxying API requests to backend.
* Configure **CI/CD** (GitHub Actions, GitLab CI, etc.).
* Use environment variables for config.
* Maintain staging and production environments.

---

## 🧑‍💻 Agent Guidelines for Cursor

* Follow the folder structure strictly.
* Suggest modular, reusable code.
* Ensure consistent **naming conventions** (camelCase for functions/variables, PascalCase for components/classes).
* Always add **comments** for non-trivial logic.
* Propose **refactoring** if code is duplicated or too complex.
* Always check for **error handling** and **edge cases**.
* Use **Axios** for API calls, **Zustand** for state, **Yup** for validation, **Sequelize** for database.
* **Update Dockerfiles** whenever making changes that affect:
  * Dependencies (package.json changes).
  * Build processes or scripts.
  * Environment variables or configuration.
  * Port mappings or exposed services.
* Ensure **docker-compose.yml** is updated when adding new services or changing service configurations.
* **Update Swagger/OpenAPI documentation** whenever:
  * Adding, modifying, or removing API endpoints.
  * Changing request/response schemas.
  * Modifying query parameters, path parameters, or request bodies.
  * Updating authentication or authorization requirements.
  * Changing API error responses or status codes.

---

## ✅ Checklist Before Commit

* [ ] Code is linted (ESLint + Prettier).
* [ ] No secrets in code.
* [ ] Tests are passing.
* [ ] Types are correct (if using TS).
* [ ] Logs are meaningful (no `console.log` in production).
* [ ] Dockerfiles and docker-compose.yml are updated (if applicable).
* [ ] Swagger/OpenAPI documentation is updated (if API changes were made).
* [ ] Code reviewed and approved.

---

## 📚 References

* [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
* [React Docs](https://react.dev/)
* [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
* [Axios](https://axios-http.com/)
* [Yup](https://github.com/jquense/yup)
* [Sequelize](https://sequelize.org/)
* [Swagger/OpenAPI](https://swagger.io/specification/)
* [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
* [shadcn/ui](https://ui.shadcn.com/)
* [TailwindCSS](https://tailwindcss.com/)
* [OWASP Security Guidelines](https://owasp.org/)
