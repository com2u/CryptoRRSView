# RSS Viewer - Development Task List

## Checklist

- [ ] Analyze requirements  
- [ ] Set up project structure (frontend + backend)  
- [ ] Create `.env` and `.env.example` files (with dummy credentials in example)  
- [ ] Backend:  
  - [ ] Initialize Node.js + Express server  
  - [ ] Configure PostgreSQL connection using environment variables  
  - [ ] Create API routes:  
    - [ ] `/api/news` with pagination & sorting  
    - [ ] `/api/sources` to fetch all unique sources  
  - [ ] Implement filtering: by published timestamp & by sources (multi-select)  
  - [ ] Add lazy loading support (via pagination / infinite scroll)  
  - [ ] Add logging & error handling  
- [ ] Frontend (React + TypeScript + TailwindCSS):  
  - [ ] Bootstrap project with Vite or Create React App  
  - [ ] Create main layout with top navigation (Menu: Viewer, Analyze, Graph)  
  - [ ] Implement `Viewer` page to show:  
    - [ ] Paginated/lazy-loaded RSS feed  
    - [ ] Filters by source (multiselect)  
    - [ ] Sort by published timestamp  
  - [ ] Stub "Analyze" and "Graph" pages (placeholders)  
- [ ] Dockerize  
  - [ ] Create Dockerfile for backend  
  - [ ] Create Dockerfile for frontend  
  - [ ] Create `docker-compose.yml` with database, backend, and frontend services  
- [ ] Testing  
  - [ ] Verify API connects to PostgreSQL and returns correct data  
  - [ ] Test React app rendering, filtering, and lazy loading  
- [ ] Documentation  
  - [ ] Add `README.md` with project setup, run, and deployment instructions  
  - [ ] Explain `.env` configuration  
  - [ ] Include architecture overview
