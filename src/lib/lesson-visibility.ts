/** Public visibility only; staff retain access through includeDrafts/includeHidden. */
export function isHiddenTeacher(name: string) {
  return name.toLowerCase().includes("sara wurtzel");
}

export function publicLessonSql(alias = "l") {
  if (!/^[a-z][a-z0-9_]*$/i.test(alias)) throw new Error("Invalid SQL alias");
  return `${alias}.status='publish' AND instr(lower(${alias}.speaker), 'sara wurtzel') = 0`;
}
