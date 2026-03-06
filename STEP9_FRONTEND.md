# Step 9: Frontend MVP (Next.js)

This step implements the user-facing web application for the DocVault project using Next.js (App Router), Tailwind CSS, and Redux Toolkit. It consumes the REST APIs built in previous steps.

## Architecture & Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit (with `useAppDispatch` and `useAppSelector` hooks)
- **API Fetching**: Native `fetch` with lightweight wrappers (`src/lib/api.ts`)
- **Authentication**: JWT-based via HttpOnly cookies (`credentials: "include"`)

## Key Features Implemented

### 1. Authentication & Route Protection

- **Login/Register**: `/login` and `/register` pages with forms connected to the backend auth endpoints.
- **Session Restoration**: A global `<SessionRestorer>` component dispatches `fetchMeThunk` on application mount to fetch the authenticated user via `/api/auth/me`.
- **Protected Routes**: A `<ProtectedRoute>` wrapper automatically redirects unauthenticated users to `/login`. Used heavily on `/dashboard` and `/chat`.

### 2. Dashboard

- **Location**: `/dashboard`
- **Upload**: Features an `UploadCard` to upload PDF documents to the backend. Uses `FormData` for multipart file uploads.
- **Documents List**: Displays user documents (`DocumentsList`) with dynamic status badges (`UPLOADED`, `PROCESSING`, `READY`, `FAILED`).
- **Polling**: Polls the `/api/documents` endpoint every 5 seconds to automatically reflect real-time ingestion status updates.
- **Navigation**: Includes a prompt and entry point to start chatting.

### 3. Chat Interface

- **Location**: `/chat`
- **Layout**: A responsive layout with a left sidebar for session management and a main panel for the chat interaction.
- **Sessions Sidebar**: (`SessionsSidebar`) Lists previous chat sessions and allows creating new ones.
- **Document Selection**: (`DocSelector`) A dropdown accessible via the session header allowing users to bind specific "READY" documents to the active session. This updates the session via a `PATCH /api/sessions/:sessionId` call.
- **Chat Thread**: (`ChatThread`) Displays messages chronologically as `MessageBubble` components.
- **Message Input**: (`ChatInput`) Text area that supports sending queries. Features "optimistic UI" updates (appending the user's message immediately before waiting for the backend response).
- **Citations UI**: (`CitationList`) When the AI assistant returns an answer, this component renders the associated sources (filenames, pages, and interactive tooltips for snippets).

## State Management Architecture (Redux slices)

The Redux store is broken down by domain:

- **`authSlice`**: Manages `user` state and handles authentication operations (`loginThunk`, `registerThunk`, `logoutThunk`, `fetchMeThunk`).
- **`documentsSlice`**: Manages the user's uploaded documents and polling functionality (`fetchDocumentsThunk`, `uploadDocumentThunk`, `deleteDocumentThunk`).
- **`sessionsSlice`**: Responsible for chat session storage, tracking `activeSessionId`, and updating bound documents (`fetchSessionsThunk`, `createSessionThunk`, `updateSessionThunk`).
- **`chatSlice`**: Maintains a dictionary of messages mapped by `sessionId` to allow fast access when navigating between sessions (`fetchMessagesThunk`, `sendChatThunk`).

## API Integration Detail

Because the Node.js backend wraps response models (e.g., returning `{ "documents": [...] }` or `{ "user": {...} }`), the API wrappers (`src/lib/*Api.ts`) were designed to unwrap these objects to provide clean models to the Redux thunks.

CORS was successfully configured by passing `credentials: "include"` on all requests and updating the backend's `FRONTEND_ORIGIN` to explicitly target `http://localhost:3000`.
