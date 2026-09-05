const selectedRoleKey = 'connecto.selectedRole'

export function saveSelectedRole(role) {
  window.localStorage.setItem(selectedRoleKey, role)
}

export function getSelectedRole() {
  return window.localStorage.getItem(selectedRoleKey)
}
