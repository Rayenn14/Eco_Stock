const { PrismaClient } = require('@prisma/client');

// Prisma $queryRaw retourne BigInt pour COUNT/SUM - permettre la serialisation JSON
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// Singleton PrismaClient - evite les connexions multiples en dev
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
