# React + TypeScript + Vite

## Optional AI HR assistant

The authenticated HR assistant supports OpenAI-compatible chat-completions APIs and Anthropic Messages-compatible APIs. Configure credentials on the **backend only**:

- For OpenAI-compatible providers, set `AI_PROVIDER=openai`, `AI_API_KEY`, `AI_API_URL`, and `AI_MODEL`.
- For Anthropic-compatible providers, set `AI_PROVIDER=anthropic`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, and either `ANTHROPIC_AUTH_TOKEN` (sent as a Bearer token) or `ANTHROPIC_API_KEY` (sent as `x-api-key`).

For Docker Compose and an OmniRoute instance running on the Windows host, set `ANTHROPIC_BASE_URL=http://host.docker.internal:20128`; `localhost` inside the backend container refers to that container, not Windows. Set `AI_PROVIDER=anthropic`, `ANTHROPIC_MODEL` to a model OmniRoute recognizes, and `ANTHROPIC_AUTH_TOKEN` to a rotated token in a local `.env` file next to `docker-compose.yml`. Never commit provider credentials or expose them as `VITE_*` variables. For Render, configure the selected provider's credentials as secret environment variables.

Example `.env` values (replace the token locally; do not paste it into chat):

```dotenv
AI_PROVIDER=anthropic
ANTHROPIC_BASE_URL=http://host.docker.internal:20128
ANTHROPIC_MODEL="OmniRoute AI"
ANTHROPIC_AUTH_TOKEN=replace-with-rotated-token
```

The assistant sends the submitted question and limited work context (department, position, and role) to the configured provider. This portal does not persist conversations. Users should not submit sensitive or identifying information. Provider-side data handling depends on the selected provider and account settings. Other AI insight features currently use the OpenAI-compatible configuration.

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
