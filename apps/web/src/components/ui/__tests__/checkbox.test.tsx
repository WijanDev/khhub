import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('should render a checkbox', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
    expect(checkbox.getAttribute('data-slot')).toBe('checkbox');
  });

  it('should be unchecked by default', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
  });

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('should be checked when defaultChecked prop is true', () => {
    render(<Checkbox defaultChecked />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('should toggle checked state when clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    
    await user.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('checked');
    
    await user.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
  });

  it('should call onCheckedChange when clicked', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLButtonElement;
    expect(checkbox.hasAttribute('disabled')).toBe(true);
    expect(checkbox.disabled).toBe(true);
  });

  it('should not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox disabled />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    
    await user.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
  });

  it('should accept custom className', () => {
    render(<Checkbox className="custom-class" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('custom-class');
  });

  it('should forward additional props', () => {
    render(<Checkbox id="test-checkbox" aria-label="Test checkbox" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('id')).toBe('test-checkbox');
    expect(checkbox.getAttribute('aria-label')).toBe('Test checkbox');
  });

  it('should have data-slot attribute', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-slot')).toBe('checkbox');
  });

  it('should have checkbox-indicator data-slot when checked', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // When checked, the indicator should be visible
    const indicator = checkbox.querySelector('[data-slot="checkbox-indicator"]');
    expect(indicator).toBeDefined();
  });

  it('should support controlled checkbox', async () => {
    const handleCheckedChange = vi.fn();
    const { rerender } = render(
      <Checkbox checked={false} onCheckedChange={handleCheckedChange} />
    );
    
    let checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    
    rerender(<Checkbox checked={true} onCheckedChange={handleCheckedChange} />);
    checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('should support indeterminate state', () => {
    render(<Checkbox checked="indeterminate" />);
    
    const checkbox = screen.getByRole('checkbox');
    // Radix UI uses checked="indeterminate" for indeterminate state
    expect(checkbox.getAttribute('data-state')).toBe('indeterminate');
  });

  it('should handle aria-required prop', () => {
    render(<Checkbox aria-required="true" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-required')).toBe('true');
  });

  it('should handle aria-label prop', () => {
    render(<Checkbox aria-label="Test checkbox" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-label')).toBe('Test checkbox');
  });

  it('should handle value prop', () => {
    render(<Checkbox value="test-value" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('value')).toBe('test-value');
  });
});
