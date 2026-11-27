import {reviewLearning} from './learning-review.mjs';
// Draft from explicit user-authored lesson and existing saved mission metadata only.
export function draftMissionLesson(mission,input){
 if(!mission||typeof mission.id!=='string'||typeof input?.lesson!=='string'||!input.lesson.trim()||input.lesson.length>2000||typeof input.title!=='string')throw Error('Invalid lesson');
 const summary=JSON.parse(mission.summary);if(!Array.isArray(summary.results))throw Error('Invalid mission summary');
 const candidate=reviewLearning({kind:'procedural',title:input.title,content:input.lesson,source:'Mission '+mission.id+' — user-authored lesson; outcome metadata only'});
 return {...candidate,missionId:mission.id,verifiedTruth:false};
}
