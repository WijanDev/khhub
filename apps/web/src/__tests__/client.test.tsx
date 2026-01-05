import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock hydrateRoot before importing the module
const mockHydrateRoot = vi.fn();
vi.mock('react-dom/client', () => ({
  hydrateRoot: mockHydrateRoot,
}));

// Mock StartClient component
const MockStartClient = vi.fn(() => null);
vi.mock('@tanstack/react-start/client', () => ({
  StartClient: MockStartClient,
}));

describe('client.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should call hydrateRoot with document as the first argument', async () => {
    // Import the module to trigger side effects
    await import('../client');
    
    // Verify hydrateRoot was called
    expect(mockHydrateRoot).toHaveBeenCalledTimes(1);
    
    // Verify it was called with document as first argument
    const callArgs = mockHydrateRoot.mock.calls[0];
    expect(callArgs[0]).toBe(document);
  });

  it('should call hydrateRoot with StartClient component as the second argument', async () => {
    await import('../client');
    
    // Verify StartClient was used in the hydrateRoot call
    const callArgs = mockHydrateRoot.mock.calls[0];
    const secondArg = callArgs[1];
    
    // The second argument should be a React element
    expect(secondArg).toBeDefined();
    expect(React.isValidElement(secondArg)).toBe(true);
  });

  it('should pass StartClient component without props', async () => {
    await import('../client');
    
    const callArgs = mockHydrateRoot.mock.calls[0];
    const reactElement = callArgs[1] as React.ReactElement;
    
    // Verify the element type is StartClient
    expect(reactElement.type).toBe(MockStartClient);
    
    // Verify no props are passed (empty object)
    expect(reactElement.props).toEqual({});
  });

  it('should only call hydrateRoot once when module is imported', async () => {
    // Clear any previous calls
    mockHydrateRoot.mockClear();
    
    // Import the module
    await import('../client');
    
    // Verify it was called exactly once
    expect(mockHydrateRoot).toHaveBeenCalledTimes(1);
  });
});
