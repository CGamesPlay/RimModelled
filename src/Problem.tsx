import { ProblemType } from "./useRimworld";

export function renderProblem(
  name: string,
  problem: ProblemType,
  otherName: string
): string {
  if (problem === "badEngine") {
    return `${name} is incompatible with this version of RimWorld`;
  } else if (problem === "incompatibleWith") {
    return `${name} is incompatible with ${otherName}`;
  } else if (problem === "wantsBefore") {
    return `${name} should be before ${otherName}`;
  } else if (problem === "wantsAfter") {
    return `${name} should be after ${otherName}`;
  } else if (problem === "requires") {
    return `${name} depends on ${otherName}`;
  } else {
    return `${name} ${problem} ${otherName}`;
  }
}
