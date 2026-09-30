// Token numbers are alphanumeric - "A9" -> "A10" -> "B1" - so numeric coercion
// cannot order them. parseFloat("A10") is NaN, which made the previous
// comparator return NaN and silently fall back to the server's own ordering.
//
// The same letter-prefix / numeric-suffix split is used server-side in
// skinTestsController, so the two orderings agree.
const parseTokenNo = (value) => {
  const match = String(value ?? '').match(/^([A-Za-z]*)(\d*)$/);
  if (!match) return { letters: '', numbers: 0 };
  return {
    letters: match[1].toUpperCase(),
    numbers: parseInt(match[2], 10) || 0
  };
};

// Newest first: highest letter prefix, then highest number within it.
export const compareTokenNo = (a, b) => {
  const left = parseTokenNo(a?.tokenNo);
  const right = parseTokenNo(b?.tokenNo);
  if (left.letters !== right.letters) {
    return left.letters < right.letters ? 1 : -1;
  }
  return right.numbers - left.numbers;
};

export const sortTokensByTokenNo = (tokens) => [...tokens].sort(compareTokenNo);
