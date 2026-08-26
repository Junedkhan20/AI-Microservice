export const getLLMResponse = async (prompt: string): Promise<{ response: string; latency: number }> => {
  const startTime = Date.now();
  console.log('Simulating LLM API call with prompt:', prompt);

  // In a real scenario, this would involve:
  // 1. Making an API call to a third-party LLM (e.g., OpenAI, Anthropic) or a local LLM (Ollama).
  // 2. Passing the constructed prompt to the LLM.
  // 3. Receiving the LLM's generated response.

  // --- SIMULATION START ---
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100)); // Simulate varying LLM response times (100-600ms)
  const simulatedResponse = `This is a simulated LLM response to your query: "${prompt}".`;
  // --- SIMULATION END ---

  const endTime = Date.now();
  const latency = endTime - startTime;

  return { response: simulatedResponse, latency };
};
