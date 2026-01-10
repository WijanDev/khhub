import { z } from 'zod';
import { UserStatusSchema, UserRoleSchema } from './common';

/**
 * User related schemas and types
 * All messages use translation keys that should be translated by the client
 */

// Base User (without sensitive data)
export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  emailVerified: z.boolean(),
  status: UserStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// Create User
export const CreateUserSchema = z.object({
  email: z.email('validation.email.invalid'),
  password: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength'),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Update User (admin)
export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength').optional(),
  avatar_url: z.url('validation.url.invalid').optional(),
  status: UserStatusSchema.optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Update Profile (self)
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength').optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// User Tenant membership
export const UserTenantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  role: UserRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserTenant = z.infer<typeof UserTenantSchema>;

// Add user to tenant
export const AddUserToTenantSchema = z.object({
  tenant_id: z.string().min(1, 'validation.tenantId.required'),
  role: UserRoleSchema.optional().default('member'),
});
export type AddUserToTenantInput = z.infer<typeof AddUserToTenantSchema>;

// Update user role in tenant
export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

// User with tenant memberships
export const UserWithTenantsSchema = UserSchema.extend({
  tenants: z.array(
    z.object({
      tenant: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
      }),
      role: UserRoleSchema,
    })
  ),
});
export type UserWithTenants = z.infer<typeof UserWithTenantsSchema>;
