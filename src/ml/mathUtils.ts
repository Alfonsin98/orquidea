export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sigmoid(z: number): number {
  const safeZ = clamp(z, -30, 30);
  return 1 / (1 + Math.exp(-safeZ));
}

/**
 * Resuelve el posterior Bayesiano Ridge en forma cerrada:
 *   (X^T W X + lambda * I) * beta = X^T W y + lambda * priorBeta
 * Cuando no hay muestras (N = 0), retorna exactamente priorBeta.
 * A medida que N crece en SQLite, los pesos convergen hacia la evidencia empírica del usuario.
 */
export function solveBayesianRidge(
  X: number[][],
  y: number[],
  sampleWeights: number[],
  lambda: number,
  priorBeta: number[]
): number[] {
  const d = priorBeta.length;
  if (d === 0) return [];
  if (X.length === 0 || X.length !== y.length) {
    return [...priorBeta];
  }

  // Construir A = X^T W X + lambda * I  (d x d)
  // y b = X^T W y + lambda * priorBeta  (d)
  const A: number[][] = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (__, j) => (i === j ? lambda : 0))
  );
  const b: number[] = priorBeta.map((p) => lambda * p);

  for (let n = 0; n < X.length; n++) {
    const row = X[n];
    const w = Math.max(0.01, sampleWeights[n] ?? 1);
    const target = y[n];
    for (let i = 0; i < d; i++) {
      const wXi = w * (row[i] ?? 0);
      b[i] += wXi * target;
      for (let j = 0; j < d; j++) {
        A[i][j] += wXi * (row[j] ?? 0);
      }
    }
  }

  return gaussianEliminationSolve(A, b, priorBeta);
}

/**
 * Eliminación Gaussiana con pivoteo parcial para matriz lineal densa pequeña (d <= 20).
 */
export function gaussianEliminationSolve(
  matrix: number[][],
  rhs: number[],
  fallback: number[]
): number[] {
  const n = rhs.length;
  const aug: number[][] = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const candidate = Math.abs(aug[r][col]);
      if (candidate > maxAbs) {
        maxAbs = candidate;
        pivotRow = r;
      }
    }

    if (maxAbs < 1e-10) {
      return [...fallback];
    }

    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }

    const pivotVal = aug[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = aug[r][col] / pivotVal;
      for (let c = col; c <= n; c++) {
        aug[r][c] -= factor * aug[col][c];
      }
    }
  }

  const solution = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * solution[j];
    }
    solution[i] = sum / aug[i][i];
  }

  return solution;
}

export function dotProduct(a: number[], b: number[]): number {
  let acc = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    acc += a[i] * b[i];
  }
  return acc;
}

export function weightedEuclideanSimilarity(
  a: number[],
  b: number[],
  weights: number[]
): number {
  let sqDist = 0;
  let wSum = 0;
  const len = Math.min(a.length, b.length, weights.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    const w = weights[i];
    sqDist += w * diff * diff;
    wSum += w;
  }
  const normalizedDist = Math.sqrt(sqDist / Math.max(1e-6, wSum));
  return Math.exp(-2.2 * normalizedDist);
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToUint8Array(base64Input: string): Uint8Array {
  const clean = base64Input.replace(/^data:[^;]+;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLength = Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
  const bytes = new Uint8Array(byteLength);

  let byteIdx = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = BASE64_CHARS.indexOf(clean[i]);
    const c2 = BASE64_CHARS.indexOf(clean[i + 1]);
    const c3 = clean[i + 2] === '=' ? 0 : Math.max(0, BASE64_CHARS.indexOf(clean[i + 2]));
    const c4 = clean[i + 3] === '=' ? 0 : Math.max(0, BASE64_CHARS.indexOf(clean[i + 3]));

    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (byteIdx < byteLength) bytes[byteIdx++] = (triple >> 16) & 0xff;
    if (byteIdx < byteLength) bytes[byteIdx++] = (triple >> 8) & 0xff;
    if (byteIdx < byteLength) bytes[byteIdx++] = triple & 0xff;
  }

  return bytes;
}

export function rgbToHsv(r255: number, g255: number, b255: number): {
  h: number;
  s: number;
  v: number;
} {
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-5) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

