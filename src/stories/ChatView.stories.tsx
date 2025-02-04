import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChatView, ChatViewProps } from '../components/ChatView';
import { mockChatMessages } from './mockdata';
import { defaultIntroText } from '../features/blockchain/config';
import type { Decorator } from '@storybook/react';
import { ThemeProvider } from '../shared/theme/themeProvider';
import { AppContextProvider } from '../core/context/AppContextProvider';
import { TextStreamStore } from '../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../core/stores/messageHistoryStore';
import { WalletStore } from '../features/blockchain/stores/walletStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const toolCallStreamStore = new ToolCallStreamStore();
export const messageHistoryStore = new MessageHistoryStore();
export const walletStore = new WalletStore();

const withProviders =
  (
    _ = {
      isRequesting: false,
      isReady: true,
      errorText: '',
    },
  ): Decorator =>
  (Story) => (
    <ThemeProvider>
      <AppContextProvider
        progressStore={progressStore}
        messageStore={messageStore}
        toolCallStreamStore={toolCallStreamStore}
        walletStore={walletStore}
        messageHistoryStore={messageHistoryStore}
      >
        <Story />
      </AppContextProvider>
    </ThemeProvider>
  );

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Kava/ChatView',
  component: ChatView,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  //tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  //argTypes: {
  //  backgroundColor: { control: 'color' },
  //},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  //args: { onClick: fn() },
  decorators: [withProviders()],
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

const args: ChatViewProps = {
  introText: defaultIntroText,
  messages: mockChatMessages,
  onSubmit: fn(),
  onReset: fn(),
  onCancel: fn(),
  cautionText: '',
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args,
};

export const OnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args,
  decorators: [
    withProviders({
      isRequesting: false,
      isReady: true,
      errorText: '',
    }),
  ],
};

export const OnPhoneLarge: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
  args,
};

export const NoMessages: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args: {
    ...args,
    messages: [],
  },
};

export const NoMessagesOnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    ...args,
    messages: [],
  },
};

export const RequestInProgress: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args: {
    ...args,
    messages: [],
  },
  decorators: [
    withProviders({
      isRequesting: true,
      isReady: true,
      errorText: '',
    }),
  ],
};
