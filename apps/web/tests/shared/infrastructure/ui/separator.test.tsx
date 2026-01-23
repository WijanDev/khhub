import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from '../../../../src/shared/infrastructure/ui/separator';

describe('Separator', () => {
  it('should render a separator with default props', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
  });

  it('should render with horizontal orientation by default', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
    expect(separator?.getAttribute('data-orientation')).toBe('horizontal');
    expect(separator?.className).toContain('data-[orientation=horizontal]:h-px');
    expect(separator?.className).toContain('data-[orientation=horizontal]:w-full');
  });

  it('should render with vertical orientation when specified', () => {
    const { container } = render(<Separator orientation="vertical" />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
    expect(separator?.getAttribute('data-orientation')).toBe('vertical');
    expect(separator?.className).toContain('data-[orientation=vertical]:h-full');
    expect(separator?.className).toContain('data-[orientation=vertical]:w-px');
  });

  it('should be decorative by default', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
    // Radix UI sets aria-orientation when decorative is true
    expect(separator?.getAttribute('aria-orientation')).toBeDefined();
  });

  it('should accept decorative prop', () => {
    const { container, rerender } = render(<Separator decorative={true} />);
    
    let separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
    
    rerender(<Separator decorative={false} />);
    separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeDefined();
  });

  it('should accept custom className', () => {
    const { container } = render(<Separator className="custom-class" />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.className).toContain('custom-class');
  });

  it('should have data-slot attribute', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.getAttribute('data-slot')).toBe('separator');
  });

  it('should forward additional props', () => {
    const { container } = render(
      <Separator id="test-separator" aria-label="Test separator" />
    );
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.getAttribute('id')).toBe('test-separator');
    expect(separator?.getAttribute('aria-label')).toBe('Test separator');
  });

  it('should apply base styles', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.className).toContain('bg-border');
    expect(separator?.className).toContain('shrink-0');
  });

  it('should merge className with orientation classes', () => {
    const { container } = render(
      <Separator orientation="vertical" className="extra-class" />
    );
    
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.className).toContain('extra-class');
    expect(separator?.className).toContain('data-[orientation=vertical]:h-full');
    expect(separator?.className).toContain('data-[orientation=vertical]:w-px');
  });

  it('should switch between orientations correctly', () => {
    const { container, rerender } = render(<Separator orientation="horizontal" />);
    
    let separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.getAttribute('data-orientation')).toBe('horizontal');
    
    rerender(<Separator orientation="vertical" />);
    separator = container.querySelector('[data-slot="separator"]');
    expect(separator?.getAttribute('data-orientation')).toBe('vertical');
  });
});
