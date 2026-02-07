# GitHub Claude Configuration

This file contains instructions for Claude when working on GitHub issues and pull requests.

## General Instructions

You are helping maintain the GTLint project on GitHub. Follow all instructions from the root `/CLAUDE.md` file, especially the "Post-Change Checklist" section.

## Workflow

When working on GitHub issues:

1. **Create a feature branch** - Create a new branch for your work (e.g., `claude/fix-issue-123`)
2. **Complete the work** - Make all necessary changes to resolve the issue
3. **Follow the Post-Change Checklist** (from `/CLAUDE.md`):
   - Update documentation (`/CLAUDE.md`, `/LANGUAGE_SPEC.md`, `/README.md`) as needed
   - Bump version numbers in both `package.json` files according to semver
   - Rebuild the VSCode extension with `cd vscode-extension && pnpm run package`
4. **Report completion** - In your response, explicitly state that you've completed the Post-Change Checklist with a section like:
   ```
   ✅ Post-Change Checklist Complete:
   - [x] Documentation updated (or "No documentation changes needed")
   - [x] Version bumped to X.Y.Z (patch/minor/major)
   - [x] VSCode extension rebuilt
   ```
5. **Commit your changes** - Create commits following git best practices
6. **Push the branch** - Push to the remote repository
7. **Wait for user instruction** - Report that work is complete and awaiting further instruction

## Pull Request Creation and Merging

**IMPORTANT**: You can create and merge pull requests, but ONLY when explicitly requested by the user.

### When the user asks you to create a PR:
- Create a pull request from your feature branch to `main`
- Include a clear title and description summarizing the changes
- Reference the original issue number
- List all changes from the Post-Change Checklist in the PR description

### When the user asks you to merge a PR:
- Verify that all checks have passed (if any are configured)
- Use the "Squash and merge" strategy by default
- Delete the feature branch after merging
- Confirm completion to the user

### Example user requests you should respond to:
- "Create a PR for this work"
- "Go ahead and create and merge the PR"
- "Merge this into main"
- "Open a pull request"

**Never create or merge PRs without explicit user instruction**, even if the work is complete. Always wait for the user to request these actions.

## Reporting

When you complete work on an issue, provide a summary that includes:

1. **What was changed** - Brief description of modifications
2. **Post-Change Checklist status** - Explicitly confirm completion
3. **Branch information** - Name of the feature branch
4. **Next steps** - What the user can do next (e.g., "You can now ask me to create a PR and merge it to main")

Example completion report:

```
✅ Work Complete

Changes:
- Fixed the indentation bug in the lexer
- Added test coverage for edge cases

✅ Post-Change Checklist:
- [x] Documentation updated in README.md
- [x] Version bumped to 0.5.3 (patch - bug fix)
- [x] VSCode extension rebuilt

Branch: claude/fix-indentation-bug-42
Commits: 2 commits pushed to remote

Next steps: You can ask me to create a PR and merge it to main, or review the changes first.
```

## Additional Notes

- **Version bumping guidelines** (from root CLAUDE.md):
  - **Patch** (0.1.0 → 0.1.1): Bug fixes, minor improvements
  - **Minor** (0.1.0 → 0.2.0): New features, new rules, new directives
  - **Major** (0.1.0 → 1.0.0): Breaking changes, major rewrites

- **Testing**: Run `pnpm test` before committing to ensure all tests pass

- **Communication**: Be clear and concise in your reports. The user should be able to quickly understand what was done and what actions are available.
