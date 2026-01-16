/**
 * AI Generator Service - OpenAI GPT-4 integration
 * 
 * PURPOSE: Generate analysis using GPT-4 API
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { buildSystemPrompt, buildUserPrompt, getJSONSchema } from '../utils/promptBuilder.ts';
import { validateResponse } from '../utils/responseValidator.ts';

export class AIGeneratorService {
  private readonly OPENAI_API_KEY: string;
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly MODEL = 'gpt-3.5-turbo'; // Using gpt-3.5-turbo for wider availability
  private readonly MAX_RETRIES = 2;

  constructor() {
    this.OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
    if (!this.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
  }

  async generateAnalysis(gameData: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${this.MAX_RETRIES}`);
          await this.delay(1000 * attempt);
        }

        const response = await this.callOpenAI(gameData);
        const validation = validateResponse(response);

        if (!validation.valid) {
          throw new Error(`Invalid response structure: ${validation.errors?.join(', ')}`);
        }

        return validation.sanitized;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ Attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    throw new Error(`Failed after ${this.MAX_RETRIES + 1} attempts: ${lastError?.message}`);
  }

  private async callOpenAI(gameData: any): Promise<any> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(gameData);
    const jsonSchema = getJSONSchema();

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt + '\n\nReturn JSON in this exact format:\n' + jsonSchema },
    ];

    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }
  }


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
