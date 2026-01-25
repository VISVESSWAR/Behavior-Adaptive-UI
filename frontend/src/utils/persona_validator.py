from collections import deque

class PersonaValidator:
    def __init__(self, win=10, min_conf=0.6):
        self.win = win
        self.min_conf = min_conf
        self.hist = deque(maxlen=win)

    def update(self, persona, conf):
        if conf >= self.min_conf:
            self.hist.append(persona)

        if not self.hist:
            return persona, "unstable"

        final = max(set(self.hist), key=self.hist.count)
        stability = self.hist.count(final) / len(self.hist)

        status = "stable" if stability >= 0.6 else "unstable"
        return final, status
