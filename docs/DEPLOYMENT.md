# Finova Deployment Guide

## What changed

This repo is now wired for environment-based deployment:

- Frontend API endpoints come from `REACT_APP_API_BASE_URL` and `REACT_APP_AI_BASE_URL`
- Backend port, database settings, JWT secret, and CORS origins come from environment variables
- AI service port and CORS origins come from environment variables
- Dockerfiles exist for all three services
- `docker-compose.yml` can run the full stack locally

## Required environment variables

### Backend

Use `backend/.env.example` as the template.

- `PORT`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `CORS_ALLOWED_ORIGINS`

### Frontend

Use `frontend/.env.example` as the template.

- `REACT_APP_API_BASE_URL`
- `REACT_APP_AI_BASE_URL`

### AI service

Use `ai-service/.env.example` as the template.

- `PORT`
- `AI_HOST`
- `AI_PORT`
- `AI_RELOAD`
- `AI_CORS_ALLOWED_ORIGINS`

## Recommended production setup

### Frontend

Deploy the React app as a static build.

- Build command: `npm install && npm run build`
- Output directory: `build`
- Set `REACT_APP_API_BASE_URL` to your backend URL with `/api`
- Set `REACT_APP_AI_BASE_URL` to your AI service URL

### Backend

Deploy the Spring Boot app as a container or JAR.

- Build command: `mvn clean package -DskipTests`
- Run command: `java -jar target/*.jar`
- Provide a managed MySQL instance
- Set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` in production
- Use a long random `JWT_SECRET`

### AI Service

Deploy the FastAPI app as a container or process.

- Install command: `pip install -r requirements.txt`
- Run command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Docker

Run the full stack locally:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- AI service: `http://localhost:8001`
- MySQL: `localhost:3306`

## Pre-deploy checklist

- Replace all example secrets
- Set production URLs in frontend env vars
- Set exact frontend domain(s) in backend and AI CORS settings
- Use a managed database and verified backups
- Run frontend and backend test/build checks in CI
- Review database migration strategy before setting `validate`
