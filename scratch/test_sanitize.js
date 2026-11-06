import { sanitizeAIResponse } from '../core/aiBrain.js';

const tests = [
  '<|start|>assistant<|channel|>final',
  '<|start|>assistant<|channel|>',
  '<think>Let me think about hilo...</think> Hubie is predicting higher!',
  '```json\n{"choice":"higher"}\n``` Higher on the turn squad!',
  'Hubie: Let us hop across the river squad!',
  'Reading the deck! Hubie is going with HIGHER squad!',
  '<|im_start|>assistant\nWe take the cashout at 2.5x!<|im_end|>',
  'assistant',
  '<|channel|>'
];

for (const t of tests) {
  console.log('INPUT: ', JSON.stringify(t));
  console.log('OUTPUT:', JSON.stringify(sanitizeAIResponse(t)));
  console.log('---');
}

