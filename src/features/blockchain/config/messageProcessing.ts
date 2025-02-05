import { getStoredMasks, updateStoredMasks } from '../utils/chat/helpers';
import { maskAddresses } from '../utils/chat/maskAddresses';
import { unmaskAddresses } from '../utils/chat/unmaskAddresses';

export const blockchainMessageProcessor = {
  /**
   * Pre-processes outgoing messages by masking Ethereum addresses
   * Updates the stored masks in local storage
   */
  preProcess: (message: string): string => {
    const storedMasks = getStoredMasks();
    const { output, masksToValues, valuesToMasks } = maskAddresses(
      message,
      storedMasks.valuesToMasks,
      storedMasks.masksToValues,
    );

    // Update stored masks with any new mappings
    updateStoredMasks(masksToValues, valuesToMasks);

    return output;
  },

  /**
   * Post-processes incoming messages by unmasking Ethereum addresses
   * Uses the stored masks from local storage
   */
  postProcess: (message: string): string => {
    const storedMasks = getStoredMasks();
    return unmaskAddresses(message, storedMasks.masksToValues);
  },
};
