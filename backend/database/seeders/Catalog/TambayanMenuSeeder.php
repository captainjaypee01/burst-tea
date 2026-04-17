<?php

namespace Database\Seeders\Catalog;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

/**
 * Sample catalog inspired by Tambayan Cafe — Burstea menus (drinks + meals).
 * Safe to re-run: categories keyed by slug; products keyed by category + name; variants replaced.
 */
class TambayanMenuSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedIcedCoffeeSeries();
        $this->seedMilkteaSeries();
        $this->seedMilkshakeSeries();
        $this->seedSnacks();
        $this->seedTcMeals();
        $this->seedBarkadaMeals();
        $this->seedSizzlingMeals();
        $this->seedChickenMeal();
        $this->seedPastaMeal();
        $this->seedChaofanMeals();
        $this->seedLugawMeals();
        $this->seedAlaCarte();
        $this->seedAddOns();
    }

    private static function peso(int $pesos): int
    {
        return $pesos * 100;
    }

    private function category(string $name, string $slug, int $sortOrder): Category
    {
        return Category::query()->updateOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'sort_order' => $sortOrder, 'is_active' => true],
        );
    }

    /**
     * @param  array<int, array{name: string, price_cents: int}>  $variants
     */
    private function upsertProduct(Category $category, string $name, ?string $description, array $variants): void
    {
        $product = Product::query()->updateOrCreate(
            ['category_id' => $category->id, 'name' => $name],
            ['description' => $description, 'is_active' => true],
        );

        ProductVariant::withTrashed()->where('product_id', $product->id)->forceDelete();

        foreach ($variants as $v) {
            $product->variants()->create([
                'name' => $v['name'],
                'price_cents' => $v['price_cents'],
                'sku' => null,
                'is_active' => true,
            ]);
        }
    }

    private function productTwoSizes(Category $category, string $name, int $regularPesos, int $largePesos): void
    {
        $this->upsertProduct($category, $name, null, [
            ['name' => 'Regular', 'price_cents' => self::peso($regularPesos)],
            ['name' => 'Large', 'price_cents' => self::peso($largePesos)],
        ]);
    }

    private function productStandard(Category $category, string $name, int $pesos, ?string $description = null): void
    {
        $this->upsertProduct($category, $name, $description, [
            ['name' => 'Standard', 'price_cents' => self::peso($pesos)],
        ]);
    }

    private function seedIcedCoffeeSeries(): void
    {
        $c = $this->category('ICED COFFEE SERIES', 'iced-coffee-series', 10);

        $this->productTwoSizes($c, 'Caramel', 59, 69);
        $this->productTwoSizes($c, 'Vanilla', 59, 69);
        $this->productTwoSizes($c, 'Salted Caramel', 59, 69);
        $this->productTwoSizes($c, 'Dirty Matcha', 69, 79);
    }

    private function seedMilkteaSeries(): void
    {
        $c = $this->category('MILKTEA SERIES', 'milktea-series', 20);

        $this->productTwoSizes($c, 'Okinawa', 49, 59);
        $this->productTwoSizes($c, "Cookies n' Cream", 49, 59);
        $this->productTwoSizes($c, 'Taro', 49, 59);
        $this->productTwoSizes($c, 'Wintermelon', 49, 59);
        $this->productTwoSizes($c, 'Chocolate', 59, 69);
        $this->productTwoSizes($c, 'Matcha', 59, 69);
        $this->productTwoSizes($c, 'Mango Cheesecake', 59, 69);
    }

    private function seedMilkshakeSeries(): void
    {
        $c = $this->category('MILKSHAKE SERIES', 'milkshake-series', 30);

        $this->productTwoSizes($c, 'Strawberry', 69, 79);
        $this->productTwoSizes($c, 'Coffee Crumble', 69, 79);
        $this->productTwoSizes($c, 'Mocha', 69, 79);
        $this->productTwoSizes($c, 'Cappuccino', 69, 79);
        $this->productTwoSizes($c, 'Matcha', 69, 79);
    }

    private function seedSnacks(): void
    {
        $c = $this->category('SNACKS', 'snacks', 40);

        $this->productStandard($c, 'B1T1 Burger', 49);
        $this->productStandard($c, 'B1T1 Burger w/ Cheese', 59);
        $this->productStandard($c, 'Cheesy Hotdog', 49);
        $this->productStandard($c, 'Hungarian Sandwich', 59);
        $this->productStandard($c, 'Cheesy Fries Overload', 79);
    }

    private function seedTcMeals(): void
    {
        $c = $this->category('TC Meals', 'tc-meals', 50);

        $this->productStandard(
            $c,
            'TC1',
            59,
            'Includes: 60g Fries, 3 Cheesestick, Juice',
        );
        $this->productStandard(
            $c,
            'TC2',
            69,
            'Includes: 60g Fries, 3 Cheesestick, 2 Siomai, Juice',
        );
        $this->productStandard(
            $c,
            'TC3',
            79,
            'Includes: 60g Fries, 3 Cheesestick, 2 Hotdog, Juice',
        );
    }

    private function seedBarkadaMeals(): void
    {
        $c = $this->category('BARKADA MEALS', 'barkada-meals', 55);

        $this->productStandard(
            $c,
            'Barkada Meal A',
            299,
            'Includes: 3 Cheese Burger, 2 Cheesy Hotdog, 18 Cheese Stick, 250g Fries, 1 Pitcher Juice',
        );
        $this->productStandard(
            $c,
            'Barkada Meal B',
            209,
            'Includes: 3 Cheesy Hotdog, 200g Fries, 12 Cheese Stick, 1 Pitcher Juice',
        );
        $this->productStandard(
            $c,
            'Barkada Meal C',
            199,
            'Includes: 3 Cheese Burger, 200g Fries, 12 Cheese Stick, 1 Pitcher Juice',
        );
    }

    private function seedSizzlingMeals(): void
    {
        $c = $this->category('SIZZLING MEALS', 'sizzling-meals', 60);

        $this->productStandard($c, 'Liempo', 139);
        $this->productStandard($c, 'Porkchop', 129);
        $this->productStandard($c, 'Sisig', 119);
    }

    private function seedChickenMeal(): void
    {
        $c = $this->category('CHICKEN MEAL', 'chicken-meal', 70);

        $product = Product::query()->updateOrCreate(
            ['category_id' => $c->id, 'name' => 'Flavored Chicken'],
            [
                'description' => 'Choose a flavor: Honey Butter, Soy Garlic, Teriyaki, or Buffalo.',
                'is_active' => true,
            ],
        );

        ProductVariant::withTrashed()->where('product_id', $product->id)->forceDelete();

        foreach (['Honey Butter', 'Soy Garlic', 'Teriyaki', 'Buffalo'] as $flavor) {
            $product->variants()->create([
                'name' => $flavor,
                'price_cents' => self::peso(139),
                'sku' => null,
                'is_active' => true,
            ]);
        }
    }

    private function seedPastaMeal(): void
    {
        $c = $this->category('PASTA MEAL', 'pasta-meal', 80);

        $this->productStandard($c, 'Tuna Carbonara', 99);
    }

    private function seedChaofanMeals(): void
    {
        $c = $this->category('CHAOFAN MEALS', 'chaofan-meals', 90);

        $this->productStandard($c, 'Sisig', 139);
        $this->productStandard($c, 'Fried Chicken', 109);
        $this->productStandard($c, 'Beef Tapa', 109);
        $this->productStandard($c, 'Fried Bangus', 99);
        $this->productStandard($c, 'Hungarian', 99);
        $this->productStandard($c, 'Dumplings', 89);
        $this->productStandard($c, 'Tocino', 89);
        $this->productStandard($c, 'Spam', 79);
        $this->productStandard($c, 'Hotdog', 69);
        $this->productStandard($c, 'Siomai', 59);
        $this->productStandard($c, 'Scrambled Egg', 59);
        $this->productStandard($c, 'Chaofan Rice', 50);
    }

    private function seedLugawMeals(): void
    {
        $c = $this->category('LUGAW MEALS', 'lugaw-meals', 100);

        $this->productStandard($c, 'Plain', 25);
        $this->productStandard($c, 'Egg', 40);
        $this->productStandard($c, 'Siomai', 45);
        $this->productStandard($c, 'Chicken', 70);
        $this->productStandard($c, 'Lugaw Overload (Beef Laman Loob)', 95);
    }

    private function seedAlaCarte(): void
    {
        $c = $this->category('ALA CARTE', 'ala-carte', 110);

        $this->productStandard($c, 'Sisig', 105);
        $this->productStandard($c, 'Porkchop', 120);
        $this->productStandard($c, 'Liempo', 130);
        $this->productStandard($c, 'Flavored Chicken', 155);
    }

    private function seedAddOns(): void
    {
        $c = $this->category('Add Ons', 'add-ons', 120);

        // Drinks menu
        $this->productStandard($c, 'Espresso', 20);
        $this->productStandard($c, 'Pearl', 15);
        // Meals menu
        $this->productStandard($c, 'Plain Rice', 15);
        $this->productStandard($c, 'Dumplings', 30);
        $this->productStandard($c, 'Siomai', 20);
        $this->productStandard($c, 'Egg', 15);
    }
}
