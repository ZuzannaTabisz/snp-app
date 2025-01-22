import { render, screen } from '@testing-library/react';
import AboutPage from './page';
import '@testing-library/jest-dom';

describe('AboutPage', () => {
  it('renders the Breadcrumb component', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'About Page' })).toBeInTheDocument();
    const descriptionElement = screen.getByText('Lorem ipsum dolor sit amet, consesctetur adipiscing elit. In varius eros eget sapien consectetur ultrices. Ut quis dapibus libero.', { exact: false });
    expect(descriptionElement).toBeInTheDocument();
  });
});