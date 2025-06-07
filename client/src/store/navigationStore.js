import { createSlice } from '@reduxjs/toolkit';

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    currentPath: '/',
    previousPath: '/',
  },
  reducers: {
    updateCurrentPath: (state, action) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
    }
  }
});

export const { updateCurrentPath } = navigationSlice.actions;
export default navigationSlice.reducer;
