import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { formatMobileNumber } from '../../../validations/login.schema'

export interface UserProfile { mobileNumber: string; firstName: string; lastName: string; email: string }

interface LoginStatusState {
  loginStatus: boolean; otpVerified: boolean; mobileNumber: string; firstName: string;
  lastName: string; email: string; loading: boolean; error: string | null
}

type LoginStatusRootState = { loginStatus: LoginStatusState }

const initialState: LoginStatusState = {
  loginStatus: false,
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

// Step 1 after OTP: check Firestore for an existing user with this phone number.
export const checkUserAfterOtp = createAsyncThunk(
  'loginStatus/checkUserAfterOtp',
  async (mobileNumber: string, { rejectWithValue }) => {
    try {
      const user = await loadUserFromFirestore(mobileNumber)

      return {
        exists: Boolean(user),
        user,
        mobileNumber: formatMobileNumber(mobileNumber),
      }
    } catch (error) {
      console.error("checkUserAfterOtp failed in loginSlice:", error)
      return rejectWithValue('Could not check if the user exists. Please try again.')
    }
  }
)

// Step 2 for new users: save profile to Firestore after the register form is submitted.
export const registerUserInDb = createAsyncThunk(
  'loginStatus/registerUserInDb',
  async (
    payload: { firstName: string; lastName: string; email: string },
    { getState, rejectWithValue }
  ) => {
    const { mobileNumber } = (getState() as LoginStatusRootState).loginStatus

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
    } catch (error) {
      console.error("registerUserInDb failed in loginSlice:", error)
      return rejectWithValue('Could not create your account. Please try again.')
    }
  }
)

export const loginStatusSlice = createSlice({
  name: 'loginStatus',
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
          state.loginStatus = true
          state.otpVerified = false
          state.firstName = action.payload.user.firstName
          state.lastName = action.payload.user.lastName
          state.email = action.payload.user.email
          return
        }

        state.loginStatus = false
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
        state.loginStatus = true
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

export const { logout, clearAuthError } = loginStatusSlice.actions

export const selectLoginStatus = (state: LoginStatusRootState) => state.loginStatus.loginStatus
export const selectOtpVerified = (state: LoginStatusRootState) => state.loginStatus.otpVerified
export const selectAuthLoading = (state: LoginStatusRootState) => state.loginStatus.loading
export const selectAuthError = (state: LoginStatusRootState) => state.loginStatus.error
export const selectUser = (state: LoginStatusRootState) => state.loginStatus

export default loginStatusSlice.reducer
