import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './navigationStore';

// Create Redux store
const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    // ...other reducers
  },
});

export default store;
