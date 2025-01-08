export const navigateToPage = async (url: string) => {
  console.log(`Navigate to ${url}`);
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
