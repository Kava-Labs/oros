import { useSyncExternalStore } from 'react';
import { useAppContext } from '../context/useAppContext';
import { messageRegistry } from '../../features/blockchain/config/models';

export const ToolCallProgressCards = ({
  onRendered,
}: {
  onRendered: () => void;
}) => {
  const { toolCallStreamStore } = useAppContext();

  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );

  if (!toolCallStreams.length) return null;

  return toolCallStreams.map((toolCall) => {
    const operation = messageRegistry.get(toolCall.function.name ?? '');
    if (operation && operation.inProgressComponent) {
      const Component = operation.inProgressComponent();
      return (
        <Component
          key={toolCall.id}
          toolCall={toolCall}
          onRendered={onRendered}
        />
      );
    }
    return null;
  });
};
