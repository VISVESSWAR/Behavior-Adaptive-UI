export class PersonaValidator {
  constructor(windowSize = 8, minConfidence = 0.6) {
    this.windowSize = windowSize;
    this.minConfidence = minConfidence;
    this.history = [];
  }

  update(rawPersona, confidence) {
    if (confidence < this.minConfidence) {
      return { persona: rawPersona, stable: false };
    }

    this.history.push(rawPersona);

    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const counts = {};
    this.history.forEach(p => {
      counts[p] = (counts[p] || 0) + 1;
    });

    const finalPersona = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );

    const stability = counts[finalPersona] / this.history.length;

    return {
      persona: finalPersona,
      stable: stability >= 0.6
    };
  }
}
