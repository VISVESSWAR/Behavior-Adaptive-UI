export function euclideanDistance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Curvature from three points
export function curvature(p1, p2, p3) {
  const a = euclideanDistance(p1, p2);
  const b = euclideanDistance(p2, p3);
  const c = euclideanDistance(p1, p3);

  if (a * b * c === 0) return 0;

  return (
    (2 *
      Math.abs(
        (p2.x - p1.x) * (p3.y - p1.y) -
        (p2.y - p1.y) * (p3.x - p1.x)
      )) /
    (a * b * c)
  );
}
