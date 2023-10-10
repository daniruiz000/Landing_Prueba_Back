import { Router, type Request, type Response, type NextFunction } from "express";
import { isAuth } from "../server/auth.middleware";
import { userService } from "../domain/services/user.service";
import { generateToken } from "../utils/token";
import { excelService } from "../domain/services/excel.service";
import { mailService } from "../domain/services/mail.service";
import { CustomError } from "../server/checkErrorRequest.middleware";
import { userDto } from "../domain/dto/user.dto";
import moment from "moment";

const authEmail: string = process.env.AUTH_EMAIL as string;
const authPassword: string = process.env.AUTH_PASSWORD as string;
const maxUsersLimit = parseInt(process.env.MAX_USERS_LIMIT as string) || undefined;
const finishDate = process.env.FINISH_DATE as string;
const finishDateParsed = moment(finishDate, "DD:MM:YY - HH:mm:ss").toDate() || undefined;

const userRouter = Router();

userRouter.get("/generate-excel-and-send-mail", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.email === authEmail && req.password === authPassword) {
      const workbook = await excelService.generateExcel();
      await mailService.sendExcelByEmail(workbook);

      res.status(200).send("Archivo Excel enviado por correo electrónico.");
    } else {
      throw new CustomError("No tienes autorización para realizar esta operación", 403);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actualDate = new Date();

    // Verificar si FINISH_DATE está definido y si la fecha actual es posterior a la fecha de finalización
    if (finishDateParsed && actualDate >= finishDateParsed) {
      throw new CustomError("Se ha alcanzado la fecha de finalización, no se pueden añadir más usuarios", 400);
    }

    // Verificar si MAX_USERS_LIMIT está definido y se ha alcanzado el límite máximo de usuarios
    if (maxUsersLimit) {
      const numberOfUsers = await userDto.countUsers();
      if (numberOfUsers >= maxUsersLimit) {
        throw new CustomError("Se ha alcanzado el límite máximo de usuarios permitidos", 400);
      }
    }

    const newUser = await userService.createUser(req, next);
    if (newUser) {
      return res.status(201).send("Usuario añadido correctamente.");
    }
  } catch (error) {
    next(error);
  }
});

userRouter.get("/", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.email === authEmail && req.password === authPassword) {
      const users = await userService.getAllUser(next);
      res.json(users);
    } else {
      throw new CustomError("No tienes autorización para realizar esta operación", 403);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Se deben especificar los campos email y password" });
    }

    const match = email === authEmail && password === authPassword;

    if (!match) {
      throw new CustomError("Email y/o contraseña incorrectos", 401);
    }

    const jwtToken = generateToken(email, password);
    console.log(`Usuario ${email} logado correctamente`);
    return res.status(200).json({ token: jwtToken });
  } catch (error) {
    next(error);
  }
});

userRouter.get("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.email === authEmail && req.password === authPassword) {
      const idReceivedInParams = parseInt(req.params.id);
      const user = await userService.getUserById(idReceivedInParams, next);
      if (user) {
        return res.json(user);
      }
    } else {
      throw new CustomError("Email y/o contraseña incorrectos", 403);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.put("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.email === authEmail && req.password === authPassword) {
      const updateUser = await userService.updateUser(req, next);
      if (updateUser) {
        return res.status(200).send("Usuario actualizado correctamente.");
      }
    } else {
      throw new CustomError("Email y/o contraseña incorrectos", 403);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.delete("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.email === authEmail && req.password === authPassword) {
      const idReceivedInParams = parseInt(req.params.id);
      const userDeleted = await userService.deleteUserById(idReceivedInParams, next);
      if (userDeleted) {
        return res.status(200).send("Usuario borrado correctamente.");
      }
    } else {
      throw new CustomError("Email y/o contraseña incorrectos", 403);
    }
  } catch (error) {
    next(error);
  }
});

export default userRouter;
