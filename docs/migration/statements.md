# Statements: JSP to Vue migration

Strangler-fig step for `/statements`. The AppConfig flag `statements.v2` decides which implementation the root config mounts:

| Flag | `/statements` shows                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------- |
| off  | The legacy JSP (`legacy/`, Tomcat 10) inside an iframe parcel (`apps/root-config/src/legacy-parcel.ts`) |
| on   | `@bank/statements`, the Vue 3 MFE (`apps/mfe-statements`)                                               |

Rollback is flipping the flag back. No deploy is needed in either direction.

## Business rules extracted from the JSP

| #   | Legacy rule (`StatementService`, `statements.jsp`)                                       | Decision     | In the Vue version                                                     |
| --- | ---------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| 1   | Lines are the account's transactions for one calendar month, oldest first                | **Kept**     | Same order, same filter                                                |
| 2   | Opening balance = seed opening balance + all transactions before the month               | **Kept**     | Computed by the BFF (`GET /api/statements/:accountId/:yyyymm`)         |
| 3   | Running balance after every line; closing = opening + credits − debits                   | **Kept**     | Same totals (verified in Playwright against the JSP output)            |
| 4   | Summary row with four totals: opening, debits, credits, closing                          | **Kept**     | Totals cards with `data-total` hooks                                   |
| 5   | Fixed page size of 10 and prev/next links only                                           | **Improved** | `BkPagination` (10/25/50, page numbers, keyboard, `?page=&size=`)      |
| 6   | Dates rendered in the Japanese era calendar (令和8年11月3日) regardless of user language | **Improved** | `Intl.DateTimeFormat` follows the chosen language (EN/JA)              |
| 7   | Debits prefixed with `▲` and no colour                                                   | **Improved** | Debit/credit columns with positive/negative tones in `BkMoney`         |
| 8   | Amounts rounded with `Math.round`                                                        | **Removed**  | JPY has no minor unit; amounts are integers, so the rule has no effect |
| 9   | Session check by cookie presence only                                                    | **Removed**  | The BFF verifies the signed HttpOnly session cookie on every request   |
| 10  | Page and style fully server-rendered, Japanese only                                      | **Removed**  | Client rendered with the shared EN/JA catalogs                         |

## How the migration was verified

- `legacy/src/test/.../StatementServletTest.java` checks the servlet's totals.
- `e2e/tests/2-statements-v2.spec.ts` fetches the JSP HTML, reads its `data-total` cells and asserts the Vue page shows the same four numbers.
