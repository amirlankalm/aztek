/**
 * A deterministic function that maps a string to a 1536-dimensional array
 * pseudo-randomly to mock OpenAI embeddings for localized processing.
 */
export function generateDeterministicEmbedding(input: string): number[] {
  const vector = new Array(1536).fill(0);
  
  // Simple seed hash
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = (seed << 5) - seed + input.charCodeAt(i);
    seed |= 0; 
  }
  
  // Deterministic random
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate -1 to 1 vector values
  let magnitude = 0;
  for (let i = 0; i < 1536; i++) {
    const val = random() * 2 - 1;
    vector[i] = val;
    magnitude += val * val;
  }
  
  // Normalize vector
  magnitude = Math.sqrt(magnitude);
  for (let i = 0; i < 1536; i++) {
    vector[i] /= magnitude;
  }
  
  return vector;
}
