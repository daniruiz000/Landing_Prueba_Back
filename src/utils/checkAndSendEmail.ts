import moment from "moment";
import dotenv from "dotenv";

import { userDto } from "../domain/dto/user.dto";
import { excelDto } from "../domain/dto/excel.dto";
import { mailDto } from "../domain/dto/mail.dto";

dotenv.config();

const spainTimezone = "Europe/Madrid";

const finishDate = process.env.PROMOTION_FINISH_DATE as string;
const finishDateParsed = moment(finishDate, "YYYY-MM-DD HH:mm:ss") || undefined;

const maxUsersLimit = parseInt(process.env.PROMOTION_MAX_USERS_LIMIT as string) || undefined;
let isMailSent = false;

export const checkAndSendEmail = async (): Promise<void> => {
  const actualDate = moment().tz(spainTimezone);

  console.log({ finishDateParsed }, { actualDate }, actualDate >= finishDateParsed);

  if (!isMailSent) {
    const numberOfUsers = await userDto.countUsers();

    if (actualDate.toDate() >= finishDateParsed.toDate() || (maxUsersLimit && numberOfUsers >= maxUsersLimit)) {
      console.log("¡Es hora de enviar el correo electrónico!");
      const workbook = await excelDto.createExcelWithUsers();
      await mailDto.sendExcelByEmail(workbook);
      isMailSent = true;
    }
  }
};
