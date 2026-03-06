import json
import pandas as pd

LOG_FILE = "logs/usability_metrics.json"

data = json.load(open(LOG_FILE))

df = pd.DataFrame(data)

print("\nTotal samples:", len(df))

baseline = df[df["adaptive_enabled"] == False]
adaptive = df[df["adaptive_enabled"] == True]

metrics = [
    "misclick_rate",
    "task_completion_time",
    "total_clicks",
    "idle_time"
]

print("\n===== UX COMPARISON =====")

results = []

for m in metrics:

    base_mean = baseline[m].mean()
    adapt_mean = adaptive[m].mean()

    improvement = ((base_mean - adapt_mean) / base_mean) * 100

    results.append([m, base_mean, adapt_mean, improvement])

table = pd.DataFrame(results, columns=[
    "metric",
    "baseline",
    "adaptive",
    "improvement_%"
])

print(table)

print("\n===== PER USER ANALYSIS =====")

users = df["user_id"].unique()

for u in users:

    user_df = df[df["user_id"] == u]

    base = user_df[user_df["adaptive_enabled"] == False]
    adapt = user_df[user_df["adaptive_enabled"] == True]

    if len(base) == 0 or len(adapt) == 0:
        continue

    print("\nUser:", u)

    for m in metrics:

        b = base[m].mean()
        a = adapt[m].mean()

        imp = ((b - a) / b) * 100

        print(f"{m}: {b:.2f} → {a:.2f}  ({imp:.1f}% improvement)")