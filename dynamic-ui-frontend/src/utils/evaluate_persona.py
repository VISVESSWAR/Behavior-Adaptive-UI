import pandas as pd
from persona_classifier import classify_persona
from sklearn.metrics import classification_report, confusion_matrix

df = pd.read_csv("test.csv")

y_true, y_pred = [], []

for _, r in df.iterrows():
    f = {
        "speed": r.speed,
        "idle": r.idle,
        "hesitation": r.hesitation,
        "entropy": r.entropy
    }
    p, _ = classify_persona(f)
    y_true.append(r.label)
    y_pred.append(p)

print(confusion_matrix(y_true, y_pred))
print(classification_report(y_true, y_pred))
