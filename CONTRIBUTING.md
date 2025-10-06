# Contributing to IRIS

Thank you for your interest in contributing to the Image Recognition Integration System (IRIS)! We welcome bug reports, feature requests, code contributions, documentation improvements, and more. To make the contribution process smooth, please follow these guidelines.

---

## Table of Contents

- [Contributing to IRIS](#contributing-to-iris)
  - [Table of Contents](#table-of-contents)
  - [Reporting Issues](#reporting-issues)
  - [Development Setup](#development-setup)
  - [Coding Standards](#coding-standards)
  - [Branching Model](#branching-model)
  - [Commit Messages](#commit-messages)
  - [Pull Request Process](#pull-request-process)
  - [Testing](#testing)
  - [Documentation](#documentation)
  - [Code of Conduct](#code-of-conduct)

---

## Reporting Issues

1. Check existing [issues](https://github.com/oss-slu/image-recognition-integration-system/issues) to see if your bug or feature has already been reported.
2. If not, open a new issue with a clear title and description.
3. For bugs, include steps to reproduce, expected vs. actual behavior, and any relevant logs or screenshots.
4. For feature requests, outline the use case, proposed behavior, and any mockups or examples.

---

## Development Setup

1. Fork the repository on GitHub.
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/image-recognition-integration-system.git
   cd image-recognition-integration-system
   ```

3. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Run the production build locally:

   ```bash
   npm run build && npm run export
   ```

---

## Coding Standards

- **Language & Framework**: TypeScript, React (Next.js App Router), Capacitor.
- **Formatting**: Use Prettier for code formatting. Run `npm run format` before committing.
- **Linting**: ESLint is configured in the project. Run `npm run lint` to check for issues.
- **Styling**: Tailwind CSS utility classes are used for styling. Follow the existing conventions for class naming.

---

## Branching Model

Use GitHub Flow:

1. Create a new branch for each feature or bugfix:

   ```bash
   git checkout -b feature/<issue-number>-short-description
   ```

2. Make commits to your branch.
3. Push your branch to your fork:

   ```bash
   git push origin feature/<issue-number>-short-description
   ```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- **feat**: a new feature
- **fix**: a bug fix
- **docs**: documentation only changes
- **style**: formatting, missing semicolons, etc; no code changes
- **refactor**: code change that neither fixes a bug nor adds a feature
- **test**: adding missing tests or correcting existing tests
- **chore**: changes to the build process or auxiliary tools

Example:

```
feat(lib): add support for custom image metadata fields
```

---

## Pull Request Process

1. Ensure your branch is up to date with `main`:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Run tests, linting, and formatting:

   ```bash
   npm run lint && npm run format && npm test
   ```

3. Push your changes and open a pull request against the `main` branch of the upstream repository.
4. Fill out the PR template, including:
   - Description of changes
   - Related issue number
   - Screenshots or screencasts (if relevant)
5. Address review feedback and iterate until approval.

---

## Testing

_No automated tests are included yet._ Contributions to add unit tests or end-to-end tests are highly appreciated! When tests are present, run them with:

```bash
npm test
# or
yarn test
```

---

## Documentation

When modifying functionality or adding features, please update the documentation in `README.md`, `CONTRIBUTING.md`, and any page-specific docs. Ensure examples remain accurate.

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you agree to comply with its terms.

```

```
