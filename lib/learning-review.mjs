import {normalizeMemory} from './cognitive-memory.mjs';
export function reviewLearning(input){const memory=normalizeMemory(input);if(!memory||memory.kind==='working')throw Error('Invalid learning candidate');return {memory,requiresApproval:true,approved:false,persisted:false};}
