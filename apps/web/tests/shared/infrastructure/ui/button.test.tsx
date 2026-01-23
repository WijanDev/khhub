import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../../src/shared/infrastructure/ui/button';

describe('Button', () => {
  it('should render a button with default variant', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.getAttribute('data-variant')).toBe('default');
    expect(button.getAttribute('data-size')).toBe('default');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    
    let button = screen.getByRole('button');
    expect(button.getAttribute('data-variant')).toBe('destructive');
    
    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-variant')).toBe('outline');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-variant')).toBe('secondary');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-variant')).toBe('ghost');
    
    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-variant')).toBe('link');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button');
    expect(button.getAttribute('data-size')).toBe('sm');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-size')).toBe('lg');
    
    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button.getAttribute('data-size')).toBe('icon');
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/test');
    expect(link.textContent).toBe('Link Button');
  });

  it('should have data-slot attribute', () => {
    render(<Button>Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-slot')).toBe('button');
  });

  it('should forward additional props', () => {
    render(<Button type="submit" aria-label="Submit form">Submit</Button>);
    
    const button = screen.getByRole('button', { name: /submit form/i });
    expect(button.getAttribute('type')).toBe('submit');
  });
});
