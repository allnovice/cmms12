import { rtdb } from "../chatTypesAndHooks";
import { ref, push } from "firebase/database";

export async function saveSurveyAnswer(entry: any) {
  const answersRef = ref(rtdb, "survey/answers");
  return push(answersRef, entry);
}
