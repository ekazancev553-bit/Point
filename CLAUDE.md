# Point — Classic Strategy Game

## Project Overview

Point is a classic strategy game. The project is in the early development stage.

## Development Agents

This project includes specialized development agents available as slash commands:

| Command | Agent | Role |
|---------|-------|------|
| `/architect` | Architect | System design, tech stack, project structure |
| `/frontend` | Frontend Developer | UI components, rendering, user interaction |
| `/backend` | Backend Developer | Game logic, APIs, data persistence |
| `/gamedev` | Game Developer | Game mechanics, AI opponent, game loop |
| `/tester` | QA & Testing | Unit, integration, and E2E tests |
| `/reviewer` | Code Reviewer | Code quality, security, performance review |
| `/devops` | DevOps | CI/CD, Docker, build configuration |
| `/documenter` | Documentation | API docs, guides, architecture docs |

## Usage

Run any agent by typing its slash command in Claude Code:
```
/architect — to design the system architecture
/gamedev — to implement game mechanics
/tester — to write tests for existing code
```

## Project Conventions

- Keep game logic separate from rendering
- Write tests for all game rules
- Validate inputs at system boundaries
- Use meaningful commit messages
- Document architectural decisions in `docs/architecture/`
