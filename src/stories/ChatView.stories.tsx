import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChatView, ChatViewProps } from '../core/components/ChatView';
import { mockChatMessages, markDownSpecChatMessages } from './mockdata';
import type { Decorator } from '@storybook/react';
import { ThemeProvider } from '../shared/theme/themeProvider';
import { AppContextProvider } from '../core/context/AppContextProvider';
import { TextStreamStore } from '../core/stores/textStreamStore';
import {
  ChatMessage,
  MessageHistoryStore,
} from '../core/stores/messageHistoryStore';

const messageStore = new TextStreamStore();
const progressStore = new TextStreamStore();
const messageHistoryStore = new MessageHistoryStore();
const thinkingStore = new TextStreamStore();
const errorStore = new TextStreamStore();

const withProviders =
  (
    messages: ChatMessage[],
    _ = {
      isRequesting: false,
      isReady: true,
    },
  ): Decorator =>
  (Story) => {
    if (messages.length > 0) {
      messageHistoryStore.setMessages(messages);
    } else {
      messageHistoryStore.reset();
    }

    return (
      <ThemeProvider>
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <Story />
        </AppContextProvider>
      </ThemeProvider>
    );
  };

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
  decorators: [withProviders([])],
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

const args: ChatViewProps = {
  onMenu: fn(),
  onPanelOpen: fn(),
  isPanelOpen: false,
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args,
  decorators: [
    withProviders(mockChatMessages, {
      isRequesting: false,
      isReady: true,
    }),
  ],
};

export const MarkdownSpec: Story = {
  parameters: {
    parameters: {
      viewport: { defaultViewport: 'reset' },
    },
  },
  args,
  decorators: [
    withProviders(markDownSpecChatMessages, {
      isRequesting: false,
      isReady: true,
    }),
  ],
};

export const OnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args,
  decorators: [
    withProviders(mockChatMessages, {
      isRequesting: false,
      isReady: true,
    }),
  ],
};

export const OnPhoneLarge: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
  args,
  decorators: [
    withProviders(mockChatMessages, {
      isRequesting: false,
      isReady: true,
    }),
  ],
};

export const NoMessages: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args,
};

export const NoMessagesOnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args,
};

export const RequestInProgress: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args,
  decorators: [
    withProviders(mockChatMessages, {
      isRequesting: true,
      isReady: true,
    }),
  ],
};
