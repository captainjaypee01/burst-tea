<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AccountKind;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Users\StoreUserRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function options(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorizePermission($request->user(), Permissions::USER_READ);

        $rows = User::query()
            ->where('account_kind', AccountKind::Staff)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::USER_READ);

        $paginator = User::query()->with('roles')->orderBy('name')->paginate($request->integer('per_page', 15));

        return UserResource::collection($paginator);
    }

    public function store(StoreUserRequest $request): UserResource
    {
        /** @var User $auth */
        $auth = $request->user();

        /** @var array{name: string, email: string, password: string, pin_hash?: string|null, is_active?: bool, is_superadmin?: bool, account_kind?: string, role_ids?: list<int>} $data */
        $data = $request->validated();

        if (($data['is_superadmin'] ?? false) && ! $auth->is_superadmin) {
            abort(403, 'Only superadmins can create superadmin accounts.');
        }

        $user = new User;
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->pin_hash = isset($data['pin_hash']) ? Hash::make((string) $data['pin_hash']) : null;
        $user->is_active = $data['is_active'] ?? true;
        $user->is_superadmin = $data['is_superadmin'] ?? false;
        $user->account_kind = isset($data['account_kind'])
            ? AccountKind::from($data['account_kind'])
            : AccountKind::Staff;
        $user->save();

        if (isset($data['role_ids'])) {
            $roles = Role::query()->whereIn('id', $data['role_ids'])->get();
            $user->syncRoles($roles);
        }

        return new UserResource($user->load('roles'));
    }

    public function show(Request $request, User $user): UserResource
    {
        $this->authorizePermission($request->user(), Permissions::USER_READ);

        return new UserResource($user->load('roles'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        /** @var User $auth */
        $auth = $request->user();

        $data = $request->validated();

        if (array_key_exists('is_superadmin', $data) && $data['is_superadmin'] && ! $auth->is_superadmin) {
            abort(403, 'Only superadmins can grant superadmin.');
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (array_key_exists('pin_hash', $data) && $data['pin_hash'] !== null) {
            $data['pin_hash'] = Hash::make((string) $data['pin_hash']);
        }

        if (array_key_exists('account_kind', $data) && $data['account_kind'] !== null) {
            $data['account_kind'] = AccountKind::from($data['account_kind']);
        }

        $user->fill($data);
        $user->save();

        if (isset($data['role_ids'])) {
            $roles = Role::query()->whereIn('id', $data['role_ids'])->get();
            $user->syncRoles($roles);
        }

        return new UserResource($user->fresh()->load('roles'));
    }

    public function destroy(Request $request, User $user): Response
    {
        $this->authorizePermission($request->user(), Permissions::USER_DELETE);

        /** @var User $auth */
        $auth = $request->user();

        if ($auth->id === $user->id) {
            abort(403, 'You cannot delete your own account.');
        }

        $user->delete();

        return response()->noContent();
    }
}
