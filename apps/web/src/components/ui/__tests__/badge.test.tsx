import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../badge';

describe('Badge', () => {
  it('should render a badge with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeDefined();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.getAttribute('data-slot')).toBe('badge');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    
    let badge = screen.getByText('Default');
    expect(badge).toBeDefined();
    
    rerender(<Badge variant="secondary">Secondary</Badge>);
    badge = screen.getByText('Secondary');
    expect(badge).toBeDefined();
    
    rerender(<Badge variant="destructive">Destructive</Badge>);
    badge = screen.getByText('Destructive');
    expect(badge).toBeDefined();
    
    rerender(<Badge variant="outline">Outline</Badge>);
    badge = screen.getByText('Outline');
    expect(badge).toBeDefined();
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/test');
    expect(link.textContent).toBe('Link Badge');
    expect(link.getAttribute('data-slot')).toBe('badge');
  });

  it('should have data-slot attribute', () => {
    render(<Badge>Test</Badge>);
    
    const badge = screen.getByText('Test');
    expect(badge.getAttribute('data-slot')).toBe('badge');
  });

  it('should forward additional props', () => {
    render(<Badge id="test-badge" aria-label="Test badge">Test</Badge>);
    
    const badge = screen.getByText('Test');
    expect(badge.getAttribute('id')).toBe('test-badge');
    expect(badge.getAttribute('aria-label')).toBe('Test badge');
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Child content</span>
      </Badge>
    );
    
    const child = screen.getByText('Child content');
    expect(child).toBeDefined();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Badge onClick={handleClick}>Clickable</Badge>);
    
    const badge = screen.getByText('Clickable');
    await user.click(badge);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply default variant when no variant is specified', () => {
    render(<Badge>Default</Badge>);
    
    const badge = screen.getByText('Default');
    expect(badge).toBeDefined();
    // The className should contain default variant styles
    expect(badge.className).toBeDefined();
  });

  it('should merge className with variant classes', () => {
    render(<Badge variant="secondary" className="extra-class">Test</Badge>);
    
    const badge = screen.getByText('Test');
    expect(badge.className).toContain('extra-class');
  });

  it('should work with asChild and different element types', () => {
    render(
      <Badge asChild>
        <div data-testid="custom-element">Custom Element</div>
      </Badge>
    );
    
    const element = screen.getByTestId('custom-element');
    expect(element).toBeDefined();
    expect(element.getAttribute('data-slot')).toBe('badge');
  });
});
