import crypto from "crypto";

// Large prime for finite field arithmetic (secp256k1 prime – standard safe choice)
const PRIME = BigInt(
  "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"
);

// Safe modulo operation
const mod = (x) => ((x % PRIME) + PRIME) % PRIME;

// Shamir split: polynomial coefficients f(x) = a0 + a1x + a2x² + ... (a0=secret, ai=random)
export function shamirSplit(secretBuffer, n, k) {
  const secret = BigInt("0x" + secretBuffer.toString("hex"));

  if (k > n) throw new Error("Threshold k cannot exceed n");

  // Polynomial coefficients: f(x) = a0 + a1x + a2x² + ... where a0=secret
  const coeffs = [secret];
  for (let i = 1; i < k; i++) {
    coeffs.push(
      BigInt("0x" + crypto.randomBytes(32).toString("hex")) % PRIME
    );
  }

  const shares = [];
  for (let x = 1; x <= n; x++) {
    let y = 0n;
    const bx = BigInt(x);

    for (let i = 0; i < coeffs.length; i++) {
      y = mod(y + coeffs[i] * (bx ** BigInt(i)));
    }

    shares.push({
      x,
      y: y.toString() // stored as string for DB safety
    });
  }

  return shares;
}

// Modular inverse computation with safe exponentiation
function modPow(base, exp) {
  let result = 1n;
  base = mod(base);

  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base);
    base = mod(base * base);
    exp >>= 1n;
  }
  return result;
}

function invert(a) {
  // Fermat's Little Theorem: a^(p−2) mod p
  return modPow(a, PRIME - 2n);
}

/* ============================
   LAGRANGE RECONSTRUCTION
   ============================ */
export function lagrange(shares) {
  let secret = 0n;

  for (let j = 0; j < shares.length; j++) {
    const xj = BigInt(shares[j].x);
    const yj = BigInt(shares[j].y);

    let lj = 1n;

    for (let m = 0; m < shares.length; m++) {
      if (m !== j) {
        const xm = BigInt(shares[m].x);
        lj = mod(lj * mod(0n - xm) * invert(xj - xm));
      }
    }

    secret = mod(secret + yj * lj);
  }

  // 🔑 CRITICAL: pad to fixed 32-byte length
  const hex = secret.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}
