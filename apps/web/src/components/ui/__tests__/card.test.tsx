import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';

describe('Card', () => {
  it('should render a card', () => {
    render(<Card>Card content</Card>);
    
    const card = screen.getByText('Card content');
    expect(card).toBeDefined();
    expect(card.tagName).toBe('DIV');
    expect(card.getAttribute('data-slot')).toBe('card');
  });

  it('should accept custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    
    const card = screen.getByText('Content');
    expect(card.className).toContain('custom-class');
  });

  it('should forward additional props', () => {
    render(<Card id="test-card" aria-label="Test card">Content</Card>);
    
    const card = screen.getByText('Content');
    expect(card.getAttribute('id')).toBe('test-card');
    expect(card.getAttribute('aria-label')).toBe('Test card');
  });

  it('should render children correctly', () => {
    render(
      <Card>
        <div>Child content</div>
      </Card>
    );
    
    const child = screen.getByText('Child content');
    expect(child).toBeDefined();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Card onClick={handleClick}>Clickable</Card>);
    
    const card = screen.getByText('Clickable');
    await user.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('CardHeader', () => {
  it('should render a card header', () => {
    render(<CardHeader>Header content</CardHeader>);
    
    const header = screen.getByText('Header content');
    expect(header).toBeDefined();
    expect(header.tagName).toBe('DIV');
    expect(header.getAttribute('data-slot')).toBe('card-header');
  });

  it('should accept custom className', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>);
    
    const header = screen.getByText('Header');
    expect(header.className).toContain('custom-header');
  });

  it('should forward additional props', () => {
    render(<CardHeader id="header-id">Header</CardHeader>);
    
    const header = screen.getByText('Header');
    expect(header.getAttribute('id')).toBe('header-id');
  });
});

describe('CardTitle', () => {
  it('should render a card title', () => {
    render(<CardTitle>Title</CardTitle>);
    
    const title = screen.getByText('Title');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('DIV');
    expect(title.getAttribute('data-slot')).toBe('card-title');
  });

  it('should accept custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    
    const title = screen.getByText('Title');
    expect(title.className).toContain('custom-title');
  });

  it('should forward additional props', () => {
    render(<CardTitle id="title-id">Title</CardTitle>);
    
    const title = screen.getByText('Title');
    expect(title.getAttribute('id')).toBe('title-id');
  });
});

describe('CardDescription', () => {
  it('should render a card description', () => {
    render(<CardDescription>Description</CardDescription>);
    
    const description = screen.getByText('Description');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('DIV');
    expect(description.getAttribute('data-slot')).toBe('card-description');
  });

  it('should accept custom className', () => {
    render(<CardDescription className="custom-desc">Description</CardDescription>);
    
    const description = screen.getByText('Description');
    expect(description.className).toContain('custom-desc');
  });

  it('should forward additional props', () => {
    render(<CardDescription id="desc-id">Description</CardDescription>);
    
    const description = screen.getByText('Description');
    expect(description.getAttribute('id')).toBe('desc-id');
  });
});

describe('CardAction', () => {
  it('should render a card action', () => {
    render(<CardAction>Action</CardAction>);
    
    const action = screen.getByText('Action');
    expect(action).toBeDefined();
    expect(action.tagName).toBe('DIV');
    expect(action.getAttribute('data-slot')).toBe('card-action');
  });

  it('should accept custom className', () => {
    render(<CardAction className="custom-action">Action</CardAction>);
    
    const action = screen.getByText('Action');
    expect(action.className).toContain('custom-action');
  });

  it('should forward additional props', () => {
    render(<CardAction id="action-id">Action</CardAction>);
    
    const action = screen.getByText('Action');
    expect(action.getAttribute('id')).toBe('action-id');
  });
});

describe('CardContent', () => {
  it('should render card content', () => {
    render(<CardContent>Content</CardContent>);
    
    const content = screen.getByText('Content');
    expect(content).toBeDefined();
    expect(content.tagName).toBe('DIV');
    expect(content.getAttribute('data-slot')).toBe('card-content');
  });

  it('should accept custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    
    const content = screen.getByText('Content');
    expect(content.className).toContain('custom-content');
  });

  it('should forward additional props', () => {
    render(<CardContent id="content-id">Content</CardContent>);
    
    const content = screen.getByText('Content');
    expect(content.getAttribute('id')).toBe('content-id');
  });
});

describe('CardFooter', () => {
  it('should render a card footer', () => {
    render(<CardFooter>Footer</CardFooter>);
    
    const footer = screen.getByText('Footer');
    expect(footer).toBeDefined();
    expect(footer.tagName).toBe('DIV');
    expect(footer.getAttribute('data-slot')).toBe('card-footer');
  });

  it('should accept custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    
    const footer = screen.getByText('Footer');
    expect(footer.className).toContain('custom-footer');
  });

  it('should forward additional props', () => {
    render(<CardFooter id="footer-id">Footer</CardFooter>);
    
    const footer = screen.getByText('Footer');
    expect(footer.getAttribute('id')).toBe('footer-id');
  });
});

describe('Card composition', () => {
  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>
            <button>Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <span>Footer content</span>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeDefined();
    expect(screen.getByText('Card Description')).toBeDefined();
    expect(screen.getByText('Card content goes here')).toBeDefined();
    expect(screen.getByText('Footer content')).toBeDefined();
    expect(screen.getByRole('button', { name: /action/i })).toBeDefined();
  });

  it('should maintain correct data-slot attributes in composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Title').getAttribute('data-slot')).toBe('card-title');
    expect(screen.getByText('Description').getAttribute('data-slot')).toBe('card-description');
    expect(screen.getByText('Action').getAttribute('data-slot')).toBe('card-action');
    expect(screen.getByText('Content').getAttribute('data-slot')).toBe('card-content');
    expect(screen.getByText('Footer').getAttribute('data-slot')).toBe('card-footer');
  });
});
