import {resumeDraft} from './mission-resume.mjs';
// Stored summaries contain no original task queries; supplied definitions are not verified against the original mission.
export function resumeFromSummary(tasks,summary){if(!Array.isArray(summary?.results))throw Error('Invalid summary');const draft=resumeDraft(tasks,summary.results.map(r=>({id:r.id,status:r.status})));return {...draft,source:'stored-outcome-summary',originalDefinitionsVerified:false,previousContextRestored:false,requiresApproval:true};}
