import bcrypt from 'bcryptjs'

interface StaffData {
  name: string
  role: string
  phone: string
  joinedAt: string
}

export function generatePassword(staffData: StaffData): string {
  const { name, role, phone, joinedAt } = staffData
  
  // Extract components for password generation
  const nameInitial = name.charAt(0).toUpperCase()
  const roleInitial = role.charAt(0).toLowerCase()
  
  // Extract numbers from phone (last 2 digits)
  const phoneNumbers = phone.replace(/\D/g, '').slice(-2)
  
  // Extract number from joining date (day)
  const joinDate = new Date(joinedAt)
  const dayNumber = joinDate.getDate().toString().padStart(2, '0')
  
  // Special characters array
  const specialChars = ['@', '#', '$', '&', '*']
  const specialChar = specialChars[name.length % specialChars.length]
  
  // Create 5-character password: 2 letters + 2 numbers + 1 special char
  let password = ''
  
  // Add first letter from name
  password += nameInitial
  
  // Add first letter from role
  password += roleInitial
  
  // Add 2 numbers (from phone or date)
  if (phoneNumbers.length >= 2) {
    password += phoneNumbers
  } else {
    password += dayNumber
  }
  
  // Add special character
  password += specialChar
  
  return password
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}
