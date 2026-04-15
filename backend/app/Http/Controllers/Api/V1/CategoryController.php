<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Categories\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Categories\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function options(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorizePermission($request->user(), Permissions::CATEGORY_READ);

        $rows = Category::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name']);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::CATEGORY_READ);

        $paginator = Category::query()
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 15));

        return CategoryResource::collection($paginator);
    }

    public function store(StoreCategoryRequest $request): CategoryResource
    {
        $category = Category::query()->create($request->validated());

        return new CategoryResource($category);
    }

    public function show(Request $request, Category $category): CategoryResource
    {
        $this->authorizePermission($request->user(), Permissions::CATEGORY_READ);

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->fill($request->validated());
        $category->save();

        return new CategoryResource($category->fresh());
    }

    public function destroy(Request $request, Category $category): Response
    {
        $this->authorizePermission($request->user(), Permissions::CATEGORY_DELETE);

        $category->delete();

        return response()->noContent();
    }
}
