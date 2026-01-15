// Rule Engine for Aura
class RuleEngine {
  constructor() {
    this.rules = [];
  }

  addRule(condition, action) {
    this.rules.push({ condition, action });
  }

  evaluate(gestureData) {
    // Check each rule
    for (const rule of this.rules) {
      if (this.checkCondition(rule.condition, gestureData)) {
        return rule.action;
      }
    }
    return null;
  }

  checkCondition(condition, gestureData) {
    // Check if all conditions in the rule are met by the gestureData
    for (const [key, value] of Object.entries(condition)) {
      if (gestureData[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

module.exports = RuleEngine;