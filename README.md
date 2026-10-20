<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. Create a free account at [observe.nestjs.com](https://observe.nestjs.com), add an application, and paste the generated app key and secret into the `ObserveModule.forRoot()` call in `src/app.module.ts`.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# reyansha-api

## Authentication and access control

The API uses database-backed, opaque sessions in an `HttpOnly` cookie named
`reyansha_session`. Only a SHA-256 hash of each session or password-reset token
is stored in MongoDB. Passwords are hashed with bcryptjs at cost 12. Cookies
use `SameSite=Lax`, `Secure` in production, and are scoped to `/api/v1`.

### First administrator

Authentication is not enabled for profile-only records until they are
activated. Ensure an existing profile is present for the initial administrator,
then configure `AUTH_BOOTSTRAP_TOKEN` to a unique random value of at least 32
characters. Call the one-time endpoint:

```http
POST /api/v1/auth/bootstrap
X-Bootstrap-Token: <AUTH_BOOTSTRAP_TOKEN>
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "<strong password, at least 12 characters>"
}
```

The email must match an unactivated profile. The endpoint assigns only the
Super Admin role, and a persistent one-time claim prevents later bootstrap
attempts. Keep the bootstrap token out of source control and remove it from the
runtime environment after setup. For an empty database, create the initial
profile through a trusted database provisioning process before bootstrapping;
there is no public signup or public role assignment.

### Session and account endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Sign in with `{ "identifier": "email-or-username", "password": "..." }` |
| `POST` | `/api/v1/auth/logout` | Revoke the current session |
| `GET` | `/api/v1/auth/me` | Return the current profile, roles, and permissions |
| `POST` | `/api/v1/auth/refresh` | Rotate the session cookie and renew its seven-day expiry |
| `POST` | `/api/v1/auth/change-password` | Change a signed-in user's password and revoke all sessions |
| `POST` | `/api/v1/auth/forgot-password` | Send a one-hour reset link when an active account exists |
| `POST` | `/api/v1/auth/reset-password` | Consume a one-time reset or invitation token |
| `POST` | `/api/v1/auth/invite` | Send an activation link for an invited profile; requires `users.create` |
| `POST` | `/api/v1/auth/bootstrap` | One-time initial Super Admin activation |

New users created through `POST /api/v1/users` start as invited and receive the
non-privileged Employee role. Send their activation link with
`POST /api/v1/auth/invite`; they set their own password through the reset
endpoint. Existing records without password hashes cannot sign in.

Configure SMTP and the dashboard's reset route before using invitation or
password recovery:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
PASSWORD_RESET_CONSOLE_OTP=false
PASSWORD_RESET_URL=http://localhost:3001/reset-password
```

For local development, set `PASSWORD_RESET_CONSOLE_OTP=true` to print the
one-time reset token in the API console instead of sending email. The token is
valid for one hour and can be submitted to `POST /api/v1/auth/reset-password`
as `token`, alongside `newPassword`. Console delivery is rejected in
non-development environments. Set the option to `false` to send reset links
through SMTP.

Set `CORS_ORIGINS` to a comma-separated list of exact dashboard origins. The
API enables credentialed CORS for these origins and checks request origins on
state-changing requests. Browser requests must include credentials, for
example `fetch(url, { credentials: 'include' })`. Production deployments must
use HTTPS and set `NODE_ENV=production`.

### Roles and permissions

Roles are seeded once at startup and are separate from the profile's `userType`.
The defaults are explicit:

| Role | Default permissions |
| --- | --- |
| Super Admin | All listed permissions |
| HR | Read, create, update, and deactivate users; update own profile; read roles |
| Tech Lead | Read direct reports; update own profile |
| Employee | Update own profile |
| Admin | Read, create, update, and deactivate users; update own profile |
| Accountant | Update own profile |
| Recruiter | Read direct reports; update own profile |
| Sales | Update own profile |
| Manager | Read direct reports; update own profile |
| QA Lead | Read direct reports; update own profile |
| Third Party | No permissions by default |
| Marketing | Update own profile |
| Support | Read direct reports; update own profile |

`GET /api/v1/users` returns all profiles to `users.read` roles and direct reports
only to `users.read_limited` roles. Only Super Admins can manage Super Admin
profiles. Role management is guarded by `roles.manage`; role assignment uses
`PATCH /api/v1/users/:id/roles`. Profile deactivation uses
`PATCH /api/v1/users/:id/deactivate`. The API enforces permissions server-side;
dashboard navigation visibility is not an authorization control.

### Super Admin password reset

`PATCH /api/v1/users/:id/password` lets a signed-in Super Admin set a user's
temporary password. Swagger can execute this operation using the authenticated
Super Admin session cookie:

```json
{ "password": "a-strong-temporary-password" }
```

Passwords must contain at least 12 characters, be no more than 72 characters,
and fit within 72 UTF-8 bytes (bcrypt's input limit). This endpoint requires
both the `roles.manage` permission and the `super_admin` role. It hashes the
password using the same bcrypt cost-12 configuration as the other password
flows, sets `mustChangePassword`, revokes the target user's active sessions,
and invalidates their outstanding invitation/reset links. The response reports
`mustChangePassword: true` and the number of revoked sessions. Once the user
signs in with the temporary password, the API blocks other protected endpoints
until they change it through `POST /api/v1/auth/change-password`.

Success returns `200` with `message`, `mustChangePassword`, and
`revokedSessions`. Invalid IDs/passwords return `400`, a caller without the
Super Admin role returns `403`, and a missing user returns `404`. The route
requires `roles.manage` and the service verifies the caller also has the
`super_admin` role. The existing password is never returned or needed.

Role, user, and authenticated profile responses never include the password hash.
There is no frontend login implementation in this NestJS repository.
