const fs=require('fs');
const path=require('path');
const dir='c:/Users/mzaky/Downloads/MDM-master (1)/MDM-master/frontend/components';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.tsx')&&!f.startsWith('assets-'));
console.log('Found files:', files.length);

for(const f of files){
    const fullPath=path.join(dir,f);
    let original=fs.readFileSync(fullPath,'utf8');
    
    // First, remove old translate classes around zoom-in
    let content = original;
    
    // Simplest replacement: find "animate-in zoom-in" and inject translate-x-30
    content = content.replace(/zoom-in-95/g, 'zoom-in-95 translate-x-30');
    
    // In case we double-applied
    content = content.replace(/translate-x-30 translate-x-30/g, 'translate-x-30');
    content = content.replace(/translate-x-35 translate-y-5 translate-x-30/g, 'translate-x-30 translate-y-5');

    if(content!==original){
        fs.writeFileSync(fullPath,content);
        console.log('Update file:', f);
    }
}
