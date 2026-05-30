export const calc1RM = (weight: number, reps: number): number => {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  // Epley formula
  return Math.round(weight * (1 + (reps / 30)));
};
