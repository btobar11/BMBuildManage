import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';

console.log('--- @thatopen/components ---');
console.log(Object.keys(OBC).filter(k => k.toLowerCase().includes('plan')));

import fs from 'fs';
fs.writeFileSync('c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\tmp\\exports_obf.txt', JSON.stringify(Object.keys(OBF).sort(), null, 2));
fs.writeFileSync('c:\\Users\\benja\\OneDrive\\Escritorio\\BMBuildManage\\tmp\\exports_obc.txt', JSON.stringify(Object.keys(OBC).sort(), null, 2));
