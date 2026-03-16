import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import bookingsRouter from "./bookings";
import techniciansRouter from "./technicians";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customersRouter);
router.use(bookingsRouter);
router.use(techniciansRouter);
router.use(servicesRouter);
router.use(dashboardRouter);

export default router;
