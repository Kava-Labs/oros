import { render } from '@testing-library/react'
import { DemoBanner } from './';

describe('DemoBanner', () => {
  it('renders the DemoBanner component', () => {
    const wrapper = render(<DemoBanner />);
    wrapper.getByText('Demo');
  });
});
