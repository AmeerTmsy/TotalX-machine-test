import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { RootState } from '../../store'
import { db } from '../../../config/firebase'
import { formatMobileNumber } from '../../../validations/login.schema'

export interface UserProfile {
  mobileNumber: string
  firstName: string
  lastName: string
  email: string
}

interface AuthState {
  isAuthenticated: boolean
  otpVerified: boolean
  mobileNumber: string
  firstName: string
  lastName: string
  email: string
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  otpVerified: false,
  mobileNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  loading: false,
  error: null,
}

const getUserDocRef = (mobileNumber: string) => doc(db, 'users', mobileNumber)

const loadUserFromFirestore = async (mobileNumber: string): Promise<UserProfile | null> => {
  const formattedNumber = formatMobileNumber(mobileNumber)
  const snapshot = await getDoc(getUserDocRef(formattedNumber))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

const saveUserToFirestore = async (user: UserProfile): Promise<UserProfile> => {
  const formattedUser = {
    ...user,
    mobileNumber: formatMobileNumber(user.mobileNumber),
    createdAt: new Date().toISOString(),
  }

  await setDoc(getUserDocRef(formattedUser.mobileNumber), formattedUser)
  return formattedUser
}

/**
 * Checks Firestore for an existing user after successful OTP verification.
 */
export const checkUserAfterOtp = createAsyncThunk(
  'auth/checkUserAfterOtp',
  async (mobileNumber: string, { rejectWithValue }) => {
    try {
      const user = await loadUserFromFirestore(mobileNumber)

      return {
        exists: Boolean(user),
        user,
        mobileNumber: formatMobileNumber(mobileNumber),
      }
    } catch {
      return rejectWithValue('Could not check if the user exists. Please try again.')
    }
  }
)

/**
 * Saves the user's profile to Firestore during registration.
 */
export const registerUserInDb = createAsyncThunk(
  'auth/registerUserInDb',
  async (
    payload: { firstName: string; lastName: string; email: string },
    { getState, rejectWithValue }
  ) => {
    const { mobileNumber } = (getState() as RootState).auth

    if (!mobileNumber) {
      return rejectWithValue('Phone number is missing. Please log in again.')
    }

    try {
      const user = await saveUserToFirestore({
        mobileNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
      })

      return user
    } catch {
      return rejectWithValue('Could not create your account. Please try again.')
    }
  }
)

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => initialState,
    clearAuthError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUserAfterOtp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(checkUserAfterOtp.fulfilled, (state, action) => {
        state.loading = false
        state.mobileNumber = action.payload.mobileNumber

        if (action.payload.exists && action.payload.user) {
          state.isAuthenticated = true
          state.otpVerified = false
          state.firstName = action.payload.user.firstName
          state.lastName = action.payload.user.lastName
          state.email = action.payload.user.email
          return
        }

        state.isAuthenticated = false
        state.otpVerified = true
        state.firstName = ''
        state.lastName = ''
        state.email = ''
      })
      .addCase(checkUserAfterOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(registerUserInDb.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUserInDb.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.otpVerified = false
        state.mobileNumber = action.payload.mobileNumber
        state.firstName = action.payload.firstName
        state.lastName = action.payload.lastName
        state.email = action.payload.email
      })
      .addCase(registerUserInDb.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearAuthError } = authSlice.actions

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectOtpVerified = (state: RootState) => state.auth.otpVerified
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error
export const selectUser = (state: RootState) => state.auth

export default authSlice.reducer
