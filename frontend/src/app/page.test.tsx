
// __tests__/page.test.tsx
import { render } from '@testing-library/react';
import Home from './page';
import '@testing-library/jest-dom';


describe('Home Page', () => {

  it('renders Hero component', () => {
    const { getByText } = render(<Home />);
    const heroText = getByText(/Welcome to SNPsniper!/i);
    expect(heroText).toBeInTheDocument();
  });
});

