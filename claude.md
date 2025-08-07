# claude.md — General Coding Standards & Best Practices

This project should follow high-quality, professional coding practices. The assistant should always prioritize clarity, maintainability, and reusability over clever or terse implementations.

## ✅ General Principles

- dont push to git without asking permission first
- Use clean, **modular**, and **reusable** code.
- Avoid duplication. Extract repeated logic into shared functions or components.
- Prefer simplicity over cleverness. Code should be easy to read and understand by others.
- Always consider scalability and future extension — avoid hard-coded values and deeply nested logic.
- Functions should do one thing well. Follow the single-responsibility principle.

---

## 🔒 Code Safety & Maintainability

- All files must use **TypeScript** where applicable.
- All functions must have clear and consistent naming.
- Never use magic numbers or strings — extract constants.
- Avoid deeply nested conditionals — use early returns or helper functions.
- Never repeat the same code in multiple places — refactor shared logic into utilities.
- Add comments only when logic isn’t self-explanatory — prefer self-documenting code.

---

## 🧼 Styling & Formatting

- Use consistent indentation and naming conventions (camelCase for variables/functions, PascalCase for components).
- Do not use inline styles unless necessary; prefer external or scoped styles.
- Follow DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles.
- Use `async/await` over `.then()` chaining unless there's a clear reason not to.

---

## 🧪 Testing & Reliability

- Ensure functions handle edge cases gracefully.
- Validate inputs when needed, especially in shared utility functions or API layers.
- Use clear error messages for any thrown errors.
- Favor defensive programming: don’t assume data will always be valid or present.

---

## ♻️ Reusability & Abstraction

- If two or more components/functions share over 50% of their logic, consider abstraction.
- For shared concerns (e.g., form validation, API calls, error handling), extract to helpers or hooks.
- Avoid prematurely optimizing or abstracting — refactor when duplication emerges.

---

## 🚫 Common Mistakes to Avoid

- Do not hardcode URLs, keys, or environment-specific values. Use environment variables.
- Avoid large, monolithic components or functions — break them up into logical units.
- Never duplicate business logic across client and server — centralize it.
- Don’t rely on side effects in component render functions.
- Avoid unnecessary re-renders in React — memoize where performance is affected.

---

## 📁 File & Project Hygiene

- Organize files by feature or responsibility (not file type).
- Use consistent file naming and keep imports clean.
- Keep components focused — if a file is longer than 200 lines, it may need to be broken up.
- Avoid circular imports or deeply nested relative paths.

---

## ✅ Assistant Behavior

- Always favor clarity and maintainability over compactness or clever tricks.
- Default to writing code that could be understood and maintained by another developer later.
- Prioritize extensibility: the code should be easy to build upon in future iterations.
- Ensure code is production-safe, even during prototyping.