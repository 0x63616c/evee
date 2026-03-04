# Design Guidelines

<!-- SCOPE: UI/UX conventions, component library, theming. No layout implementation details. -->

## Design Principles

- **Single-user tool** — optimised for Cal's workflow, not general audiences
- **Chat-first** — conversation is the primary interface, channels/threads are navigation
- **Dark mode default** — developer tool, dark is primary
- **Dense but readable** — no excessive whitespace; maximize information density

## Component Library

| Library | Version | Role |
|---------|---------|------|
| shadcn/ui | latest | Component primitives (via radix-ui) |
| radix-ui | ^1 | Headless accessibility primitives |
| assistant-ui | latest | AI chat UI components (messages, typing indicators, tool status) |
| lucide-react | ^0.5 | Icons |
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
AppShell
├── Sidebar (channels list)
│   └── ChannelList → ChannelItem
├── ThreadPanel (threads for selected channel)
│   └── ThreadList → ThreadItem
└── ChatPane (active thread)
    ├── MessageList (assistant-ui Thread component)
    │   └── Message (user | assistant | tool)
    └── MessageInput (assistant-ui Composer component)
```

## Chat Components (assistant-ui)

The chat UI is built with `assistant-ui` primitives:

| Component | Usage |
|-----------|-------|
| `Thread` | Message list with auto-scroll |
| `Composer` | Input box with submit |
| `Message` | Individual message with role-based styling |
| `ToolUI` | Tool call status (pending / completed) |

`useChat` from Vercel AI SDK connects to `POST /api/chat`.

## Colour Palette

Driven by shadcn/ui CSS variables. Key semantic tokens:

| Token | Usage |
|-------|-------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--muted` | Secondary text, borders |
| `--primary` | Accent (buttons, active states) |
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
| `MessageSquare` | Channels/threads |
| `Send` | Submit message |
| `Search` | Search |
| `Settings` | Settings |
| `Moon`/`Sun` | Theme toggle |

## Maintenance

**Update when:** Adding new component patterns, changing theme tokens, updating component library versions.
**Verify:** Component imports match installed packages in `apps/web/package.json`.
