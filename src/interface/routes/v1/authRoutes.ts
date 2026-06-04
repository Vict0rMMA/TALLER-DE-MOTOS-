import { Router } from 'express';
import { register, signup, login, getWorkshopUsers, getWorkshop, updateWorkshop, deactivateUser, getInviteCode, regenerateInviteCode, registerWithCode } from '../../controllers/authController';
import { validateDto } from '../../middlewares/validateDto';
import { RegisterUserDto } from '../../../infrastructure/validators/auth/RegisterUserDto';
import { SignupDto } from '../../../infrastructure/validators/auth/SignupDto';
import { LoginUserDto } from '../../../infrastructure/validators/auth/LoginUserDto';
import { authenticate, requireRole } from '../../middlewares/authMiddleware';
import { authRateLimit } from '../../middlewares/rateLimitMiddleware';

const router = Router();

router.post('/signup', authRateLimit, validateDto(SignupDto), signup);
router.post('/register-with-code', authRateLimit, registerWithCode);
router.post('/register', authenticate, requireRole('owner'), validateDto(RegisterUserDto), register);
router.post('/login', authRateLimit, validateDto(LoginUserDto), login);

router.get('/users', authenticate, requireRole('owner'), getWorkshopUsers);
router.delete('/users/:id', authenticate, requireRole('owner'), deactivateUser);
router.get('/workshop', authenticate, getWorkshop);
router.put('/workshop', authenticate, requireRole('owner'), updateWorkshop);
router.get('/invite-code', authenticate, requireRole('owner'), getInviteCode);
router.post('/invite-code/regenerate', authenticate, requireRole('owner'), regenerateInviteCode);

export default router;
