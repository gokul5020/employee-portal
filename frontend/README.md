# React + TypeScript + Vite

## Optional AI HR assistant

The authenticated HR assistant is backed by an optional OpenAI-compatible chat-completions API. Configure these variables on the **backend only**:

- `AI_API_KEY`: provider API key. Leave unset to disable the assistant.
- `AI_API_URL`: chat-completions endpoint (defaults to OpenAI; can be pointed at another compatible provider).
- `AI_MODEL`: model name (defaults to `gpt-4o-mini`).

For Docker Compose, put the variables in a local `.env` file next to `docker-compose.yml`; do not commit provider keys or expose them as `VITE_*` variables. For Render, add `AI_API_KEY` as a secret environment variable.

The assistant sends only the submitted question to the configured provider. It does not send account data or chat history, and this portal does not persist conversations. Users should not submit sensitive or identifying information. Provider-side data handling depends on the selected provider and account settings.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
