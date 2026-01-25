def classify_persona(f):
    """
    f = {
      'speed': float,
      'idle': float,
      'hesitation': float,
      'entropy': float
    }
    """

    s = f["speed"]
    i = f["idle"]
    h = f["hesitation"]
    e = f["entropy"]

    # novice / elderly
    if s < 0.4 and (i > 0.6 or h > 0.6):
        return "novice_old", 0.9

    # expert
    if s > 0.7 and i < 0.3 and h < 0.3 and e > 0.6:
        return "expert", 0.9

    # intermediate (default)
    return "intermediate", 0.7
