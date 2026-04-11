# Point — Точки (Dots) Strategy Game

## Project Overview

Point is a classic strategy game "Точки" (Dots) built with TypeScript, HTML5 Canvas, and Vite. Target platform: Google Play Market via Capacitor.

## Tech Stack

- **Language**: TypeScript
- **Build**: Vite
- **Rendering**: HTML5 Canvas 2D
- **Tests**: Vitest
- **Android**: Capacitor 6
- **Online**: Socket.IO (planned)

## Architecture

```
src/
  engine/    — Pure game logic (Board, CaptureDetector, GameController, History)
  ai/        — AI opponents (Easy, Medium, Hard with minimax)
  ui/        — Canvas renderer, screens, components
  online/    — WebSocket client (planned)
  audio/     — Sound and haptics (planned)
  storage/   — LocalStorage persistence (planned)
  utils/     — EventBus, InputHandler
```

## Development Agents

| Command | Agent | Role |
|---------|-------|------|
| `/architect` | Architect | System design, tech stack, project structure |
| `/designer` | Designer | UI/UX design, visual design, branding |
| `/frontend` | Frontend Developer | UI components, rendering, user interaction |
| `/backend` | Backend Developer | Game logic, APIs, data persistence |
| `/gamedev` | Game Developer | Game mechanics, AI opponent, game loop |
| `/tester` | QA & Testing | Unit, integration, and E2E tests |
| `/reviewer` | Code Reviewer | Code quality, security, performance review |
| `/devops` | DevOps | CI/CD, Docker, build configuration |
| `/documenter` | Documentation | API docs, guides, architecture docs |

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run tests
npm run lint       # Lint code
```

## Project Conventions

- Keep game logic separate from rendering (`engine/` has NO DOM dependencies)
- Write tests for all game rules
- Validate inputs at system boundaries
- Use meaningful commit messages
- Document architectural decisions in `docs/architecture/`
