
// __tests__/page.test.tsx
import { render } from '@testing-library/react';
import Home from './page';
import '@testing-library/jest-dom';


describe('Home Page', () => {
  it('renders ScrollUp component', () => {
    const { getByTestId } = render(<Home />);
    const scrollUp = getByTestId('scroll-up'); // test id should be in scrollup component file
    expect(scrollUp).toBeInTheDocument();
  });

  it('renders Hero component', () => {
    const { getByText } = render(<Home />);
    const heroText = getByText(/Welcome to SNPsniper!/i);
    expect(heroText).toBeInTheDocument();
  });
});

