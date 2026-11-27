import {calculatorReply} from './native-calculator.mjs';
import {recallReply} from './conversation-journal.mjs';
export {normalizeArchive,archiveTurns} from './conversation-journal.mjs';
import {logicReply} from './logical-verification.mjs';
export function nativeReply(text,context={}){return calculatorReply(text)||logicReply(text)||recallReply(text,context);}
