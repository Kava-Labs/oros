import { useSyncExternalStore } from 'react';
import { useAppContext } from '../../../core/context/useAppContext';

export const ToolCallProgressCards = ({
  onRendered,
}: {
  onRendered: () => void;
}) => {
  const { toolCallStreamStore, registry } = useAppContext();

  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );

  if (!toolCallStreams.length) return null;

  return toolCallStreams.map((toolCall) => {
    const operation = registry.get(toolCall.function.name ?? '');
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
