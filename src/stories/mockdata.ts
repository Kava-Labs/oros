import type { ChatCompletionMessageParam } from 'openai/resources/index';

export const mockChatMessages: ChatCompletionMessageParam[] = [
  {
    role: 'assistant',
    content: `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics"`,
  },
  {
    role: 'user',
    content: `Can you create a fun name for my token about dogs going to the moon?`,
  },
  {
    role: 'assistant',
    content: `Absolutely! How about calling your token "LunaBark"? It's a playful nod to both lunar missions ("Luna" meaning moon) and the joy of dogs barking. "LunaBark" suggests an adventurous journey of our canine companions aiming for the moon, perfectly capturing the spirit of excitement and whimsy in the crypto world! 🚀🐶`,
  },
  {
    role: 'user',
    content: `I love it. Can you make a token symbol that is four characters now?`,
  },
  {
    role: 'assistant',
    content: `I'm glad you liked the name "LunaBark"! For a token symbol that's four characters, you could use "BARK." It’s catchy, easy to remember, and perfectly encapsulates the dog theme of your token! 🐾`,
  },
  { role: 'user', content: `What would be a fun catchy description for BARK?` },
  {
    role: 'assistant',
    content: `Absolutely! Here's a catchy description for your BARK token: "Unleashing a cosmic canine adventure! 🌕🐕 BARK token propels your portfolio beyond the stars with the spirit of our four-legged explorers. Join the pack as we howl at the moon, fetching gains and wagging tails all along the blockchain boulevard. Ready, set, BARK to the moon!" 🚀`,
  },
];
