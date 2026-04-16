import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

interface Schema {
  simulations: any[];
  agents: any[];
  interactions: any[];
  knowledge_graph: any[];
}

export function readDB(): Schema {
  if (!fs.existsSync(DB_FILE)) {
    return { simulations: [], agents: [], interactions: [], knowledge_graph: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

export function writeDB(data: Schema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Reset DB helper
export function resetDB() {
  writeDB({ simulations: [], agents: [], interactions: [], knowledge_graph: [] });
}
