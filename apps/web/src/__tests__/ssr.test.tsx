import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @tanstack/react-start/server
const mockDefaultStreamHandler = vi.fn();
const mockHandlerFactory = vi.fn();
const mockFinalHandler = vi.fn();

// createStartHandler returns a function (handlerFactory) that takes defaultStreamHandler
// and returns the final handler
mockHandlerFactory.mockReturnValue(mockFinalHandler);
const mockCreateStartHandler = vi.fn().mockReturnValue(mockHandlerFactory);

vi.mock('@tanstack/react-start/server', () => ({
  createStartHandler: mockCreateStartHandler,
  defaultStreamHandler: mockDefaultStreamHandler,
}));

// Mock getRouter
const mockGetRouter = vi.fn().mockReturnValue({ router: 'mock-router' });

vi.mock('../router', () => ({
  getRouter: mockGetRouter,
}));

describe('ssr.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should call createStartHandler with a callback function', async () => {
    await import('../ssr');
    
    expect(mockCreateStartHandler).toHaveBeenCalledTimes(1);
    const createStartHandlerCall = mockCreateStartHandler.mock.calls[0][0];
    
    expect(createStartHandlerCall).toBeDefined();
    expect(typeof createStartHandlerCall).toBe('function');
  });

  it('should call the handler factory function with defaultStreamHandler', async () => {
    await import('../ssr');
    
    expect(mockHandlerFactory).toHaveBeenCalledTimes(1);
    expect(mockHandlerFactory).toHaveBeenCalledWith(mockDefaultStreamHandler);
  });

  it('should export default handler', async () => {
    const ssrModule = await import('../ssr');
    
    expect(ssrModule.default).toBeDefined();
    expect(ssrModule.default).toBe(mockFinalHandler);
  });

  it('should use getRouter function from router module in callback', async () => {
    await import('../ssr');
    
    const createStartHandlerCall = mockCreateStartHandler.mock.calls[0][0];
    expect(typeof createStartHandlerCall).toBe('function');
    
    // Verify the callback calls getRouter
    createStartHandlerCall();
    expect(mockGetRouter).toHaveBeenCalled();
  });

  it('should call createStartHandler before calling handler factory', async () => {
    mockCreateStartHandler.mockClear();
    mockHandlerFactory.mockClear();
    
    await import('../ssr');
    
    // Verify createStartHandler was called
    expect(mockCreateStartHandler).toHaveBeenCalledTimes(1);
    
    // Verify handler factory was called after createStartHandler
    expect(mockHandlerFactory).toHaveBeenCalledTimes(1);
    
    // Verify call order
    const createStartHandlerCallOrder = mockCreateStartHandler.mock.invocationCallOrder[0];
    const handlerFactoryCallOrder = mockHandlerFactory.mock.invocationCallOrder[0];
    
    expect(createStartHandlerCallOrder).toBeLessThan(handlerFactoryCallOrder);
  });

  it('should pass callback function that calls getRouter', async () => {
    await import('../ssr');
    
    // Verify getRouter was not called during module initialization
    // (it will be called later by the handler when the callback is invoked)
    expect(mockGetRouter).not.toHaveBeenCalled();
    
    // Verify a callback function was passed
    const createStartHandlerCall = mockCreateStartHandler.mock.calls[0][0];
    expect(typeof createStartHandlerCall).toBe('function');
    
    // Verify the callback calls getRouter when invoked
    createStartHandlerCall();
    expect(mockGetRouter).toHaveBeenCalled();
  });

  it('should export handler that can be called', async () => {
    const ssrModule = await import('../ssr');
    
    const handler = ssrModule.default;
    expect(handler).toBe(mockFinalHandler);
    expect(typeof handler).toBe('function');
  });

  it('should create handler with callback function that returns router', async () => {
    await import('../ssr');
    
    const createStartHandlerCall = mockCreateStartHandler.mock.calls[0][0];
    
    expect(typeof createStartHandlerCall).toBe('function');
    
    // Verify the callback returns a router when invoked
    const router = createStartHandlerCall();
    expect(router).toEqual({ router: 'mock-router' });
  });
});
