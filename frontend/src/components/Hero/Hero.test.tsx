import { render } from '@testing-library/react';
import Hero from './index';
import '@testing-library/jest-dom';

describe('Hero Component', () => {
  it('renders hero section', () => {
    const { getByText } = render(<Hero />);
    const heading = getByText(/Welcome to SNPsniper!/i);
    const description = getByText(/Discover the innovative platform/i);
    expect(heading).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  it('renders the Comparison link', () => {
    const { getByText } = render(<Hero />);
    const comparisonLink = getByText(/Comparison/i);
    expect(comparisonLink).toBeInTheDocument();
  });

  it('renders the Top 10 SNPs link', () => {
    const { getByText } = render(<Hero />);
    const topSNPsLink = getByText(/Top 10 SNPs/i);
    expect(topSNPsLink).toBeInTheDocument();
  });
});
