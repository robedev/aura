/**
 * Motor de predicción de texto para Aura Smart Keyboard
 * Utiliza un diccionario de frecuencias y aprendizaje local
 */

class PredictionEngine {
  constructor() {
    this.dictionary = [];
    this.trie = new TrieNode();
    this.userDictionary = [];
    this.maxSuggestions = 5;
    this.bigrams = {}; // Simple next-word prediction mapping
    this.isLoaded = false;
  }

  // Cargar diccionario desde archivo JSON
  async loadDictionary(path = '../data/spanish-dict.json') {
    try {
      const response = await fetch(path);
      const words = await response.json();
      
      // Inicializar el Trie con las palabras ordenadas por frecuencia implícita
      words.forEach(word => {
        this.addWordToTrie(word.toLowerCase());
        this.dictionary.push(word.toLowerCase());
      });
      
      this.isLoaded = true;
      console.log(`🧠 PredictionEngine: Cargadas ${words.length} palabras.`);
      
      // Agregar algunas frases comunes al bigram para inicio rápido
      this.seedCommonBigrams();
      
    } catch (error) {
      console.warn('PredictionEngine: No se pudo cargar el diccionario, usando modo aprendizaje cero.', error);
      // Fallback básico
      ['hola', 'si', 'no', 'gracias', 'adios'].forEach(w => this.addWordToTrie(w));
      this.isLoaded = true;
    }
  }

  addWordToTrie(word) {
    let node = this.trie;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.word = word;
  }

  // Aprender nueva palabra del usuario
  learn(text) {
    if (!text || typeof text !== 'string') return;
    
    // Limpiar y dividir en palabras
    const words = text.toLowerCase().trim().split(/\s+/);
    
    // 1. Aprender palabras individuales nuevas
    words.forEach(word => {
      // Solo aprender si tiene caracteres válidos y long > 1
      if (/^[a-záéíóúñ]+$/.test(word) && word.length > 1) {
        if (!this.dictionary.includes(word) && !this.userDictionary.includes(word)) {
          this.addWordToTrie(word);
          this.userDictionary.push(word);
          // TODO: Persistir userDictionary
        }
      }
    });

    // 2. Aprender patrones de palabras (Bigramas)
    for (let i = 0; i < words.length - 1; i++) {
      const current = words[i];
      const next = words[i + 1];
      
      if (!this.bigrams[current]) {
        this.bigrams[current] = {};
      }
      
      if (!this.bigrams[current][next]) {
        this.bigrams[current][next] = 0;
      }
      this.bigrams[current][next]++;
    }
  }

  // Obtener predicciones basadas en el prefijo actual
  predict(prefix) {
    if (!this.isLoaded || !prefix) return [];
    
    prefix = prefix.toLowerCase();
    let node = this.trie;
    
    // Navegar hasta el final del prefijo
    for (const char of prefix) {
      if (!node.children[char]) return []; // No hay coincidencias
      node = node.children[char];
    }
    
    // Buscar palabras completas desde aquí (DFS)
    const suggestions = [];
    this.collectWords(node, suggestions);
    
    // Prioridad a palabras más cortas que coinciden (heurística simple)
    // En un sistema mejorado, cada nodo tendría un "score" de peso
    return suggestions.sort((a, b) => a.length - b.length).slice(0, this.maxSuggestions);
  }

  // Obtener predicción de la siguiente palabra basada en la anterior
  predictNextWord(lastWord) {
    if (!lastWord) return [];
    lastWord = lastWord.toLowerCase().trim();
    
    if (this.bigrams[lastWord]) {
      // Ordenar siguientes palabras por frecuencia
      return Object.entries(this.bigrams[lastWord])
        .sort((a, b) => b[1] - a[1]) // Mayor frecuencia primero
        .map(entry => entry[0])
        .slice(0, this.maxSuggestions);
    }
    
    return [];
  }
  
  collectWords(node, suggestions) {
    if (suggestions.length >= 20) return; // Límite de búsqueda profundo para rendimiento
    
    if (node.isEndOfWord) {
      suggestions.push(node.word);
    }
    
    for (const char in node.children) {
      this.collectWords(node.children[char], suggestions);
    }
  }

  seedCommonBigrams() {
    const common = [
      ['hola', 'como'], ['como', 'estas'],
      ['yo', 'quiero'], ['no', 'puedo'],
      ['estoy', 'bien'], ['muchas', 'gracias'],
      ['por', 'favor'], ['buenas', 'noches'],
      ['hasta', 'luego'], ['me', 'gusta']
    ];
    
    common.forEach(([w1, w2]) => {
      if (!this.bigrams[w1]) this.bigrams[w1] = {};
      this.bigrams[w1][w2] = 5; // Peso inicial alto
    });
  }
}

class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.word = null;
  }
}

// Exportar para uso modular o global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictionEngine;
} else {
  window.PredictionEngine = PredictionEngine;
}
