# Critical AI Literacy — Glossary source

Edit this file, then ask Claude to push it. Everything the terminology map
shows comes from here.

**Adding a term:** copy an existing block and change the parts you need.

- `id` is the permanent address of the term. It appears in deep links such as
  `...ai-literacy-glossary/#hallucination`, so once a term is published, do not
  change its id — any links you gave students would break. Renaming the term's
  heading is fine; the id can stay as it is.
- `group` must be one of the keys in the Groups table below.
- `connects` lists the other terms it links to, by id, separated by commas.
  Listing a connection on either term is enough — the two directions are the
  same line on the map.
- The definition is everything after the bulleted fields, and is used exactly
  as written. You can wrap it over several lines; they are joined back into one
  paragraph.

Mentions of other glossary terms inside a definition become clickable
automatically, so there is no need to mark them up. "AI" on its own is
deliberately never linked.

## Groups

| Key | Label | Colour |
| --- | --- | --- |
| `technical` | How AI works | `#7F77DD` |
| `human` | Human effects | `#D85A30` |
| `societal` | Societal issues | `#1D9E75` |

## Terms

### AI Agent

- id: `ai-agent`
- group: `technical`
- connects: `chain-of-thought`, `large-language-model`, `recursive-self-improvement`

An AI agent is a computer program that combines large language models, chain of thought reasoning, and software tools such as web search, calculators, and coding programs. Given a goal by a user (e.g., "build me a website"), the program uses these tools to perform multi-step actions that accomplish the goal. This process involves repeatedly trying actions and checking the result.

### AI Bias

- id: `ai-bias`
- group: `societal`
- connects: `large-language-model`

AI Bias is when large language models or AI systems produce responses that treat some groups unfairly, usually because the data the model or AI system was trained on reflects a similar bias.

### AI Energy Use

- id: `ai-energy-use`
- group: `societal`
- connects: `chain-of-thought`, `chatbot`

Running AI systems consumes electricity. A single chatbot prompt uses a relatively small amount of energy, like running a microwave for 8 seconds. But Chain of Thought reasoning requests, long back-and-forth conversations, and image or video generation use significantly more energy than standard digital tools.

### AI Psychosis

- id: `ai-psychosis`
- group: `human`
- connects: `anthropomorphism`, `chatbot`, `feedback-loop`, `llm-sycophancy`

Although not an official medical diagnosis, the term AI Psychosis has recently been used to describe situations where heavy chatbot use, LLM sycophancy, and feedback loops drive someone's false or delusional beliefs.

### Anthropomorphism

- id: `anthropomorphism`
- group: `human`
- connects: `ai-psychosis`, `chain-of-thought`, `feedback-loop`, `large-language-model`

Anthropomorphism is the tendency to attribute human characteristics—thoughts, feelings, and intentions—to non-human things. It can happen with large language models because they produce fluent, first-person language, which makes it seem like they have minds. And the language we use to describe AI systems often encourages this. For example, we call text completions "thoughts". Believing there is a mind behind the machine can cause users to rely on what an AI says, contributing to feedback loops and, in rare cases, AI psychosis.

### Artificial Intelligence

- id: `artificial-intelligence`
- group: `technical`
- connects: `large-language-model`, `machine-learning`

Artificial Intelligence (AI) is any computer program that mimics some aspect of intelligent human behaviour. Self-driving cars, computer chess programs, and large language models like GPT are all examples of AI systems. Many AI systems are built using machine learning.

### Chain of Thought

- id: `chain-of-thought`
- group: `technical`
- connects: `ai-agent`, `ai-energy-use`, `anthropomorphism`, `large-language-model`

Chain of thought (CoT) is a process by which large language models solve problems by breaking them down into steps and generating answers (so-called "thoughts") for each step. These intermediate answers provide context that tends to improve the model's final answer. Chain of thought started as a prompting method, but now many large language models are trained to generate answers using chains of thought without an explicit instruction to do so. Note: the term "chain of thought" is anthropomorphic; the "thoughts" are not thoughts in a human sense—they are text completions that do not necessarily reflect how the model produced an answer.

### Chatbot

- id: `chatbot`
- group: `technical`
- connects: `ai-energy-use`, `ai-psychosis`, `data-privacy`, `feedback-loop`, `large-language-model`

Chatbots are software systems that exchange natural language messages with users in conversational turns. Early chatbots like Eliza produced preprogrammed or rule-based responses. Since the release of ChatGPT in 2022, many chatbots use large language models to produce responses on the fly.

### Cognitive Debt

- id: `cognitive-debt`
- group: `human`
- connects: `cognitive-surrender`, `large-language-model`

Cognitive Debt refers to deficits in learning, memory, and decision-making resulting from excessive use of large language models. For example, studies have shown that students who write essays with ChatGPT remember little of what they wrote.

### Cognitive Surrender

- id: `cognitive-surrender`
- group: `human`
- connects: `cognitive-debt`, `hallucination`, `information-literacy`, `large-language-model`

Cognitive Surrender refers to an uncritical reliance on large language models—in particular, accepting their output as fact without reviewing or critiquing it. Cognitive surrender may result in cognitive debt.

### Data Privacy

- id: `data-privacy`
- group: `societal`
- connects: `chatbot`

Data Privacy refers to your right to control who can see, store, and use information about you. Anything you type into an AI chatbot leaves your device and is processed on a tech company's servers, often in another country. This makes the information no longer private in the way a note on your own computer is. Generally speaking, sensitive data such as health or employee records should not be shared with free, publicly available AI systems.

### Feedback Loop

