import type { ProblemType, Problem } from "./Problem";

export type { ProblemType, Problem };

function renderProblem(
  name: React.ReactNode,
  problem: ProblemType,
  otherName: React.ReactNode
): React.ReactNode {
  if (problem === "missing") {
    return <>{name} is not installed.</>;
  } else if (problem === "badEngine") {
    return <>{name} is incompatible with this version of RimWorld.</>;
  } else if (problem === "incompatibleWith") {
    return (
      <>
        {name} is incompatible with {otherName}.
      </>
    );
  } else if (problem === "wantsBefore") {
    return (
      <>
        {name} should be before {otherName}.
      </>
    );
  } else if (problem === "wantsAfter") {
    return (
      <>
        {name} should be after {otherName}.
      </>
    );
  } else if (problem === "requires") {
    return (
      <>
        {name} depends on {otherName}.
      </>
    );
  } else {
    return (
      <>
        {name} {problem} {otherName}.
      </>
    );
  }
}

type ProblemDescriptionProps = {
  problem: Problem;
  index: Record<string, Mod>;
  onSelectMod?(id: string): void;
};

export function ProblemDescription({
  problem,
  index,
  onSelectMod,
}: ProblemDescriptionProps): React.ReactElement {
  const name = index[problem.packageId]?.name ?? problem.packageId;
  const otherModName =
    index[problem.otherPackageId]?.name ?? problem.otherPackageId;
  const otherModLink =
    onSelectMod && index[problem.otherPackageId] ? (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectMod(problem.otherPackageId);
        }}
      >
        {otherModName}
      </a>
    ) : (
      otherModName
    );
  return <>{renderProblem(name, problem.type, otherModLink)}</>;
}
