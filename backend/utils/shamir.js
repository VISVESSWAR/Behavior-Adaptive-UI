import crypto from "crypto";

const PRIME = 208351617316091241234326746312124448251n;
const mod = x => ((x % PRIME) + PRIME) % PRIME;

export function shamirSplit(secretBuffer, n, k) {
    const secret = BigInt("0x" + secretBuffer.toString("hex"));

    const coeffs = [secret];
    for (let i = 1; i < k; i++) {
        coeffs.push(BigInt("0x" + crypto.randomBytes(32).toString("hex")));
    }

    const shares = [];
    for (let x = 1; x <= n; x++) {
        let y = 0n;
        for (let i = 0; i < coeffs.length; i++) {
            y = mod(y + coeffs[i] * (BigInt(x) ** BigInt(i)));
        }
        shares.push({ x, y: y.toString() });
    }

    return shares;
}

function invert(a) {
    return mod(a ** (PRIME - 2n));
}

export function lagrange(shares) {
    let secret = 0n;

    for (let j = 0; j < shares.length; j++) {
        let xj = BigInt(shares[j].x);
        let yj = BigInt(shares[j].y);
        let lj = 1n;

        for (let m = 0; m < shares.length; m++) {
            if (m !== j) {
                let xm = BigInt(shares[m].x);
                lj = mod(lj * mod((0n - xm) * invert(xj - xm)));
            }
        }

        secret = mod(secret + yj * lj);
    }

    return Buffer.from(secret.toString(16), "hex");
}