- id: `feedback-loop`
- group: `human`
- connects: `ai-psychosis`, `anthropomorphism`, `chatbot`, `llm-sycophancy`

In the context of human-AI interaction, a feedback loop can occur when a chatbot's sycophantic responses encourage a user to pursue a flawed idea (e.g., the Earth is flat) in future messages, which the chatbot then agrees with again. Over successive turns, the user comes to view the flawed idea as established.

### GPT

- id: `gpt`
- group: `technical`
- connects: `large-language-model`, `transformers`

GPT stands for Generative Pre-trained Transformer—it generates text, it was pre-trained on a huge amount of text from the internet, and it is built on a design called a transformer. ChatGPT is a user interface that allows people to interact with OpenAI's latest GPT-based AI language model.

### Hallucination

- id: `hallucination`
- group: `human`
- connects: `cognitive-surrender`, `information-literacy`, `large-language-model`, `metacognition`

Hallucination refers to a large language model confidently stating something as true that is factually incorrect. Accepting hallucinations as facts may reflect cognitive surrender.

### Information Literacy

- id: `information-literacy`
- group: `human`
- connects: `cognitive-surrender`, `hallucination`, `large-language-model`

Information Literacy is the ability to find, evaluate, understand, and use information effectively and responsibly. It includes knowing how to identify reliable and relevant sources, assess the credibility of information, use evidence to support ideas and decisions, and appropriately acknowledge the work of others. In the case of large language models, information literacy guards against cognitive surrender and the acceptance of hallucinations.

### Large Language Model

- id: `large-language-model`
- group: `technical`
- connects: `ai-agent`, `ai-bias`, `anthropomorphism`, `artificial-intelligence`, `chain-of-thought`, `chatbot`, `cognitive-debt`, `cognitive-surrender`, `gpt`, `hallucination`, `information-literacy`, `llm-sycophancy`, `metacognition`, `neural-network`, `probabilistic-deterministic`, `prompt`, `reinforcement-learning`, `transformers`

Large Language Models (LLMs) are computer programs (specifically, transformers) trained on huge amounts of online text to produce language in response to language. ChatGPT, Claude, and Gemini are systems that allow users to interact with large language models.

### LLM Sycophancy

- id: `llm-sycophancy`
- group: `human`
- connects: `ai-psychosis`, `feedback-loop`, `large-language-model`, `reinforcement-learning`

LLM Sycophancy (pronounced like SIK-uh-fuhn-see) is the tendency for large language models to excessively agree with, flatter, and validate users instead of providing objective information. Sycophancy is partly caused by reinforcement learning from human feedback: human raters like responses that agree with them, so training makes agreeable responses from LLMs more likely.

### Machine Learning

- id: `machine-learning`
- group: `technical`
- connects: `artificial-intelligence`, `neural-network`, `reinforcement-learning`

Machine learning is a branch of computer science where a system learns patterns from data rather than being programmed to follow explicit rules. These patterns allow the system to make predictions about new data. For example, a system can recognize pictures of cats because it's learned patterns in images associated with the presence of cats. Many contemporary machine learning approaches use neural networks.

### Metacognition

- id: `metacognition`
- group: `human`
- connects: `hallucination`, `large-language-model`

Metacognition refers to our ability to think about our thoughts and the limits of our knowledge. Large language models lack this ability, which can result in hallucinations.

### Neural Network

- id: `neural-network`
- group: `technical`
- connects: `large-language-model`, `machine-learning`, `transformers`

Neural networks are computer programs that learn from training data using machine learning. They are made up of many simple processing units connected in layers. Training adjusts the strength of the connections between units so that different inputs flow through the network to the most likely output. For example, large language models are not programmed to complete the text "The ball rolled down the ..." with "hill". The word "hill" is produced because the connection strengths throughout the network—learned from a huge amount of online text—make it the most likely continuation of that input.

### Probabilistic / Deterministic

- id: `probabilistic-deterministic`
- group: `technical`
- connects: `large-language-model`

Probabilistic versus Deterministic: Unlike a calculator, which always produces predictable (deterministic) output based on what you enter, the output of large language models is probabilistic, varying between interactions.

### Prompt

- id: `prompt`
- group: `technical`
- connects: `large-language-model`

Prompt refers to the spoken or written command you give a large language model or AI system to get a response.

### Recursive Self-improvement

- id: `recursive-self-improvement`
- group: `societal`
- connects: `ai-agent`

Recursive self-improvement (RSI) is a theoretical process in which an AI system builds a more capable successor, with each successor getting better at this process. Because the improvements feed back into the creation of even better AI (i.e., they are recursive), some researchers argue it could lead to a rapid increase in the capabilities of AI systems. To date, some AI Agents write code to help build better AI, but autonomous recursive self-improvement has not been demonstrated.

### Reinforcement Learning

- id: `reinforcement-learning`
- group: `technical`
- connects: `large-language-model`, `llm-sycophancy`, `machine-learning`

Reinforcement learning is a machine learning method in which an AI system learns by trial and error. The AI system produces an output, receives a reward signal indicating how good that output was, and adjusts its behaviour to make outputs that receive high rewards more likely in the future. For large language models, the reward often comes from human raters who provide feedback that tells the system how good or bad the response was. This is called reinforcement learning from human feedback (RLHF).

### Transformers

- id: `transformers`
- group: `technical`
- connects: `gpt`, `large-language-model`, `neural-network`

Transformers are the type of neural network that large language models are built from. Transformers excel at keeping track of context in language—for example, the plot and characters of a story. This allows them to produce long paragraphs of contextually correct language.
