# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js AI chatbot application built with the AI SDK that provides conversational AI capabilities with artifact generation (code, text, images, sheets). The application uses:

- **Next.js 15** (App Router) with React Server Components
- **AI SDK v5 beta** for LLM integration with xAI Grok-2 as default model
- **Vercel Postgres** with Drizzle ORM for data persistence
- **Next-Auth v5** for authentication
- **Tailwind CSS** + **shadcn/ui** for styling
- **Playwright** for end-to-end testing

## Development Commands

```bash
# Development
./dev-manager.sh start mas-ai-chatbot # Start development server on port 3000 with turbo, don't use pnpm dev.
pnpm build              # Run database migrations and build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run Next.js ESLint + Biome linter with auto-fix
pnpm lint:fix           # Run linters with aggressive fixes
pnpm format             # Format code with Biome

# Database Operations
pnpm db:generate        # Generate Drizzle migrations from schema
pnpm db:migrate         # Run pending migrations
pnpm db:studio          # Open Drizzle Studio for database management
pnpm db:push            # Push schema changes directly to database
pnpm db:pull            # Pull schema from database
pnpm db:check           # Check migration consistency
pnpm db:up              # Apply migrations

# Testing
pnpm test               # Run Playwright tests (sets PLAYWRIGHT=True env var)
```

## Architecture

### Core Structure
- **App Router Layout**: `/app/(auth)/` for authentication, `/app/(chat)/` for main chat interface
- **Server Actions**: Located in `actions.ts` files within route directories
- **Database**: Drizzle ORM with PostgreSQL schema in `lib/db/`
- **AI Integration**: Provider-agnostic AI SDK setup in `lib/ai/`
- **Artifacts**: Modular artifact system in `/artifacts/` (code, text, image, sheet)

### Key Components
- **Chat Interface**: `components/chat.tsx` - Main chat component with real-time streaming
- **Message System**: Uses both deprecated (`Message`) and new (`Message_v2`) tables for backward compatibility
- **Artifact System**: Four artifact types (code, text, image, sheet) with dedicated editors
- **Authentication**: Next-Auth v5 integration with user management
- **Data Streaming**: Custom streaming provider for real-time updates

### Database Schema
- **Users**: Basic user management with email/password
- **Chats**: Chat sessions with visibility controls (public/private)
- **Messages**: Message storage with parts-based structure and attachments
- **Documents**: Artifact storage with versioning support
- **Suggestions**: Collaborative editing suggestions system
- **Votes**: Message voting system for feedback
- **Streams**: Real-time stream management

## Development Guidelines

### Database Migrations
- Always run `pnpm db:migrate` before `pnpm build` (automated in build script)
- Use `pnpm db:generate` after schema changes in `lib/db/schema.ts`
- The build process automatically runs migrations via `tsx lib/db/migrate`

### Code Quality
- Biome handles both linting and formatting with custom rules
- ESLint integration for Next.js-specific rules
- Strict TypeScript configuration with path aliases (`@/*`)

### Testing
- Playwright for e2e testing with separate test projects for `e2e/` and `routes/`
- Tests run against local development server (`pnpm dev`)
- Environment variables loaded from `.env.local`

### Authentication
- Next-Auth v5 beta integration
- User sessions managed through middleware
- Guest mode support via `/api/auth/guest`

### AI Integration
- Provider-agnostic setup supporting multiple LLM providers
- Default model: xAI Grok-2 (`chat-model`)
- Reasoning model available (`chat-model-reasoning`)
- Streaming responses with artifact generation capabilities

## Environment Setup

Required environment variables (see `.env.example`):
- `POSTGRES_URL` - Database connection string
- `AUTH_SECRET` - NextAuth secret
- Model provider API keys (xAI, OpenAI, etc.)

## Common Workflows

### Adding New Artifacts
1. Create server component in `/artifacts/{type}/server.ts`
2. Create client component in `/artifacts/{type}/client.tsx`
3. Update artifact routing in main artifact component
4. Add database migrations if needed

### Database Schema Changes
1. Modify `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Review generated migration in `lib/db/migrations/`
4. Run `pnpm db:migrate` to apply changes

### Testing New Features
1. Write Playwright tests in appropriate `/tests/` subdirectory
2. Use existing page objects in `/tests/pages/`
3. Run `pnpm test` to execute full test suite