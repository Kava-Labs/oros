import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { ChatView } from '../ChatView';
import { mockChatMessages } from '../mockdata';
import { memeCoinGenIntroText } from '../config';

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
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: mockChatMessages,
    isRequesting: false,
    onSubmit: fn(),
    onReset: fn(),
    onCancel: fn(),
    errorText: '',
  },
};

export const OnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: mockChatMessages,
    isRequesting: false,
    onSubmit: fn(),
    onReset: fn(),
    onCancel: fn(),
    errorText: '',
  },
};

export const OnPhoneLarge: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: mockChatMessages,
    isRequesting: false,
    onSubmit: fn(),
    onReset: fn(),
    onCancel: fn(),
    errorText: '',
  },
};

export const NoMessages: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: [],
    isRequesting: false,
    onSubmit: fn(),
    onReset: fn(),
    onCancel: fn(),
    errorText: '',
  },
};

export const NoMessagesOnPhoneSmall: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: [],
    isRequesting: false,
    onSubmit: fn(),
    onReset: fn(),
    onCancel: fn(),
    errorText: '',
  },
};

export const RequestInProgress: Story = {
  parameters: {
    viewport: { defaultViewport: 'reset' },
  },
  args: {
    introText: memeCoinGenIntroText,
    address: '',
    chainID: '',
    messages: [],
    isRequesting: true,
    onSubmit: fn(),
    onCancel: fn(),
    onReset: fn(),
    errorText: '',
  },
};
