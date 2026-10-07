/**
 * IBM Granite (watsonx.ai) Client Utility
 * Wraps the watsonx.ai SDK for text generation using IBM Granite models.
 */
const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');

let client = null;

function getClient() {
  if (!client) {
    client = WatsonXAI.newInstance({
      version: '2024-05-31',
      serviceUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    });
  }
  return client;
}

/**
 * Generate text via IBM Granite on watsonx.ai.
 * @param {string} prompt
 * @param {object} options - override model or parameters
 * @returns {Promise<string>} generated text
 */
async function generateText(prompt, options = {}) {
  const watsonx = getClient();

  const modelId = options.modelId || 'ibm/granite-13b-instruct-v2';
  const projectId = process.env.WATSONX_PROJECT_ID;

  const params = {
    input: prompt,
    modelId,
    projectId,
    parameters: {
      decoding_method: options.decoding_method || 'greedy',
      max_new_tokens: options.max_new_tokens || 1024,
      min_new_tokens: options.min_new_tokens || 10,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      repetition_penalty: options.repetition_penalty || 1.1,
      stop_sequences: options.stop_sequences || [],
    },
  };

  const response = await watsonx.generateText(params);
  const results = response.result?.results;
  if (!results || results.length === 0) {
    throw new Error('No results returned from watsonx.ai');
  }
  return results[0].generated_text.trim();
}

/**
 * Chat-style generation — wraps a conversation history into a Granite instruction prompt.
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {string} systemPrompt
 * @param {object} options
 */
async function chat(messages, systemPrompt = '', options = {}) {
  let prompt = '';

  if (systemPrompt) {
    prompt += `<|system|>\n${systemPrompt}\n`;
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      prompt += `<|user|>\n${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `<|assistant|>\n${msg.content}\n`;
    }
  }
  prompt += `<|assistant|>\n`;

  return generateText(prompt, { ...options, max_new_tokens: options.max_new_tokens || 1500 });
}

module.exports = { generateText, chat };
