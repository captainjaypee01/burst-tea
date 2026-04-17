# Tester agent — Backend (Laravel API)

## Scope

Automated **API feature tests** for `backend/` — **Pest** or **PHPUnit**, hitting **`/api/v1`** only.

## Conventions

- Prefer **Pest** (`tests/Feature/Api/V1/...`) with `RefreshDatabase` where migrations apply.
- Authenticate with **Sanctum** (`Sanctum::actingAs`) and seed **Spatie permissions** so `hasPermission` matches the scenario under test.
- Assert JSON: success bodies, **pagination** shape (`data`, `meta`, `links`), **422** validation (`message`, `errors`), **403**/**401** when required.
- Keep tests **CI-friendly**: no manual Docker steps in test code; use factories/seeders.

## Database isolation (critical)

- **Default:** PHPUnit sets **SQLite `:memory:`** in [`phpunit.xml`](../../backend/phpunit.xml); [`backend/.env.testing`](../../backend/.env.testing) reinforces test DB when `APP_ENV=testing`. Feature tests use `RefreshDatabase` on that DB only.
- **If `php artisan config:cache` was run:** `bootstrap/cache/config.php` bakes in MySQL; Laravel then **skips** loading `.env` / `.env.testing`, so PHPUnit’s SQLite env is **ignored** and `RefreshDatabase` can **wipe MySQL**. [`tests/TestCase.php`](../../backend/tests/TestCase.php) deletes that cache file before boot, then forces **sqlite** + **`:memory:`** after boot. You can also run `php artisan config:clear` or **`composer test`** (clears config then runs tests).

**SQLite vs MySQL for tests**

| | SQLite `:memory:` (default) | MySQL (separate database) |
|---|-----------------------------|---------------------------|
| **Pros** | Fast, no extra service, safe isolation | Same engine as production |
| **Cons** | Tiny dialect differences (rare in Laravel) | Requires `burst_tea_test` (or similar) and credentials in `phpunit.xml` / env — **never** reuse `DB_DATABASE` from dev |

To use MySQL for tests: create an empty DB (e.g. `burst_tea_test`), set `DB_CONNECTION=mysql` and `DB_DATABASE=burst_tea_test` in `phpunit.xml` `<php>` (or a local `phpunit.xml` override), and keep `APP_ENV=testing`.

## Commands

```bash
cd backend && composer test
# or (after config:clear if you use config:cache)
cd backend && php artisan test
cd backend && ./vendor/bin/pest
```

## Out of scope

- Frontend unit/E2E (see **tester-frontend.md**).
- Load/performance testing unless explicitly requested.

## Documentation

- New suites or env needs: note in **`BLUEPRINT.md`** changelog if relevant.
