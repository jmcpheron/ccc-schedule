# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within CCC Schedule, please send an email to the project maintainers. All security vulnerabilities will be promptly addressed.

Please do not create public GitHub issues for security vulnerabilities.

### What to include in your report:

- Type of issue (e.g., XSS, data exposure, authentication bypass)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices

When deploying CCC Schedule:

1. **Data Privacy**: Ensure no sensitive student or instructor data is exposed
2. **HTTPS**: Always use HTTPS in production
3. **Content Security Policy**: Implement appropriate CSP headers
4. **Input Validation**: Validate all data files before deployment
5. **Access Control**: Restrict access to data files if needed