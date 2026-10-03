import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
createServer(async(req,res)=>{
  try{
    const file=req.url=='/'?'dist/index.html':req.url.slice(1);
    const target=path.resolve(root,file);
    if(!target.startsWith(root))throw Error();
    const body=await readFile(target);
    res.setHeader('Content-Type',target.endsWith('.html')?'text/html':target.endsWith('.js')?'text/javascript':'application/octet-stream');
    res.end(body);
  }catch{res.statusCode=404;res.end('Not found')}
}).listen(1313,'127.0.0.1',()=>console.log('Prism Ember: http://127.0.0.1:1313'));
