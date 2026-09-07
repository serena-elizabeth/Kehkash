const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

initializeApp({
  credential: applicationDefault(),
  projectId: 'dil-e-kehkash',
})

const uid = process.argv[2]

if (!uid) {
  throw new Error('Usage: node setRole.js <Firebase UID>')
}

async function main() {
  await getAuth().setCustomUserClaims(uid, {
    admin: true,
  })

  console.log('Admin claim added successfully. Have the user sign out and in again.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
