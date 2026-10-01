export const PASSWORD_MIN_LENGTH = 6;

// Mirrors the rules enforced by the server (validateChangePassword)
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH
  },
  {
    id: 'letter',
    label: 'Contains a letter',
    test: (value) => /[a-zA-Z]/.test(value)
  },
  {
    id: 'number',
    label: 'Contains a number',
    test: (value) => /\d/.test(value)
  },
];

export const isPasswordValid = (value = '') => PASSWORD_RULES.every((rule) => rule.test(value));

const STRENGTH_LEVELS = [
  { id: 'weak', label: 'Weak', barClass: 'bg-red-500', textClass: 'text-red-600' },
  { id: 'fair', label: 'Fair', barClass: 'bg-amber-500', textClass: 'text-amber-600' },
  { id: 'good', label: 'Good', barClass: 'bg-lime-500', textClass: 'text-lime-600' },
  { id: 'strong', label: 'Strong', barClass: 'bg-emerald-600', textClass: 'text-emerald-600' },
];

export const getPasswordStrength = (value = '') => {
  if (!value) return { ...STRENGTH_LEVELS[0], score: 0, bars: 0 };

  const satisfied = PASSWORD_RULES.filter((rule) => rule.test(value)).length;

  let score = satisfied;
  if (value.length >= 10) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  score = Math.min(score, 4);

  return { ...STRENGTH_LEVELS[score - 1] || STRENGTH_LEVELS[0], score, bars: score };
};