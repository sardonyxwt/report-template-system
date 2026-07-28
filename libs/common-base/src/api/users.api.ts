import { searchQueryOrUndef, Prisma, UserRole } from 'platform/prisma';
import {
  UserAggregateRequest,
  UserCreateRequest,
  UserResponse,
  UsersResponse,
  UserUpdateRequest,
} from '../data/user/user.types';
import { UserEndpoints } from '../endpoints/user.endpoints';
import { ApiRequest } from '../types';

export type UsersFindManyByRequest = {
  take: number;
  page?: number;
  role?: UserRole | UserRole[] | null;
  search?: string;
  excludeUserIds?: number[];
  orderBy?: Prisma.UserOrderByWithRelationInput[];
};

/**
 * Builds typed user administration client helpers.
 *
 * Higher-level helpers such as `findManyBy` intentionally translate UI-shaped
 * filters into the shared aggregate request so callers do not repeat Prisma
 * where construction in multiple frontends.
 */
export const createUsersApi = (
  request: ApiRequest,
  endpoints: UserEndpoints,
) => {
  const api = {
    /**
     * Executes the raw aggregate user query contract.
     */
    findMany: (body: UserAggregateRequest): Promise<UsersResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    /**
     * Builds a common paginated/filterable user query from practical UI inputs.
     */
    findManyBy: ({
      take,
      page = 0,
      role,
      search,
      excludeUserIds,
      orderBy,
    }: UsersFindManyByRequest): Promise<UsersResponse> => {
      const where: Prisma.UserWhereInput = {};

      if (excludeUserIds && excludeUserIds.length > 0) {
        where.id = { notIn: excludeUserIds };
      }

      if (role) {
        where.role = Array.isArray(role) ? { in: role } : role;
      }

      const searchFilter = searchQueryOrUndef(search);

      if (search && searchFilter) {
        where.email = searchFilter;
      }

      return api.findMany({
        skip: page * take,
        take,
        where,
        orderBy,
      });
    },
    /**
     * Loads a single user through the aggregate endpoint and returns null when
     * no record matches.
     */
    findOne: async (id: number): Promise<UserResponse | null> => {
      const { path, method } = endpoints.findMany;
      const { items, total } = await request<
        UserAggregateRequest,
        UsersResponse
      >({
        path,
        method,
        body: { where: { id } },
      });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
    /**
     * Creates a user and returns the public user response shape.
     */
    create: (body: UserCreateRequest): Promise<UserResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
    /**
     * Updates a user and returns the public user response shape.
     */
    update: (body: UserUpdateRequest): Promise<UserResponse> => {
      const { path, method } = endpoints.update;
      return request({ path, method, body });
    },
    /**
     * Deletes a user by id using the endpoint URL builder.
     */
    del: (id: number): Promise<UserResponse> => {
      const { method, build } = endpoints.delete;
      return request({ path: build(id), method });
    },
  };

  return api;
};
