import dotenv from "dotenv";

import { app } from "./server/index";
import { checkAndSendEmail } from "./utils/checkAndSendEmail";
import { AppDataSource } from "./domain/repositories/typeorm-datasource";

dotenv.config();

const API_PORT: string = process.env.API_PORT as string;

export const appInstance = app.listen(API_PORT, async () => {
  await AppDataSource.initialize();
  setInterval(checkAndSendEmail, 60000);
  console.log(`Server levantado en el puerto ${API_PORT}`);
});
