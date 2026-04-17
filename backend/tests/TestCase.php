<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * When `bootstrap/cache/config.php` exists (from `php artisan config:cache`), Laravel's
     * LoadEnvironmentVariables bootstrap returns early and never loads `.env` / `.env.testing`.
     * The cached file embeds your dev MySQL settings, so PHPUnit's `DB_CONNECTION=sqlite` and
     * `DB_DATABASE=:memory:` from phpunit.xml are ignored — RefreshDatabase then wipes MySQL.
     *
     * We delete the cached config before boot so env can load, then force the default
     * connection to in-memory SQLite after bootstrap so no argv/IDE runner can leave MySQL
     * as `database.default` (unlink can also fail silently on some setups).
     */
    public function createApplication()
    {
        $this->removeCachedConfigurationIfPresent();

        $app = parent::createApplication();

        $this->forceInMemorySqlite($app);

        return $app;
    }

    protected function removeCachedConfigurationIfPresent(): void
    {
        $path = dirname(__DIR__).'/bootstrap/cache/config.php';
        if (is_file($path)) {
            @unlink($path);
        }
    }

    protected function forceInMemorySqlite(Application $app): void
    {
        $config = $app['config'];
        $config->set('database.default', 'sqlite');
        $config->set('database.connections.sqlite.database', ':memory:');
        $config->set('database.connections.sqlite.url', null);

        if ($app->bound('db')) {
            $app->make('db')->purge();
        }
    }
}
