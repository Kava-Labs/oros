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

const md = `
# All Markdown Elements Example

This document demonstrates **all Markdown supported elements** using *Lorem Ipsum* placeholder text.

---

## 1. Headers (H1 - H6)

# Header Level 1
## Header Level 2
### Header Level 3
#### Header Level 4
##### Header Level 5
###### Header Level 6

---

## 2. Paragraphs & Text Formatting

Lorem ipsum dolor sit amet, *consectetur* adipiscing elit. **Pellentesque** habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. ***Vestibulum*** ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.

### 2.1. Inline Code

Here is an example of inline code: \`console.log("Hello, world!");\`



## 3. Blockquotes

> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
> 
> > **Nested Blockquote:** Fusce dapibus, tellus ac cursus commodo.


## 4. Lists

### 4.1. Unordered List

- Lorem ipsum dolor sit amet
  - Consectetur adipiscing elit
  - Sed do eiusmod tempor
    - Nested item 1
    - Nested item 2
- Vestibulum ante ipsum primis
- Cras mattis consectetur purus sit amet fermentum

### 4.2. Ordered List

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
   1. Nested ordered item one
   2. Nested ordered item two
3. Sed do eiusmod tempor incididunt

### 4.3. Task List

- [x] Task 1 - Lorem ipsum
- [ ] Task 2 - Dolor sit amet
- [ ] Task 3 - Consectetur adipiscing


## 5. Code Blocks

### 5.1. Fenced Code Block (No Language)

\`\`\`
function helloWorld() {
    console.log("Hello, World!");
}
\`\`\`

### 5.2. Fenced Code Block with Syntax Highlighting (JavaScript)

\`\`\`javascript
// This is a JavaScript code example
const greet = (name) => {
  return \`Hello, ${name}!\`;
};


const veryLongFunctionNameWithAVeryLongStringInside = () => {
  return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et';
}

console.log(greet("Lorem Ipsum"));
\`\`\`

## 6. Links

### 6.1. Inline Link

Check out [OpenAI's website](https://www.openai.com) for more info.

### 6.2. Reference Style Link

Lorem ipsum dolor sit amet [OpenAI][openai-link] consectetur.

[openai-link]: https://www.openai.com


## 7. Tables

| Header 1      | Header 2       | Header 3     |
|---------------|----------------|--------------|
| Lorem ipsum   | dolor sit amet | consectetur  |
| adipiscing    | elit           | sed do       |
| eiusmod       | tempor         | incididunt   |



## 8. Strikethrough

~~This text is struck through.~~

---

## 9. Footnotes

Here is a sentence with a footnote.[^1]

[^1]: Lorem ipsum dolor sit amet, consectetur adipiscing elit.

---

## 10. Definition Lists

Term 1  
:   Definition for term 1.

Term 2  
:   Definition for term 2 with some **bold text** and *italic text*.

---

## 11. Details/Summary (HTML)

<details>
  <summary>Click to expand - Lorem Ipsum Details</summary>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
</details>

`;

export const markDownSpecChatMessages = [
  {
    role: 'user',
    content:
      'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...',
  },
  {
    role: 'assistant',
    reasoningContent:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.',
    content: md,
  },
] as ChatCompletionMessageParam[];
