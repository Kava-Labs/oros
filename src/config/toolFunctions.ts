export const navigateToPage = (url: string) => {
  window.parent.postMessage(
    {
      namespace: 'KAVA_CHAT',
      type: 'UI_AUTOMATION/V1',
      payload: {
        commands: [
          {
            action: 'NAVIGATE',
            path: url,
          },
        ],
      },
    },
    '*',
  );
};
