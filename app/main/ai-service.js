// Servicio de sugerencias con Claude AI (N1)
//
// PRIVACIDAD: solo se envía el texto parcial que el usuario está escribiendo
// en el teclado inteligente. NUNCA video, landmarks faciales ni datos de
// identificación. Sin ANTHROPIC_API_KEY el servicio queda deshabilitado y
// Aura funciona normalmente con el predictor local.

const fs = require('fs');
const path = require('path');

let Anthropic = null;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (error) {
  console.warn('⚠️ @anthropic-ai/sdk no instalado — sugerencias IA deshabilitadas');
}

const MODEL_ID = 'claude-haiku-4-5-20251001'; // baja latencia, bajo coste
const MAX_SUGGESTIONS = 5;
const CACHE_MAX_SIZE = 100;

const SYSTEM_PROMPT =
  'Eres el motor de predicción de un teclado de accesibilidad para personas ' +
  'con movilidad reducida. El usuario escribe con gestos faciales, por lo que ' +
  'cada letra le cuesta esfuerzo. Dado un texto parcial en español, responde ' +
  'SOLO con un array JSON de hasta 5 continuaciones breves (1 a 4 palabras ' +
  'cada una) que completen la frase de forma natural y útil. Sin explicaciones, ' +
  'sin markdown, solo el array JSON.';

class AIService {
  constructor() {
    this.client = null;
    this.cache = new Map(); // texto normalizado → sugerencias
    this.requestInFlight = false;

    const apiKey = this.loadApiKey();
    if (apiKey && Anthropic) {
      this.client = new Anthropic({ apiKey });
      console.log('✨ AIService: sugerencias con Claude AI habilitadas');
    } else {
      console.log('ℹ️ AIService: sin ANTHROPIC_API_KEY — solo predictor local');
    }
  }

  loadApiKey() {
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

    // Cargar .env de la raíz del proyecto manualmente (sin dependencia dotenv)
    try {
      const envPath = path.join(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
        if (match) return match[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo .env:', error.message);
    }
    return null;
  }

  isAvailable() {
    return this.client !== null;
  }

  async suggest(text) {
    if (!this.client || typeof text !== 'string') return [];

    const trimmed = text.trim();
    if (trimmed.split(/\s+/).length < 3) return []; // contexto insuficiente

    const cacheKey = trimmed.toLowerCase();
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    // Una sola petición simultánea: el usuario escribe más rápido que la red
    if (this.requestInFlight) return [];
    this.requestInFlight = true;

    try {
      const response = await this.client.messages.create({
        model: MODEL_ID,
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: trimmed }]
      });

      const raw = response.content[0]?.text || '';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      let suggestions = [];
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
          .filter(s => typeof s === 'string' && s.trim().length > 0)
          .map(s => s.trim())
          .slice(0, MAX_SUGGESTIONS);
      }

      this.cache.set(cacheKey, suggestions);
      if (this.cache.size > CACHE_MAX_SIZE) {
        this.cache.delete(this.cache.keys().next().value);
      }
      return suggestions;
    } catch (error) {
      console.error('❌ AIService error:', error.message);
      return [];
    } finally {
      this.requestInFlight = false;
    }
  }
}

module.exports = AIService;
