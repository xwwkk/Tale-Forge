import prisma from '../src/prisma'

async function main() {
  await prisma.user.create({
    data: {
      address: '0x123...',
      penName: '测试作者'
    }
  })
}

main() 