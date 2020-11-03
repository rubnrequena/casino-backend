const redisRepo = require("../repositorio/redis-repo");

before(async () => {
  await redisRepo.flush();
});
