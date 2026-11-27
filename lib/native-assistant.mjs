import {calculatorReply} from './native-calculator.mjs';
import {logicReply} from './logical-verification.mjs';
export function nativeReply(text){return calculatorReply(text)||logicReply(text);}
