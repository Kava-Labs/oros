import { render } from '@testing-library/react'
import { describe, it } from 'vitest';

import { DemoBanner } from './DemoBanner'

describe('DemoBanner', () => {
    it('renders the DemoBanner component', () => {
        const wrapper = render(<DemoBanner />);
        wrapper.getByText("Demo")
    })
})
