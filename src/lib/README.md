# lib/ Directory

This directory contains **low-level utilities and abstractions** that support the application's infrastructure. Think of it as the foundation layer that services and hooks build upon.

## Organization Principles

### What belongs in `lib/`
- **Core abstractions**: Wrappers around third-party libraries (e.g., `firestoreOperations.ts`)
- **Type definitions and validation**: Schema definitions, validators (e.g., `validation.ts`)
- **Error handling**: Error types, formatters, handlers (e.g., `errors.ts`, `errors.types.ts`)
- **Path builders**: Functions that construct resource paths (e.g., `firestore.ts`)
- **Infrastructure helpers**: Environment variable access, configuration (e.g., `env.ts`)
- **Low-level managers**: Classes that manage system resources (e.g., `media-stream-manager.ts`, `recording-manager.ts`)

### What belongs in `services/`
- **Business logic**: Operations that implement app features
- **Data layer**: Functions that fetch, create, update, delete data
- **Integration layer**: Functions that coordinate between multiple lib utilities
- **Examples**: `userService.ts`, `storageService.ts`, `paymentsService.ts`

### What belongs in `utils/`
- **Pure helper functions**: No side effects, simple transformations
- **Platform detection**: Browser/device detection utilities
- **Formatting**: Date, currency, string formatters
- **Examples**: `logger.ts`, `platform.ts`, `debounce.ts`, `convertToSubcurrency.ts`

## Current Structure

```
lib/
├── README.md (this file)
├── env.ts                    # Environment variable access helpers
├── errors.ts                 # Error formatting and handling
├── firestore.ts             # Firestore path builders
├── firestoreOperations.ts   # Firestore operation wrappers
├── media-stream-manager.ts  # Media stream lifecycle management
├── recording-manager.ts     # Recording lifecycle management
├── utils.ts                 # General utility functions
└── validation.ts            # Zod schemas and validators
```

## Guidelines for Adding New Files

**Add to `lib/` if:**
- It wraps or abstracts a third-party library
- It defines types or validation rules used across the app
- It manages low-level system resources
- Other parts of the app build on top of it

**Add to `services/` if:**
- It implements business logic or features
- It orchestrates multiple lib utilities
- It directly serves hooks or components

**Add to `utils/` if:**
- It's a pure helper function
- It has no dependencies on app state
- It could be copy-pasted to any project

## Examples

### Good: lib/firestoreOperations.ts
Wraps Firestore SDK to provide consistent error handling across all data operations.

### Good: lib/validation.ts
Defines Zod schemas and validators used throughout services layer.

### Bad: lib/userBusinessLogic.ts
Business logic belongs in `services/userService.ts`.

### Bad: lib/formatCurrency.ts
Pure formatters belong in `utils/`.
