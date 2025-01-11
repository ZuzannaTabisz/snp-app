import { render, screen, fireEvent } from '@testing-library/react';
import ScrollUp from './ScrollUp';
import '@testing-library/jest-dom';

describe('ScrollUp', () => {
  it('renders the button', () => {
    render(<ScrollUp />);
    const button = screen.getByTestId('scroll-up');
    expect(button).toBeInTheDocument();
  });

  it('scrolls to the top of the page when clicked', () => {
    const scrollToMock = jest.fn();
    Object.defineProperty(window.document, 'scrollingElement', {
      value: {
        scrollTo: scrollToMock,
      },
      writable: true,
    });

    render(<ScrollUp />);
    const button = screen.getByTestId('scroll-up');
    fireEvent.click(button);
    
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
  });
});
