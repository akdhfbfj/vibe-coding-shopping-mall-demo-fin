export function isAdminUser(user) {
  return user?.user_type === 'admin'
}
