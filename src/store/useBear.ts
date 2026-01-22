import { create } from 'zustand';

interface UseBearState {
  bears: number;
  increasePopulation: () => void,
  updateBears: (newBears: number) => void,
}

export const useBear = create<UseBearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears })
}));