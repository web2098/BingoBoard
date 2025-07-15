# GitHub Workflows

This repository contains two GitHub Actions workflows to automate CI/CD processes:

## 🔍 PR Validation Workflow (`pr-validation.yml`)

**Trigger:** When a Pull Request is created or updated targeting `main` or `react` branches

**What it does:**
- **Multi-Node Testing:** Tests the application on Node.js 18.x and 20.x
- **Dependency Installation:** Uses `npm ci` for fast, reliable builds
- **Code Quality Checks:**
  - Linting (if `npm run lint` script exists)
  - Type checking (if `npm run type-check` script exists)
  - Unit tests with coverage reporting
- **Build Validation:** Ensures the application builds successfully
- **Performance Audit:** Runs Lighthouse audit on non-draft PRs
- **Artifact Storage:** Uploads build files and test coverage for review

**Artifacts Generated:**
- Build files (retained for 7 days)
- Test coverage reports (uploaded to Codecov)
- Lighthouse performance report

## 🚀 Deploy Workflow (`deploy.yml`)

**Trigger:** When changes are pushed to the `main` branch

**What it does:**
- **Production Build:** Creates an optimized production build
- **Testing:** Runs full test suite before deployment
- **GitHub Pages Deployment:** Deploys to GitHub Pages using the configured homepage
- **Health Checks:** Verifies the deployment is accessible
- **Deployment Summary:** Provides detailed deployment information

**Features:**
- Uses the existing `homepage` configuration in `package.json`
- Treats warnings as warnings (not errors) during build
- Creates orphaned commits for clean deployment history
- Post-deployment health verification

## 🛠️ Setup Requirements

### For PR Validation:
- No additional setup required
- Optional: Add `lint` and `type-check` scripts to `package.json`

### For Deployment:
- GitHub Pages must be enabled in repository settings
- Set source to "GitHub Actions" in Pages settings
- The `homepage` field in `package.json` is already configured correctly

### Optional Enhancements:

1. **Add linting script** to `package.json`:
   ```json
   "scripts": {
     "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
     "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix"
   }
   ```

2. **Add type checking script** to `package.json`:
   ```json
   "scripts": {
     "type-check": "tsc --noEmit"
   }
   ```

3. **Custom Domain:** Add your domain to the `cname` field in `deploy.yml`

## 📊 Status Badges

Add these badges to your main README.md:

```markdown
![PR Validation](https://github.com/web2098/BingoBoard/workflows/PR%20Validation/badge.svg)
![Deploy Status](https://github.com/web2098/BingoBoard/workflows/Deploy%20to%20Production/badge.svg)
```

## 🔧 Workflow Customization

### Skipping Workflows
Both workflows ignore changes to:
- Documentation files (`**.md`)
- `LICENSE` file
- `.gitignore` file

The deploy workflow additionally ignores `.github/**` changes.

### Node.js Versions
The PR validation tests against Node.js 18.x and 20.x. Update the matrix in `pr-validation.yml` if you need different versions.

### Deployment Target
Currently configured for GitHub Pages. To deploy elsewhere:
1. Replace the "Deploy to GitHub Pages" step
2. Update the health check URL
3. Modify environment variables as needed

## 🐛 Troubleshooting

**Build Failures:**
- Check the Node.js version compatibility
- Ensure all dependencies are properly declared
- Verify environment variables are set correctly

**Deployment Issues:**
- Confirm GitHub Pages is enabled
- Check that the `homepage` URL matches your repository
- Verify the build artifacts are generated correctly

**Test Failures:**
- Review test output in the workflow logs
- Ensure tests can run in CI environment (no external dependencies)
- Check for any required test setup or configuration files
