import { useSyncExternalStore } from 'react';
import { toolCallStreamStore } from '../store';
import { useAppContext } from '../context/useAppContext';

export const ToolCallProgressCards = () => {
  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );
  const { registry } = useAppContext();

  if (!toolCallStreams.length) return null;

  return toolCallStreams.map((toolCall) => {
    const operation = registry.get(toolCall.function.name ?? '');
    if (operation && operation.inProgressComponent) {
      const Component = operation.inProgressComponent();
      return <Component key={toolCall.id} {...toolCall} />;
    }
    return null;
  });
};
