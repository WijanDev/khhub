import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock better-auth/react
const mockUseSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockVerifyEmail = vi.fn();
const mockResetPassword = vi.fn();
const mockSendVerificationEmail = vi.fn();
const mockRequestPasswordReset = vi.fn();

const mockAuthClient = {
  useSession: mockUseSession,
  signIn: mockSignIn,
  signUp: mockSignUp,
  signOut: mockSignOut,
  verifyEmail: mockVerifyEmail,
  resetPassword: mockResetPassword,
  sendVerificationEmail: mockSendVerificationEmail,
  requestPasswordReset: mockRequestPasswordReset,
  getSession: vi.fn(),
  $Infer: {
    Session: {} as any,
  },
};

const mockCreateAuthClient = vi.fn().mockReturnValue(mockAuthClient);

vi.mock('better-auth/react', () => ({
  createAuthClient: mockCreateAuthClient,
}));

// Mock better-auth/client/plugins
const mockAdminClient = vi.fn().mockReturnValue({});

vi.mock('better-auth/client/plugins', () => ({
  adminClient: mockAdminClient,
}));

// Mock getApiBaseUrl
const mockGetApiBaseUrl = vi.fn().mockReturnValue('http://localhost:8787');

vi.mock('../api-client', () => ({
  getApiBaseUrl: mockGetApiBaseUrl,
}));

describe('auth-client.ts', () => {
  let authModule: typeof import('../auth-client');

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetApiBaseUrl.mockReturnValue('http://localhost:8787');
    // Import module once to capture the creation call
    vi.resetModules();
    authModule = await import('../auth-client');
  });

  describe('authClient creation', () => {
    it('should create auth client with getApiBaseUrl', () => {
      expect(mockCreateAuthClient).toHaveBeenCalledTimes(1);
      const createAuthClientCall = mockCreateAuthClient.mock.calls[0][0];
      
      expect(createAuthClientCall.baseURL).toBe('http://localhost:8787');
      expect(mockGetApiBaseUrl).toHaveBeenCalled();
    });

    it('should set basePath to /auth', () => {
      const createAuthClientCall = mockCreateAuthClient.mock.calls[0][0];
      expect(createAuthClientCall.basePath).toBe('/auth');
    });

    it('should include adminClient plugin', () => {
      expect(mockAdminClient).toHaveBeenCalledTimes(1);
      
      const createAuthClientCall = mockCreateAuthClient.mock.calls[0][0];
      expect(createAuthClientCall.plugins).toBeDefined();
      expect(Array.isArray(createAuthClientCall.plugins)).toBe(true);
      expect(createAuthClientCall.plugins.length).toBe(1);
    });

    it('should use the result from getApiBaseUrl', async () => {
      mockGetApiBaseUrl.mockReturnValue('https://api.example.com');
      mockCreateAuthClient.mockClear();
      vi.resetModules();
      
      await import('../auth-client');
      
      // Check the most recent call after reset
      const createAuthClientCall = mockCreateAuthClient.mock.calls[mockCreateAuthClient.mock.calls.length - 1][0];
      expect(createAuthClientCall.baseURL).toBe('https://api.example.com');
    });

    it('should call getApiBaseUrl before createAuthClient', () => {
      // Verify getApiBaseUrl was called
      expect(mockGetApiBaseUrl).toHaveBeenCalled();
      
      // Verify createAuthClient was called
      expect(mockCreateAuthClient).toHaveBeenCalled();
      
      // Verify call order
      const getApiBaseUrlCallOrder = mockGetApiBaseUrl.mock.invocationCallOrder[0];
      const createAuthClientCallOrder = mockCreateAuthClient.mock.invocationCallOrder[0];
      
      expect(getApiBaseUrlCallOrder).toBeLessThan(createAuthClientCallOrder);
    });
  });

  describe('hook exports', () => {
    it('should export useSession hook', () => {
      expect(authModule.useSession).toBeDefined();
      expect(authModule.useSession).toBe(mockUseSession);
    });

    it('should export signIn hook', () => {
      expect(authModule.signIn).toBeDefined();
      expect(authModule.signIn).toBe(mockSignIn);
    });

    it('should export signUp hook', () => {
      expect(authModule.signUp).toBeDefined();
      expect(authModule.signUp).toBe(mockSignUp);
    });

    it('should export signOut hook', () => {
      expect(authModule.signOut).toBeDefined();
      expect(authModule.signOut).toBe(mockSignOut);
    });

    it('should export verifyEmail hook', () => {
      expect(authModule.verifyEmail).toBeDefined();
      expect(authModule.verifyEmail).toBe(mockVerifyEmail);
    });

    it('should export resetPassword hook', () => {
      expect(authModule.resetPassword).toBeDefined();
      expect(authModule.resetPassword).toBe(mockResetPassword);
    });

    it('should export sendVerificationEmail hook', () => {
      expect(authModule.sendVerificationEmail).toBeDefined();
      expect(authModule.sendVerificationEmail).toBe(mockSendVerificationEmail);
    });

    it('should export requestPasswordReset hook', () => {
      expect(authModule.requestPasswordReset).toBeDefined();
      expect(authModule.requestPasswordReset).toBe(mockRequestPasswordReset);
    });
  });

  describe('authClient export', () => {
    it('should export authClient', () => {
      expect(authModule.authClient).toBeDefined();
      expect(authModule.authClient).toBe(mockAuthClient);
    });

    it('should export authClient with getSession method', () => {
      expect(authModule.authClient.getSession).toBeDefined();
      expect(typeof authModule.authClient.getSession).toBe('function');
    });
  });

  describe('type exports', () => {
    it('should export Session type', async () => {
      // Type check - if this compiles, the type is exported
      const authModule = await import('../auth-client');
      // Use the type through the module to verify it exists
      type TestSession = typeof authModule.authClient.$Infer.Session;
      const test: TestSession = {} as TestSession;
      expect(test).toBeDefined();
    });

    it('should export User type', async () => {
      // Type check - if this compiles, the type is exported
      const authModule = await import('../auth-client');
      // Use the type through the module to verify it exists
      type TestUser = typeof authModule.authClient.$Infer.Session['user'];
      const test: TestUser = {} as TestUser;
      expect(test).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should create client with correct configuration structure', () => {
      const createAuthClientCall = mockCreateAuthClient.mock.calls[0][0];
      
      expect(createAuthClientCall).toHaveProperty('baseURL');
      expect(createAuthClientCall).toHaveProperty('basePath');
      expect(createAuthClientCall).toHaveProperty('plugins');
      expect(Object.keys(createAuthClientCall)).toEqual(['baseURL', 'basePath', 'plugins']);
    });

    it('should use adminClient plugin instance', () => {
      const createAuthClientCall = mockCreateAuthClient.mock.calls[0][0];
      const plugin = createAuthClientCall.plugins[0];
      
      // Verify adminClient was called and its result is used
      expect(mockAdminClient).toHaveBeenCalled();
      expect(plugin).toBeDefined();
    });
  });
});
