# AI Rules for Dyad Editor

This document outlines the technical stack and specific library usage guidelines for this project. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

*   **React**: The core JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer experience.
*   **Vite**: A fast build tool that provides an instant development server and optimized builds.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
*   **React Router**: For declarative routing within the application.
*   **TanStack Query (React Query)**: For efficient data fetching, caching, and synchronization with server state.
*   **Zod & React Hook Form**: `react-hook-form` for managing form state and validation, paired with `Zod` for schema-based validation.
*   **Lucide React**: A library of beautiful and customizable open-source icons.
*   **Fast XML Parser**: For parsing and building XML content within the application.
*   **JSZip**: For creating, reading, and editing `.zip` files.
*   **Supabase**: An open-source Firebase alternative for backend services, including database and authentication.

## Library Usage Rules

To maintain consistency and leverage the strengths of each library, please follow these guidelines:

*   **UI Components**: Always use components from `shadcn/ui` (e.g., `Button`, `Card`, `Input`, `Select`, `Tabs`, `Table`, `AlertDialog`, `ScrollArea`, `Switch`, `Textarea`). If a required component is not available in `shadcn/ui`, create a new, small component following the existing styling conventions.
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or custom CSS files unless absolutely necessary for global styles in `src/index.css`.
*   **Routing**: Use `react-router-dom` for all navigation and route management. Define routes in `src/App.tsx`.
*   **Server State Management**: For fetching, caching, and updating server data, use **TanStack Query**.
*   **Form Handling**: Implement forms using **React Hook Form** for state management and `Zod` for schema validation.
*   **Icons**: Integrate icons using the `lucide-react` library.
*   **XML Processing**: Utilize `fast-xml-parser` for all XML parsing and building operations.
*   **ZIP File Operations**: Use `jszip` for any functionality involving reading from or writing to `.zip` archives.
*   **Toasts/Notifications**: For displaying transient messages to the user, use the `useToast` hook from `src/hooks/use-toast.ts` (which leverages `@radix-ui/react-toast`). For simple, declarative toasts, `sonner` can be used.
*   **Local Storage**: For persisting application configuration and user preferences locally, use the utility functions provided in `src/utils/localStorage.ts`.
*   **Utility Functions**: For combining CSS classes, use the `cn` utility function from `src/lib/utils.ts`.
*   **Date Manipulation**: For any date formatting or manipulation, use `date-fns`.
*   **Backend Integration**: For interacting with the database, authentication, or other backend services, use the `supabase` client from `src/integrations/supabase/client.ts`.