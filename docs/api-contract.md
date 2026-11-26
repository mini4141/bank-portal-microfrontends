# API contract (BFF)

Agreed between the front-end and the (mock) back-end. The machine-readable version is [`openapi.yaml`](openapi.yaml). The typed client lives in `packages/utility/src/api.ts` (types `Account`, `Transaction`, `Payee`, `Statement`, `Page<T>`).

## Conventions

- Base path `/api`, JSON only, same origin as the portal (CloudFront routes `/api/*` to the BFF), so no CORS is needed.
- Auth: `POST /api/session` sets an **HttpOnly, SameSite=Lax, signed** cookie `bk_session` (plus `Secure` behind HTTPS). The front end never sees a token. Everything except `/healthz`, `/api/session` and `/api/flags` returns `401 {"error":"unauthorized"}` without it.
- Errors: `{ "error": "<snake_case_code>" }` with a matching HTTP status (`400 invalid_request`, `401`, `404 not_found`, `422 insufficient_funds`).
- Money: integer JPY amounts, formatted on the client with `Intl`.
- Dates: ISO `yyyy-mm-dd`, months as `yyyymm` in statement URLs.
- Pagination standard: `?page=<n>&size=<n>` in, `{ items, page, size, total, totalPages }` out. Size is capped at 100; the UI offers 10 / 25 / 50.
- Responses are `Cache-Control: no-store`.

## Endpoints

| Method and path                                          | Purpose                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `POST /api/session`                                      | Log in (`{username, password}`), returns the customer                 |
| `DELETE /api/session`                                    | Log out                                                               |
| `GET /api/me`                                            | Current customer                                                      |
| `GET /api/accounts`, `GET /api/accounts/:id`             | Accounts with live balance                                            |
| `GET /api/payees`                                        | Transfer payees                                                       |
| `GET /api/transactions?accountId&page&size&from&to&type` | Paginated, filtered, newest first                                     |
| `POST /api/transfers`                                    | `{fromAccountId, payeeId, amount, memo}`, `201` with the new balance  |
| `GET /api/statements/:accountId/:yyyymm?page&size`       | Monthly statement with totals                                         |
| `GET /api/flags`                                         | `{ "statements.v2": boolean }` from AWS AppConfig (local JSON in dev) |
| `PUT /api/flags/:name`                                   | Local only; `403` when AppConfig owns the flags                       |
| `GET /healthz`                                           | Liveness                                                              |

The legacy JSP app additionally serves `GET /legacy/statements?account=&month=&page=`.
