# Design Guidelines

<!-- SCOPE: UI/UX conventions, component library, theming. No layout implementation details. -->

## Design Principles

- **Single-user tool** -- optimised for Cal's workflow, not general audiences
- **Chat-first** -- conversation is the primary interface, channels/threads are navigation
- **Dark mode default** -- developer tool, dark is primary
- **Dense but readable** -- no excessive whitespace; maximize information density

## Component Library

| Library | Version | Role |
|---------|---------|------|
| shadcn/ui | latest | Component primitives (via radix-ui) |
| radix-ui | ^1 | Headless accessibility primitives |
| @assistant-ui/react | ^0.12 | AI chat UI primitives (Thread, Composer, Message) |
| @assistant-ui/react-ai-sdk | ^1.3 | AI SDK transport adapter |
| @assistant-ui/react-markdown | ^0.12 | Markdown rendering in messages |
| lucide-react | ^0.575 | Icons |
| geist | ^1.7 | Font family (Geist Sans + Mono) |
| sonner | ^2 | Toast notifications |
| next-themes | ^0.4 | Dark/light theme management |

## Theming

- **Framework**: Tailwind v4 CSS variables
- **Default**: Dark mode (`dark` class on `<html>`)
- **Toggle**: via `next-themes` `ThemeProvider`
- **Font**: Geist Sans for UI text, Geist Mono for code/IDs

## Layout Structure

```
AppShell (_authenticated/dashboard.tsx)
+-- Sidebar (sidebar.tsx)
|   +-- Channel icons (left strip, 56px)
|   +-- Thread list (186px panel)
+-- ChatPane (chat.tsx)
    +-- Thread header (thread name)
    +-- MessageList (ThreadPrimitive.Viewport)
    |   +-- UserMessage (right-aligned, primary bg)
    |   +-- AssistantMessage (left-aligned, muted bg, markdown)
    +-- Composer (ComposerPrimitive.Root)
```

## Chat Components (assistant-ui)

The chat UI is built with `assistant-ui` primitives:

| Component | Usage |
|-----------|-------|
| `ThreadPrimitive.Root` | Message list container with auto-scroll |
| `ComposerPrimitive.Root` | Input box with submit button |
| `MessagePrimitive.Content` | Individual message with role-based styling |
| `MarkdownTextPrimitive` | Markdown rendering for assistant messages |
| `SearchWebUI` / `FetchUrlUI` | Tool call status (via `makeAssistantToolUI`) |

`useChatRuntime` from `@assistant-ui/react-ai-sdk` connects to `POST /api/chat` via `AssistantChatTransport`.

## Colour Palette

Driven by shadcn/ui CSS variables. Key semantic tokens:

| Token | Usage |
|-------|-------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--muted` | Secondary text, borders |
| `--primary` | Accent (buttons, active states, user messages) |
| `--destructive` | Error states |
| `--card` | Panel backgrounds |

## Form Conventions

- All forms use shadcn/ui `Input`, `Label`, `Button` components
- Validation errors displayed inline below field
- Submission state shown via button loading state (`disabled` + spinner)
- Toast notifications (sonner) for async success/error feedback

## Icons

Use `lucide-react` exclusively. Common icons:

| Icon | Usage |
|------|-------|
| `Hash` | Channel icons |
| `MessageSquare` | Thread items |
| `LogOut` | Sign out button |

## Maintenance

**Update when:** Adding new component patterns, changing theme tokens, updating component library versions.
**Verify:** Component imports match installed packages in `apps/web/package.json`.
