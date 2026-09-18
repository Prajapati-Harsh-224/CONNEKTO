/**
 * UX copy, step state, and field visibility resolver for the unified
 * Identifier-First authentication form.
 *
 * Constraints:
 * 1. Never use negative words like "Error", "Failed", "Account Not Found", or "Invalid Email".
 * 2. Frame new user registration as a welcoming onboarding opportunity.
 * 3. Keep microcopy concise (under 15 words).
 * 4. Outputs:
 *    - formStep: 1 | 2
 *    - heading: string
 *    - subheading: string
 *    - buttonText: string
 *    - showExtraFields: boolean
 */

const ROLE_LABELS = {
  SHOP_OWNER: 'Shop Owner',
  SUPPLIER: 'Supplier',
  GRUH_UDYOG: 'Gruh Udyog',
}

export function getAuthStateConfig(authState = {}, role = null) {
  // Normalize authState inputs
  const stateObj = typeof authState === 'string'
    ? { status: authState }
    : (authState || {})

  const status = (stateObj.status || stateObj.AuthStatus || '').toUpperCase()
  const effectiveRole = role || stateObj.role || null
  const roleName = ROLE_LABELS[effectiveRole]

  // Check if this is a new user / unregistered identifier expansion
  const isExpansion =
    status === 'NOT_FOUND' ||
    status === 'USER_NOT_FOUND' ||
    status === 'REGISTER' ||
    status === 'REGISTER_EXPANSION' ||
    stateObj.formStep === 2 ||
    stateObj.showExtraFields === true

  if (isExpansion) {
    return {
      formStep: 2,
      heading: roleName
        ? `Welcome! Let's set up your ${roleName} account`
        : "Welcome! Let's get you set up",
      subheading: "We couldn't find your account. Let's create your profile to get started!",
      buttonText: 'Complete Registration',
      showExtraFields: true,
    }
  }

  // Returning user with identified account ready for password
  if (status === 'USER_FOUND' || status === 'PASSWORD_STEP' || status === 'EXISTING_USER') {
    return {
      formStep: 1,
      heading: roleName ? `${roleName} Sign In` : 'Welcome Back',
      subheading: 'Enter your password to access your account.',
      buttonText: 'Sign In',
      showExtraFields: false,
    }
  }

  // Initial step 1: Identifier check
  return {
    formStep: 1,
    heading: roleName ? `${roleName} Sign In` : 'Welcome to Connekto',
    subheading: 'Enter your email or phone number to continue.',
    buttonText: 'Continue',
    showExtraFields: false,
  }
}
