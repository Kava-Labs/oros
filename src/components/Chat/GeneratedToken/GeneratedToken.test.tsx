import { Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GeneratedToken } from './GeneratedToken';
import { getImage } from '../../../utils/idb/idb';
import { toast } from 'react-toastify';

vi.mock('../../../utils/idb/idb', () => {
  return {
    getImage: vi.fn(),
  };
});

vi.mock('react-toastify', () => {
  return {
    toast: {
      error: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('GeneratedToken Component', () => {
  it('calls getImage and sets image data when id is provided', async () => {
    const mockImageData = 'fakeBase64DataHere';
    // Mock getImage to resolve to a defined object
    (getImage as Mock).mockResolvedValue({
      id: 'some-id',
      data: mockImageData,
    });

    render(<GeneratedToken id="some-id" about="" symbol="" name="" />);

    // Wait for the image to update
    await waitFor(() => {
      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toContain(`data:image/png;base64,${mockImageData}`);
    });

    // Ensure getImage was called once with "some-id"
    expect(getImage).toHaveBeenCalledTimes(1);
    expect(getImage).toHaveBeenCalledWith('some-id');
  });

  it('displays a toast when an error is encountered', async () => {
    // Mock getImage to resolve to a defined object
    (getImage as Mock).mockRejectedValue(new Error('some error'));

    render(<GeneratedToken id="some-id" about="" symbol="" name="" />);

    await waitFor(() => {
      screen.getByRole('img') as HTMLImageElement;
    });

    expect(toast.dismiss).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Error: failed to load requested image some error',
    );
  });
});
