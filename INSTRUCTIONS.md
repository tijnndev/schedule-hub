# Flowcraft - NPM Registry Deployment Instructions

This guide covers publishing Flowcraft to the NPM registry.

## Prerequisites

1. **NPM Account** - Create one at [npmjs.com](https://www.npmjs.com)
2. **Local NPM Login** - Run `npm login` and authenticate with your credentials
3. **Package Readiness** - Ensure `package.json` is properly configured

## Pre-Deployment Checklist

### 1. Verify package.json

The package.json should have:

```json
{
  "name": "flowcraft",
  "version": "1.0.0",
  "description": "A Power Automate-like workflow automation package for Node.js",
  "main": "src/index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/flowcraft"
  },
  "keywords": [
    "workflow",
    "automation",
    "power-automate",
    "nodejs",
    "schedule",
    "cron"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "peerDependencies": {
    "express": "^4.0.0 || ^5.0.0"
  }
}
```

Key points:
- `name` must be unique on NPM (check at npmjs.com before publishing)
- `version` follows semver (major.minor.patch)
- `main` points to entry file
- `peerDependencies` declares express as required

### 2. Create .npmignore

Create `.npmignore` in the project root to exclude unnecessary files:

```
demo/
.git
.gitignore
INSTRUCTIONS.md
node_modules/
*.log
.DS_Store
reports/
```

This keeps the package size small and excludes demo/test files.

### 3. Update README.md

Ensure README.md is comprehensive and up-to-date (already done).

### 4. Add Keywords

Update `package.json` keywords for discoverability:

```json
"keywords": [
  "workflow",
  "automation",
  "power-automate",
  "orchestration",
  "scheduling",
  "cron",
  "nodejs",
  "express"
]
```

## Publishing Steps

### First-Time Publication

1. **Create NPM Account** (if you haven't)
   ```bash
   npm adduser
   # or
   npm login
   ```

2. **Verify Login**
   ```bash
   npm whoami
   ```
   Should display your username.

3. **Publish**
   ```bash
   npm publish
   ```
   
   If the name is taken, either:
   - Choose a different name (e.g., `@yourname/flowcraft` for scoped package)
   - Contact the current owner

4. **Verify**
   Visit https://www.npmjs.com/package/flowcraft to see your package.

### Publishing Updates

When you make changes and want to release a new version:

1. **Update Version in package.json**
   ```bash
   npm version patch    # 1.0.0 → 1.0.1 (bug fixes)
   npm version minor    # 1.0.0 → 1.1.0 (new features, backward compatible)
   npm version major    # 1.0.0 → 2.0.0 (breaking changes)
   ```
   
   Or manually edit `package.json` and commit.

2. **Update CHANGELOG.md** (recommended)
   Document what changed:
   ```markdown
   ## [1.1.0] - 2026-06-17
   
   ### Added
   - Source code display in dashboard
   - URL state preservation for flows
   
   ### Fixed
   - Indentation in function source display
   ```

3. **Publish**
   ```bash
   npm publish
   ```

4. **Create Git Tag** (recommended)
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

## Scoped Packages (Optional)

If you want to publish under a namespace (e.g., `@yourname/flowcraft`):

1. Update `package.json`:
   ```json
   {
     "name": "@yourname/flowcraft",
     "publishConfig": {
       "access": "public"
     }
   }
   ```

2. Publish (same as above - NPM detects the scope)
   ```bash
   npm publish
   ```

3. Users install with:
   ```bash
   npm install @yourname/flowcraft
   ```

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0) - Breaking changes, incompatible API
- **MINOR** (1.1.0) - New features, backward compatible
- **PATCH** (1.0.1) - Bug fixes, no new features

Example progression:
```
1.0.0 (initial release)
  ↓
1.0.1 (bug fix)
  ↓
1.1.0 (new features like source code display)
  ↓
2.0.0 (breaking change, e.g., API restructure)
```

## Managing NPM Token

For CI/CD pipelines:

1. **Create Token** on npmjs.com (Settings > Tokens)
2. **Store Securely** in environment variable `NPM_TOKEN`
3. **Use in .npmrc**:
   ```
   //registry.npmjs.org/:_authToken=${NPM_TOKEN}
   ```

## Testing Before Publish

### Local Testing

1. Create a test directory outside the project:
   ```bash
   mkdir flowcraft-test && cd flowcraft-test
   npm init -y
   npm install ../powerautomate-package
   ```

2. Create test file:
   ```js
   const { Flowcraft } = require('flowcraft');
   console.log('Flowcraft loaded:', typeof Flowcraft);
   ```

3. Run test:
   ```bash
   node test.js
   ```

### Dry Run

Before publishing, do a dry run:
```bash
npm publish --dry-run
```

This shows what would be published without actually publishing.

## Troubleshooting

### "You do not have permission to publish"
- Ensure you're logged in: `npm login`
- Verify the package name isn't taken
- Check if you're trying to publish a scoped package without `"publishConfig": { "access": "public" }`

### "Package name already taken"
- Choose a different name
- Use a scoped package: `@yourname/flowcraft`
- Contact the current owner to take over

### "auth error: Code E401"
- Credentials expired, re-login: `npm login`
- Check your token: `npm config get registry`

### Large Package Size
- Ensure `.npmignore` excludes `demo/`, `node_modules/`, reports
- Check what's included: `npm pack`
- Untar to inspect: `tar -tzf flowcraft-1.0.0.tgz | head -20`

## Post-Publication

1. **Update GitHub README** with NPM badge:
   ```markdown
   [![npm version](https://badge.fury.io/js/flowcraft.svg)](https://npmjs.com/package/flowcraft)
   ```

2. **Announce** on your channels (Twitter, blog, dev.to, etc.)

3. **Monitor** for issues:
   - Check NPM page for user questions
   - Monitor GitHub issues

4. **Maintain** - Keep dependencies updated:
   ```bash
   npm outdated
   npm update
   ```

## Unpublishing (if needed)

To unpublish a published version:

```bash
npm unpublish flowcraft@1.0.0 --force
```

Note: NPM allows unpublishing only within 72 hours of publication. After that, you must publish a new version instead (e.g., 1.0.1 with a deprecation notice).

To deprecate a version without unpublishing:
```bash
npm deprecate flowcraft@1.0.0 "Use flowcraft@1.0.1 instead"
```

## Next Steps

1. Ensure all tests pass locally
2. Update version in `package.json`
3. Run `npm publish --dry-run`
4. Run `npm publish`
5. Verify on [npmjs.com](https://www.npmjs.com/package/flowcraft)
6. Update documentation with the new version

Happy publishing!
