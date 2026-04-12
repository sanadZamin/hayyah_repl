import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import bookingsRouter from "./bookings";
import techniciansRouter from "./technicians";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import usersRouter from "./users";
import pricingRouter from "./pricing";

const router: IRouter = Router();

router.use(authRouter);
router.use(pricingRouter);
router.use(tasksRouter);
router.use(usersRouter);
router.use(healthRouter);
router.use(customersRouter);
router.use(bookingsRouter);
router.use(techniciansRouter);
router.use(servicesRouter);
router.use(dashboardRouter);

export default router;
