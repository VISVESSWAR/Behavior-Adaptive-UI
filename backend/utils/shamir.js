import crypto from "crypto";

const PRIME = BigInt(
  "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"
);

const mod = (x) => ((x % PRIME) + PRIME) % PRIME;

export function shamirSplit(secretBuffer, n, k) {
  const secret = BigInt("0x" + secretBuffer.toString("hex"));
  console.log("🔐 Original Secret (hex):", secretBuffer.toString("hex"));
  console.log("🔢 Secret as BigInt:", secret.toString());

  if (k > n) throw new Error("Threshold k cannot exceed n");

  const coeffs = [secret];
  console.log("\n📐 Polynomial Coefficients:");
  console.log("a0 (secret):", coeffs[0].toString());

  for (let i = 1; i < k; i++) {
    const rand = BigInt("0x" + crypto.randomBytes(32).toString("hex")) % PRIME;
    coeffs.push(rand);
    console.log(`a${i} (random):`, rand.toString());
  }

  const shares = [];
  console.log("\n📤 Generating Shares:");
  for (let x = 1; x <= n; x++) {
    let y = 0n;
    const bx = BigInt(x);

    for (let i = 0; i < coeffs.length; i++) {
      y = mod(y + coeffs[i] * (bx ** BigInt(i)));
    }

    console.log(`Share ${x}: x=${x}, y=${y.toString()}`);

    shares.push({
      x,
      y: y.toString()
    });
  }

  return shares;
}

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
  return modPow(a, PRIME - 2n);
}

export function lagrange(shares) {
  console.log("\n🔄 Reconstructing Secret from Shares...");
  let secret = 0n;

  for (let j = 0; j < shares.length; j++) {
    const xj = BigInt(shares[j].x);
    const yj = BigInt(shares[j].y);

    console.log(`\nUsing Share: x=${xj}, y=${yj}`);

    let lj = 1n;

    for (let m = 0; m < shares.length; m++) {
      if (m !== j) {
        const xm = BigInt(shares[m].x);
        console.log(`   Lagrange step with xm=${xm}`);
        lj = mod(lj * mod(0n - xm) * invert(xj - xm));
      }
    }

    console.log("   Lagrange basis Lj:", lj.toString());
    secret = mod(secret + yj * lj);
  }

  const hex = secret.toString(16).padStart(64, "0");
  console.log("\n✅ Recovered Secret (hex):", hex);

  return Buffer.from(hex, "hex");
}
