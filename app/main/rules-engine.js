// Rule Engine for Aura
class RuleEngine {
  constructor() {
    this.rules = [];
  }

  // options.priority (número, opcional): mayor número = mayor prioridad.
  // options.anyOf (array, opcional): la regla se activa si CUALQUIER gesto
  // listado es true (OR). Si está presente, ignora condition.
  // Reglas sin options se comportan exactamente igual que antes (AND, orden de inserción).
  addRule(condition, action, options = {}) {
    this.rules.push({
      condition,
      action,
      priority: typeof options.priority === 'number' ? options.priority : 0,
      anyOf: Array.isArray(options.anyOf) && options.anyOf.length > 0 ? options.anyOf : null,
      order: this.rules.length
    });
  }

  evaluate(gestureData) {
    // Mayor prioridad primero; a igual prioridad, orden de inserción
    const sorted = [...this.rules].sort((a, b) =>
      b.priority - a.priority || a.order - b.order
    );

    for (const rule of sorted) {
      if (this.checkRule(rule, gestureData)) {
        return rule.action;
      }
    }
    return null;
  }

  checkRule(rule, gestureData) {
    // Modo OR: basta con que uno de los gestos listados esté activo
    if (rule.anyOf) {
      return rule.anyOf.some(gesture => gestureData[gesture] === true);
    }
    return this.checkCondition(rule.condition, gestureData);
  }

  checkCondition(condition, gestureData) {
    // Check if all conditions in the rule are met by the gestureData (AND)
    for (const [key, value] of Object.entries(condition)) {
      if (gestureData[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

module.exports = RuleEngine;
