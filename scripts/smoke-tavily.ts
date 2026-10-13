import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY is missing');
import { searchWeb } from '../src/lib/backend/providers';
import { prepareEvidence } from '../src/lib/backend/evidence';
async function main(){
  const result=await searchWeb('Renewable Energy','Germany');
  const sources=prepareEvidence(result.sources);
  console.log(JSON.stringify({ usable_sources:sources.length,hosts:sources.map(s=>new URL(s.url).hostname),query:result.query },null,2));
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Tavily smoke test failed');process.exitCode=1;});
